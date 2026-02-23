// src/App.tsx
import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import CarnivalNavBar from '@/components/CarnivlNavBar';

// Lazy load the page components
const Index = lazy(() => import("./pages/Index"));
const AllMembers = lazy(() => import("./pages/AllMembers"));
const AllEvents = lazy(() => import("./pages/AllEvents"));
const PastLectures = lazy(() => import("./pages/PastLectures"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Projects = lazy(() => import("./pages/Projects"));
const Resources = lazy(() => import("./pages/Resources"));
const Gallery = lazy(() => import("./pages/Gallery"));

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const queryClient = new QueryClient();

const App = () => {
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [userEmailForPasswordReset, setUserEmailForPasswordReset] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          if (session?.user?.email) {
            setUserEmailForPasswordReset(session.user.email);
          }
          setShowSetPasswordDialog(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
        toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
        return;
    }
    setIsUpdatingPassword(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast({ title: "Success!", description: "Your password has been set. You can now log in." });
        setShowSetPasswordDialog(false);
        setNewPassword("");
        setUserEmailForPasswordReset("");
        // Optionally, redirect to the admin page after setting password
        // window.location.href = '/admin';
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
    } finally {
        setIsUpdatingPassword(false);
    }
  };


  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <div className="min-h-screen w-full">
              <CarnivalNavBar />
              <main className="flex-1 ">
                <Suspense fallback={<div>Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/all-members" element={<AllMembers />} />
                    <Route path="/events" element={<AllEvents />} />
                    <Route path="/seminars" element={<PastLectures />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/admin" element={<AdminPortal />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
        </BrowserRouter>

        {/* Global Password Set Dialog */}
        <Dialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Your Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p>Welcome! Please create a password to activate your account for <span className="font-semibold">{userEmailForPasswordReset}</span>.</p>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? "Saving..." : "Save and Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;