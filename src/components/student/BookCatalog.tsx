import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredBooks.map((book) => (
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
              {book.publisher && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publisher</span>
                  <span className="font-medium text-right">{book.publisher}</span>
                </div>
              )}
              {book.year_published && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{book.year_published}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Availability</span>
                <div className="flex items-center gap-2">
                  {book.available_count > 0 ? (
                    <>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Available
                      </Badge>
                      <span className="text-sm font-medium">
                        {book.available_count} / {book.total_count}
                      </span>
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
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

      {filteredBooks.length === 0 && (
        <div className="col-span-full">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery ? "No books found matching your search" : "No books available"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookCatalog;
