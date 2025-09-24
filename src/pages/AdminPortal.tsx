// src/pages/AdminPortal.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session, User } from "@supabase/supabase-js";

// A simple SVG component for the Google icon
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.9c0-136 110.3-246.2 244-246.2 57.8 0 112.2 21.3 153.2 58.2L325 178c-29.4-25.5-68.4-41.9-111.9-41.9-94.4 0-170.8 76.6-170.8 170.9s76.4 170.9 170.8 170.9c98.1 0 160.8-68.8 165.4-150.3H244V261.8h244z"></path>
  </svg>
);

export default function AdminPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserRoles(currentUser.id);
        } else {
          setIsLoading(false);
          setUserRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_roles', { user_uuid: userId });
      if (error) throw error;
      const editorRoles = ['admin', 'members_editor', 'lectures_editor', 'events_editor', 'gallery_editor', 'project_editor'];
      const hasAccess = data?.some(role => editorRoles.includes(role));
      if(hasAccess){
        setUserRoles(data || []);
      } else {
        await supabase.auth.signOut(); // Sign out user if they don't have access roles
        toast({ title: "Access Denied", description: "You do not have permission to access the admin portal.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setUserRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError(error.message);
      }
    } catch (error) {
      setLoginError("An unexpected error occurred");
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) {
        setLoginError(error.message);
      }
    } catch (error) {
      setLoginError("An unexpected error occurred with Google Sign-In");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setEmail("");
      setPassword("");
      setLoginError("");
      toast({ title: "Logged out", description: "You have been logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user && session && userRoles.length > 0) {
    // Pass the isLoading prop to the dashboard
    return <AdminDashboard user={user} userRoles={userRoles} onLogout={handleLogout} isLoading={isLoading} />;
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 animate-in fade-in duration-500">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Admin Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the Synapsis dashboard
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoggingIn} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoggingIn} />
            </div>
            {loginError && (<p className="text-sm text-destructive">{loginError}</p>)}
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing In..." : "Login"}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} type="button">
              <GoogleIcon />
              Login with Google
            </Button>
          </form>
        </div>
      </div>
      <div className="hidden bg-primary lg:flex items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="text-center text-primary-foreground">
          <img src="/favicon.png" alt="Synapsis Logo" className="w-24 h-24 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-2">Synapsis Admin Portal</h2>
          <p className="text-lg text-primary-foreground/80">
            Managing the intersection of biology and technology.
          </p>
        </div>
      </div>
    </div>
  );
}
