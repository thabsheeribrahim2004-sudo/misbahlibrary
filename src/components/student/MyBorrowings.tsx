import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BorrowRequest {
  id: string;
  book_id: string;
  issue_date: string | null;
  due_date: string | null;
  return_date: string | null;
  status: "pending" | "approved" | "rejected" | "returned";
  remarks: string | null;
  created_at: string;
  books: {
    title: string;
    author: string;
    photo_url?: string;
  };
}

const MyBorrowings = () => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .select(`
          *,
          books (title, author, photo_url)
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error("Error loading borrowings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending Review", icon: Clock, variant: "outline" },
      approved: { label: "Approved", icon: CheckCircle, variant: "default" },
      rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
      returned: { label: "Returned", icon: BookOpen, variant: "secondary" },
    };
    const { label, icon: Icon, variant } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8">Loading your borrowings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">My Borrowings</h2>
        <p className="text-muted-foreground">Track your borrowed books and requests</p>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {request.books.photo_url ? (
                    <img
                      src={request.books.photo_url}
                      alt={request.books.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.books.title}</CardTitle>
                    <CardDescription className="mt-1">by {request.books.author}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p className="font-medium">{format(new Date(request.created_at), "PP")}</p>
                </div>
                {request.issue_date && (
                  <div>
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{format(new Date(request.issue_date), "PP")}</p>
                  </div>
                )}
                {request.due_date && (
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className={`font-medium ${isOverdue(request.due_date) && request.status === "approved" ? "text-destructive" : ""}`}>
                      {format(new Date(request.due_date), "PP")}
                      {isOverdue(request.due_date) && request.status === "approved" && " (Overdue)"}
                    </p>
                  </div>
                )}
                {request.return_date && (
                  <div>
                    <p className="text-muted-foreground">Returned</p>
                    <p className="font-medium">{format(new Date(request.return_date), "PP")}</p>
                  </div>
                )}
              </div>

              {request.remarks && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Admin Remarks</p>
                  <p className="text-sm">{request.remarks}</p>
                </div>
              )}

              {request.status === "pending" && (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-md">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Your request is being reviewed by the library admin
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              You haven't borrowed any books yet
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Browse the catalog to find books you'd like to borrow
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyBorrowings;
