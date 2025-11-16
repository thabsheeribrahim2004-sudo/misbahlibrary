import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookCatalog from "@/components/student/BookCatalog";
import MyBorrowings from "@/components/student/MyBorrowings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileMenu from "@/components/ProfileMenu";

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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 transition-transform hover:scale-105">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Misbah Library</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 gap-1">
            <TabsTrigger value="catalog" className="text-sm sm:text-base">Browse Books</TabsTrigger>
            <TabsTrigger value="borrowings" className="text-sm sm:text-base">Active</TabsTrigger>
            <TabsTrigger value="history" className="text-sm sm:text-base">History</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6 animate-fade-in">
            {/* Search Bar */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Book Catalog</CardTitle>
                <CardDescription>Browse and search available books</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors" />
                  <Input
                    placeholder="Search by title, author, or category..."
                    className="pl-10 transition-all focus:scale-[1.02]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Book Catalog */}
            <BookCatalog searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="borrowings" className="space-y-6 animate-fade-in">
            <MyBorrowings showActive={true} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6 animate-fade-in">
            <MyBorrowings showActive={false} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
