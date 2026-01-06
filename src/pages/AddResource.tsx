// src/pages/AddResource.tsx
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2 } from "lucide-react";

const AddResource = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthError(error.message);
      } else {
        setSession(data.session);
      }
      setCheckingSession(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    loadSession();
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Auto-fill name from Google email (before the @) when session becomes available
  useEffect(() => {
    if (session?.user?.email && !name) {
      const email = session.user.email;
      const rawName = email.split("@")[0] || "";
      // Simple formatting: replace dots/underscores with spaces and title-case words
      const formatted = rawName
        .replace(/[._]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
      if (formatted) {
        setName(formatted);
      }
    }
  }, [session, name]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setCheckingSession(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/resources/add`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      setCheckingSession(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!session) {
      setFormError("Please log in with Google first.");
      return;
    }

    if (!title.trim() || !description.trim() || !link.trim() || !name.trim() || !year.trim()) {
      setFormError("Please fill in all the fields.");
      return;
    }

    // Basic URL validation (client-side only)
    try {
      new URL(link);
    } catch {
      setFormError("Please enter a valid URL for the link.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("user_resources").insert({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim(),
        link: link.trim(),
        owner_name: name.trim(),
        year: year.trim(),
      });

      if (error) {
        setFormError("Failed to save resource. Please try again.");
      } else {
        setFormSuccess("Resource submitted successfully.");
        setTitle("");
        setDescription("");
        setLink("");
        setName("");
        setYear("");
        // Optionally go back after a small delay
        setTimeout(() => navigate("/resources"), 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  const showLoginStep = !session;

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>

        <Card className="border border-border/70 bg-background/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Add a Study Resource</CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Login */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/40">
              <p className="text-sm font-medium">Step 1: Google login</p>
              <p className="text-xs text-muted-foreground">
              Login through your bits mail
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {session?.user?.email
                    ? `Logged in as ${session.user.email}`
                    : "Not logged in"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={checkingSession || !!session}
                  className="flex items-center gap-2"
                >
                  {checkingSession ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  {session ? "Already logged in" : "Login with Google"}
                </Button>
              </div>
              {authError && (
                <p className="text-xs text-red-600 mt-1">
                  {authError}
                </p>
              )}
            </div>

            {/* Step 2: Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-medium">Step 2: Resource details</p>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={showLoginStep || saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={showLoginStep || saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  disabled={showLoginStep || saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={showLoginStep || saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  placeholder="e.g., 2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={showLoginStep || saving}
                  required
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              {formSuccess && (
                <p className="text-sm text-emerald-600">
                  {formSuccess}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={showLoginStep || saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Submit resource"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddResource;



