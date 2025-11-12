import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  description: z.string().max(1000).optional(),
  isbn: z.string().max(20).optional(),
  publisher: z.string().max(200).optional(),
  year_published: z.number().min(1000).max(9999).optional(),
  total_count: z.number().min(1, "Must have at least 1 copy"),
  photo_url: z.string().url().optional().or(z.literal("")),
});

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

interface BooksManagementProps {
  onStatsUpdate: (totalBooks: number) => void;
}

const BooksManagement = ({ onStatsUpdate }: BooksManagementProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    isbn: "",
    publisher: "",
    year_published: "",
    total_count: "1",
    photo_url: "",
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBooks(data || []);
      onStatsUpdate(data?.length || 0);
    } catch (error: any) {
      toast.error("Error loading books: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      category: "",
      description: "",
      isbn: "",
      publisher: "",
      year_published: "",
      total_count: "1",
      photo_url: "",
    });
    setEditingBook(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = bookSchema.parse({
        ...formData,
        year_published: formData.year_published ? parseInt(formData.year_published) : undefined,
        total_count: parseInt(formData.total_count),
        photo_url: formData.photo_url || undefined,
      });

      if (editingBook) {
        const { error } = await supabase
          .from("books")
          .update(validatedData)
          .eq("id", editingBook.id);

        if (error) throw error;
        toast.success("Book updated successfully");
      } else {
        const { error } = await supabase
          .from("books")
          .insert([{
            title: validatedData.title,
            author: validatedData.author,
            category: validatedData.category,
            isbn: validatedData.isbn,
            publisher: validatedData.publisher,
            year_published: validatedData.year_published,
            total_count: validatedData.total_count,
            available_count: validatedData.total_count,
            photo_url: validatedData.photo_url,
          }]);

        if (error) throw error;
        toast.success("Book added successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchBooks();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error saving book: " + error.message);
      }
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description || "",
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      year_published: book.year_published?.toString() || "",
      total_count: book.total_count.toString(),
      photo_url: book.photo_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
      toast.success("Book deleted successfully");
      fetchBooks();
    } catch (error: any) {
      toast.error("Error deleting book: " + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Books Management</h2>
          <p className="text-muted-foreground">Add, edit, and manage library books</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
              <DialogDescription>
                {editingBook ? "Update book information" : "Enter details for the new book"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the book..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year Published</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year_published}
                    onChange={(e) => setFormData({ ...formData, year_published: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Copies *</Label>
                  <Input
                    id="total"
                    type="number"
                    min="1"
                    value={formData.total_count}
                    onChange={(e) => setFormData({ ...formData, total_count: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="photo">Photo URL</Label>
                  <Input
                    id="photo"
                    type="url"
                    placeholder="https://example.com/book-cover.jpg"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBook ? "Update Book" : "Add Book"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Card key={book.id}>
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
                    className="w-12 h-16 object-cover rounded ml-2"
                  />
                ) : (
                  <div className="w-12 h-16 bg-muted rounded ml-2 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{book.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {book.available_count} / {book.total_count}
                  </span>
                </div>
                {book.isbn && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ISBN:</span>
                    <span className="font-medium">{book.isbn}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(book)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(book.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No books added yet. Click "Add Book" to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BooksManagement;
