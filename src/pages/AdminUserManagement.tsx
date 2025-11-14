import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminUserManagement() {
  const { userRole, loading } = useAuth();
  const [deleteEmail, setDeleteEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deleteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!confirm(`Are you sure you want to delete the account for ${deleteEmail}?`)) {
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: deleteEmail }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      toast.success(`Successfully deleted account for ${deleteEmail}`);
      setDeleteEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setGranting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-admin-role`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: adminEmail, action: 'grant' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to grant admin access');
      }

      toast.success(`Successfully granted admin access to ${adminEmail}`);
      setAdminEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to grant admin access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin access from ${adminEmail}?`)) {
      return;
    }

    setRevoking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-admin-role`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: adminEmail, action: 'revoke' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke admin access');
      }

      toast.success(`Successfully revoked admin access from ${adminEmail}`);
      setAdminEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke admin access");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts and admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin Access</TabsTrigger>
              <TabsTrigger value="delete">Delete Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="space-y-4 mt-4">
              <form onSubmit={handleGrantAdmin} className="space-y-4">
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium mb-2">
                    User Email Address
                  </label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="user@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={granting} className="flex-1">
                    {granting ? "Granting..." : "Grant Admin Access"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    disabled={revoking}
                    onClick={handleRevokeAdmin}
                    className="flex-1"
                  >
                    {revoking ? "Revoking..." : "Revoke Admin"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="delete" className="space-y-4 mt-4">
              <form onSubmit={handleDeleteUser} className="space-y-4">
                <div>
                  <label htmlFor="delete-email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <Input
                    id="delete-email"
                    type="email"
                    placeholder="user@example.com"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="destructive" disabled={deleting} className="w-full">
                  {deleting ? "Deleting..." : "Delete User Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
