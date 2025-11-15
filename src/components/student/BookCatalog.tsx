import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description?: string;
  isbn?: string;
  photo_url?: string;
  publisher?: string;
  year_published?: number;
  total_count: number;
  available_count: number;
}

interface BookCatalogProps {
  searchQuery: string;
}

const BookCatalog = ({ searchQuery }: BookCatalogProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title");

      if (error) throw error;
      setBooks(data || []);
    } catch (error: any) {
      toast.error("Error loading books: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestBorrow = async (bookId: string, bookTitle: string) => {
    if (!user) {
      toast.error("Please sign in to borrow books");
      return;
    }

    try {
      const { error } = await supabase
        .from("borrow_requests")
        .insert({
          student_id: user.id,
          book_id: bookId,
          status: "pending",
        });

      if (error) throw error;
      toast.success(`Borrow request submitted for "${bookTitle}"`);
    } catch (error: any) {
      if (error.message.includes("duplicate")) {
        toast.error("You already have a pending or active request for this book");
      } else {
        toast.error("Error submitting request: " + error.message);
      }
    }
  };

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query);
    
    const matchesCategory = 
      selectedCategory === "all" || 
      book.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "novel", "autobiography", "study", "reference", "fiction", "non-fiction"];
  const booksByCategory = categories.reduce((acc, cat) => {
    if (cat === "all") {
      acc[cat] = books;
    } else {
      acc[cat] = books.filter(b => b.category.toLowerCase() === cat.toLowerCase());
    }
    return acc;
  }, {} as Record<string, Book[]>);

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>;
  }

  const renderBookGrid = (booksToRender: Book[]) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {booksToRender.map((book) => (
        <Card key={book.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                <CardDescription className="mt-1">{book.author}</CardDescription>
              </div>
              {book.photo_url ? (
                <img
                  src={book.photo_url}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded ml-2"
                />
              ) : (
                <div className="w-16 h-20 bg-muted rounded ml-2 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {book.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {book.description}
              </p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="secondary">{book.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available</span>
                <span className={book.available_count > 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                  {book.available_count} / {book.total_count}
                </span>
              </div>
              {book.publisher && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Publisher</span>
                  <span className="text-xs">{book.publisher}</span>
                </div>
              )}
              {book.year_published && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="text-xs">{book.year_published}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={book.available_count === 0}
              onClick={() => requestBorrow(book.id, book.title)}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Request to Borrow
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
      <TabsList className="mb-4">
        <TabsTrigger value="all">All Books</TabsTrigger>
        <TabsTrigger value="novel">Novel</TabsTrigger>
        <TabsTrigger value="autobiography">Autobiography</TabsTrigger>
        <TabsTrigger value="study">Study</TabsTrigger>
        <TabsTrigger value="reference">Reference</TabsTrigger>
        <TabsTrigger value="fiction">Fiction</TabsTrigger>
        <TabsTrigger value="non-fiction">Non-Fiction</TabsTrigger>
      </TabsList>
      
      {categories.map((category) => (
        <TabsContent key={category} value={category}>
          {renderBookGrid(
            category === "all" 
              ? filteredBooks 
              : filteredBooks.filter(b => b.category.toLowerCase() === category.toLowerCase())
          )}
          {filteredBooks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No books found {category !== "all" ? `in ${category} category` : ""}.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default BookCatalog;
