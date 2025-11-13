import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Upload, Users as UsersIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu() {
  const { user, userRole, signOut } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUserName(data.name || user.email || "User");
      } else {
        setUserName(user.email || "User");
      }
    };

    fetchUserName();
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="h-4 w-4" />
          {userName || "Profile"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <span className="text-xs text-primary capitalize mt-1">{userRole}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userRole === "admin" && (
          <>
            <DropdownMenuItem onClick={() => navigate("/upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Book
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/users")}>
              <UsersIcon className="h-4 w-4 mr-2" />
              Manage Users
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
