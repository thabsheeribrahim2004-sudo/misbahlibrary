-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.borrow_status AS ENUM ('pending', 'approved', 'rejected', 'returned');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  roll_no TEXT,
  department TEXT,
  year INTEGER,
  borrow_limit INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  isbn TEXT,
  photo_url TEXT,
  publisher TEXT,
  year_published INTEGER,
  total_count INTEGER NOT NULL DEFAULT 1,
  available_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Everyone can view books"
  ON public.books FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert books"
  ON public.books FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update books"
  ON public.books FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete books"
  ON public.books FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create borrow_requests table
CREATE TABLE public.borrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  issue_date DATE,
  due_date DATE,
  return_date DATE,
  status borrow_status NOT NULL DEFAULT 'pending',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on borrow_requests
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

-- Borrow requests policies
CREATE POLICY "Students can view their own requests"
  ON public.borrow_requests FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all requests"
  ON public.borrow_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create borrow requests"
  ON public.borrow_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Admins can update borrow requests"
  ON public.borrow_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete borrow requests"
  ON public.borrow_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for book photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-photos', 'book-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for book photos
CREATE POLICY "Anyone can view book photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-photos');

CREATE POLICY "Admins can upload book photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-photos' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update book photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'book-photos' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete book photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-photos' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update book availability when borrow request status changes
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When request is approved, decrease available count
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.books
    SET available_count = available_count - 1
    WHERE id = NEW.book_id AND available_count > 0;
  END IF;
  
  -- When book is returned, increase available count
  IF NEW.status = 'returned' AND OLD.status = 'approved' THEN
    UPDATE public.books
    SET available_count = available_count + 1
    WHERE id = NEW.book_id;
  END IF;
  
  -- When request is rejected from approved, increase available count
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE public.books
    SET available_count = available_count + 1
    WHERE id = NEW.book_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update book availability
CREATE TRIGGER on_borrow_request_status_change
  AFTER INSERT OR UPDATE OF status ON public.borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_availability();