import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookCatalog from "@/components/student/BookCatalog";
import MyBorrowings from "@/components/student/MyBorrowings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StudentDashboard = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && (!user || userRole !== "student")) {
      navigate("/auth");
    }
  }, [user, userRole, loading, navigate]);

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

  if (!user || userRole !== "student") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Misbah Library</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="catalog">Browse Books</TabsTrigger>
            <TabsTrigger value="borrowings">My Borrowings</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
            {/* Search Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Book Catalog</CardTitle>
                <CardDescription>Browse and search available books</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, author, or category..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Book Catalog */}
            <BookCatalog searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="borrowings" className="space-y-6">
            <MyBorrowings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
