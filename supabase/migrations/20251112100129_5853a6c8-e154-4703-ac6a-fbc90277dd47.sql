-- Allow authenticated users to insert only their own 'student' role
CREATE POLICY "Users can insert their own student role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'student');