import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, BookMarked, Shield, ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!loading && user && userRole) {
      navigate(userRole === "admin" ? "/admin" : "/student");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.15 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    revealRefs.current[i] = el;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BookOpen className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Hero Section */}
      <header className="relative container mx-auto px-4 py-20 text-center">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Welcome to Misbah Library
        </div>

        <div
          className={`flex items-center justify-center mb-6 transition-all duration-1000 ease-out ${
            mounted ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-12"
          }`}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
            <BookOpen className="relative h-24 w-24 text-primary drop-shadow-2xl" />
          </div>
        </div>

        <h1
          className={`text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent transition-all duration-1000 delay-200 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Misbah Library Management
        </h1>
        <p
          className={`text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-1000 delay-500 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          A modern digital solution for Misbah College Library. Track books, manage borrowings, and streamline library operations.
        </p>
        <div
          className={`flex flex-wrap gap-4 justify-center transition-all duration-1000 delay-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button size="lg" onClick={() => navigate("/auth")} className="group hover-lift hover-glow">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="hover-lift">
            Sign In
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <main className="relative container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: BookMarked, title: "Digital Catalog", desc: "Browse and search through our extensive collection of books with ease" },
            { icon: Users, title: "Student Portal", desc: "Students can view books, request borrowings, and track their reading history" },
            { icon: Shield, title: "Admin Control", desc: "Library staff can manage inventory, approve requests, and oversee operations" },
            { icon: BookOpen, title: "Real-Time Updates", desc: "Track book availability and borrowing status in real-time" },
          ].map((f, i) => (
            <Card
              key={f.title}
              ref={setRef(i) as any}
              className="opacity-0 translate-y-8 transition-all duration-700 ease-out border-2 hover:border-primary hover-lift hover:shadow-xl group"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <section
          ref={setRef(4) as any}
          className="opacity-0 translate-y-8 transition-all duration-700 ease-out mt-20 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: 1, title: "Create Account", desc: "Sign up as a student or admin to access the system" },
              { n: 2, title: "Browse Books", desc: "Search and explore available books in the library" },
              { n: 3, title: "Manage Borrowings", desc: "Request books and track your borrowing history" },
            ].map((s, i) => (
              <div
                key={s.n}
                ref={setRef(5 + i) as any}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out group"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  {s.n}
                </div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Misbah College Library. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
