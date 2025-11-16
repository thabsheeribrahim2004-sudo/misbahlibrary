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

interface MyBorrowingsProps {
  showActive?: boolean;
}

const MyBorrowings = ({ showActive = true }: MyBorrowingsProps) => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, showActive]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("borrow_requests")
        .select(`
          *,
          books (title, author, photo_url)
        `)
        .eq("student_id", user.id);
      
      // Filter based on showActive prop
      if (showActive) {
        query = query.in("status", ["pending", "approved"]);
      } else {
        query = query.in("status", ["rejected", "returned"]);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

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
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold">{showActive ? "Active Borrowings" : "Transaction History"}</h2>
        <p className="text-muted-foreground">
          {showActive 
            ? "Track your current borrowed books and pending requests" 
            : "View your complete borrowing history"}
        </p>
      </div>

      <div className="grid gap-4">
        {requests.map((request, index) => (
          <Card 
            key={request.id}
            className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
                <div className="flex gap-4 flex-1 w-full">
                  {request.books.photo_url ? (
                    <img
                      src={request.books.photo_url}
                      alt={request.books.title}
                      className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg break-words">{request.books.title}</CardTitle>
                    <CardDescription className="mt-1 break-words">by {request.books.author}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="transition-colors hover:text-primary">
                  <p className="text-muted-foreground text-xs sm:text-sm">Requested</p>
                  <p className="font-medium text-sm sm:text-base">{format(new Date(request.created_at), "PP")}</p>
                </div>
                {request.issue_date && (
                  <div className="transition-colors hover:text-primary">
                    <p className="text-muted-foreground text-xs sm:text-sm">Issue Date</p>
                    <p className="font-medium text-sm sm:text-base">{format(new Date(request.issue_date), "PP")}</p>
                  </div>
                )}
                {request.due_date && (
                  <div className="transition-colors hover:text-primary">
                    <p className="text-muted-foreground text-xs sm:text-sm">Due Date</p>
                    <p className={`font-medium text-sm sm:text-base ${isOverdue(request.due_date) && request.status === "approved" ? "text-destructive animate-pulse" : ""}`}>
                      {format(new Date(request.due_date), "PP")}
                      {isOverdue(request.due_date) && request.status === "approved" && " (Overdue)"}
                    </p>
                  </div>
                )}
                {request.return_date && (
                  <div className="transition-colors hover:text-primary">
                    <p className="text-muted-foreground text-xs sm:text-sm">Returned</p>
                    <p className="font-medium text-sm sm:text-base">{format(new Date(request.return_date), "PP")}</p>
                  </div>
                )}
              </div>

              {request.remarks && (
                <div className="mt-4 p-3 bg-muted rounded-md transition-all hover:bg-muted/80 animate-fade-in">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Admin Remarks</p>
                  <p className="text-sm break-words">{request.remarks}</p>
                </div>
              )}

              {request.status === "pending" && showActive && (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-md animate-fade-in">
                  <p className="text-xs sm:text-sm text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Your request is being reviewed by the library admin
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card className="animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4 transition-transform hover:scale-110" />
            <p className="text-muted-foreground text-center">
              {showActive 
                ? "You don't have any active borrowings" 
                : "No transaction history yet"}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2 max-w-md px-4">
              {showActive 
                ? "Browse the catalog to find books you'd like to borrow" 
                : "Your completed and rejected requests will appear here"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyBorrowings;
