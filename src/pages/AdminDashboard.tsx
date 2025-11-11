import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, LogOut, Users, BookMarked, Clock } from "lucide-react";
import BooksManagement from "@/components/admin/BooksManagement";
import BorrowRequests from "@/components/admin/BorrowRequests";

const AdminDashboard = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalStudents: 0,
    pendingRequests: 0,
    activeLoans: 0,
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== "admin")) {
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

  if (!user || userRole !== "admin") {
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
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <BookOpen className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="books" className="space-y-4">
          <TabsList>
            <TabsTrigger value="books">Books Management</TabsTrigger>
            <TabsTrigger value="requests">Borrow Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="books" className="space-y-4">
            <BooksManagement onStatsUpdate={(total) => setStats({ ...stats, totalBooks: total })} />
          </TabsContent>
          <TabsContent value="requests" className="space-y-4">
            <BorrowRequests
              onStatsUpdate={(pending, active) =>
                setStats({ ...stats, pendingRequests: pending, activeLoans: active })
              }
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
