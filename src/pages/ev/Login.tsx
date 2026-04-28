import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEvAuth } from "@/contexts/EvAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { StackedLogo } from "@/components/StackedLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const { isAuthenticated, login } = useEvAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-[420px] border border-border rounded-md p-8 space-y-6">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <StackedLogo size={16} />
            <span className="text-[14px] font-bold tracking-[0.08em] uppercase">EV12</span>
          </div>
          <p className="text-[13px] text-muted-foreground">Sign in to the EV12 monitoring portal</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[12px]">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-[13px]"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-[13px]"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full h-9 text-[13px]" disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Sign in
          </Button>
        </form>

        <p className="text-[12px] text-muted-foreground">
          Need an admin account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
