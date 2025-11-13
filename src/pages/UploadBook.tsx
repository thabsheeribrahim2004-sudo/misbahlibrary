import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LogIn } from "lucide-react";
import BooksManagement from "@/components/admin/BooksManagement";

const UploadBook = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Upload Book | Misbah Library";
    // Basic meta description update for SEO
    const meta = document.querySelector('meta[name="description"]');
    const content = "Upload a library book with photo and description (admin only).";
    if (meta) {
      meta.setAttribute("content", content);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && userRole === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Upload Book</h1>
                <p className="text-sm text-muted-foreground">Add a new book with photo and description</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin")}>Go to Admin</Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <BooksManagement onStatsUpdate={() => {}} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>
              Only administrators can upload books to the library. Please sign in as an admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => navigate("/auth")}> 
              <LogIn className="h-4 w-4 mr-2" />
              Sign in
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UploadBook;
