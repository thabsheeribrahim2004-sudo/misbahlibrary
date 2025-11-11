import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, CalendarIcon, Clock, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BorrowRequest {
  id: string;
  student_id: string;
  book_id: string;
  issue_date: string | null;
  due_date: string | null;
  return_date: string | null;
  status: "pending" | "approved" | "rejected" | "returned";
  remarks: string | null;
  created_at: string;
  profiles: {
    name: string;
    email: string;
    roll_no: string | null;
  };
  books: {
    title: string;
    author: string;
  };
}

interface BorrowRequestsProps {
  onStatsUpdate: (pending: number, active: number) => void;
}

const BorrowRequests = ({ onStatsUpdate }: BorrowRequestsProps) => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("borrow_requests")
        .select(`
          *,
          profiles (name, email, roll_no),
          books (title, author)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      
      const pending = (data || []).filter(r => r.status === "pending").length;
      const active = (data || []).filter(r => r.status === "approved").length;
      onStatsUpdate(pending, active);
    } catch (error: any) {
      toast.error("Error loading requests: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: "approved" | "rejected" | "returned",
    issueDate?: Date,
    dueDate?: Date,
    remarks?: string
  ) => {
    try {
      const updateData: any = { status };
      
      if (status === "approved" && issueDate && dueDate) {
        updateData.issue_date = format(issueDate, "yyyy-MM-dd");
        updateData.due_date = format(dueDate, "yyyy-MM-dd");
      }
      
      if (status === "returned") {
        updateData.return_date = format(new Date(), "yyyy-MM-dd");
      }
      
      if (remarks) {
        updateData.remarks = remarks;
      }

      const { error } = await supabase
        .from("borrow_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;
      
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error: any) {
      toast.error("Error updating request: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "outline" },
      approved: { label: "Approved", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
      returned: { label: "Returned", variant: "secondary" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredRequests = filterStatus === "all" 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Borrow Requests</h2>
          <p className="text-muted-foreground">Review and manage student borrow requests</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onUpdate={updateRequestStatus}
          />
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No {filterStatus !== "all" ? filterStatus : ""} requests found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface RequestCardProps {
  request: BorrowRequest;
  onUpdate: (id: string, status: "approved" | "rejected" | "returned", issueDate?: Date, dueDate?: Date, remarks?: string) => Promise<void>;
}

const RequestCard = ({ request, onUpdate }: RequestCardProps) => {
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  );
  const [remarks, setRemarks] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{request.books.title}</CardTitle>
            <CardDescription className="mt-1">
              by {request.books.author}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Student</p>
            <p className="font-medium">{request.profiles.name}</p>
            {request.profiles.roll_no && (
              <p className="text-sm text-muted-foreground">{request.profiles.roll_no}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium text-sm">{request.profiles.email}</p>
          </div>
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
              <p className="font-medium">{format(new Date(request.due_date), "PP")}</p>
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
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Remarks</p>
            <p className="text-sm">{request.remarks}</p>
          </div>
        )}

        {request.status === "pending" && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "PP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={issueDate} onSelect={setIssueDate} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Textarea
                placeholder="Add any notes or remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => onUpdate(request.id, "approved", issueDate, dueDate, remarks || undefined)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onUpdate(request.id, "rejected", undefined, undefined, remarks || undefined)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {request.status === "approved" && (
          <Button
            className="w-full"
            onClick={() => onUpdate(request.id, "returned")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Mark as Returned
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "outline" },
    approved: { label: "Approved", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    returned: { label: "Returned", variant: "secondary" },
  };
  const config = variants[status] || variants.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default BorrowRequests;
