import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["admin", "student"]),
  roll_no: z.string().optional(),
  department: z.string().optional(),
  year: z.number().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);

  // Sign In Form State
  const [signInData, setSignInData] = useState({ email: "", password: "" });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "admin" | "student",
    roll_no: "",
    department: "",
    year: "",
  });

  // Redirect if already authenticated
  if (user && userRole) {
    setTimeout(() => {
      navigate(userRole === "admin" ? "/admin" : "/student");
    }, 0);
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      signInSchema.parse(signInData);

      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Signed in successfully!");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred during sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedData = signUpSchema.parse({
        ...signUpData,
        year: signUpData.year ? parseInt(signUpData.year) : undefined,
      });

      const additionalData: any = {};
      if (parsedData.role === "student") {
        if (parsedData.roll_no) additionalData.roll_no = parsedData.roll_no;
        if (parsedData.department) additionalData.department = parsedData.department;
        if (parsedData.year) additionalData.year = parsedData.year;
      }

      const { error } = await signUp(
        parsedData.email,
        parsedData.password,
        parsedData.name,
        parsedData.role,
        additionalData
      );

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred during sign up");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center mb-2">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Misbah Library</CardTitle>
          <CardDescription>Access your library account</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <RadioGroup
                    value={signUpData.role}
                    onValueChange={(value: "admin" | "student") =>
                      setSignUpData({ ...signUpData, role: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="font-normal">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="font-normal">Admin</Label>
                    </div>
                  </RadioGroup>
                </div>

                {signUpData.role === "student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="roll-no">Roll Number</Label>
                      <Input
                        id="roll-no"
                        type="text"
                        placeholder="CS-2024-001"
                        value={signUpData.roll_no}
                        onChange={(e) => setSignUpData({ ...signUpData, roll_no: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        type="text"
                        placeholder="Computer Science"
                        value={signUpData.department}
                        onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="1"
                        min="1"
                        max="5"
                        value={signUpData.year}
                        onChange={(e) => setSignUpData({ ...signUpData, year: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
