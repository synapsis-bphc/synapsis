// src/components/admin/ProfileManagement.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { Separator } from "@/components/ui/separator";

const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function ProfileManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    profile_url: "",
    available_date: "",
    available_time: "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setFormData({
          profile_url: user.user_metadata?.profile_url || "",
          available_date: user.user_metadata?.available_date || "",
          available_time: user.user_metadata?.available_time || "",
        });
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          profile_url: formData.profile_url,
          available_date: formData.available_date,
          available_time: formData.available_time,
        }
      });
      if (error) throw error;
      toast({ title: "Success", description: "Profile details updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile details.", variant: "destructive" });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      toast({ title: "Success", description: "Password updated successfully." });
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleDetailsUpdate} className="space-y-4">
          <div>
            <h4 className="text-md font-medium">Profile Details</h4>
            <p className="text-sm text-muted-foreground">This information will be used as default values when you create a new project.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile_url">Profile URL</Label>
            <Input
              id="profile_url"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://www.bits-pilani.ac.in/hyderabad/"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="available_date">Default Available Day</Label>
            <Select
              value={formData.available_date}
              onValueChange={(value) => setFormData({ ...formData, available_date: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="available_time">Default Available Time</Label>
            <Input
              id="available_time"
              type="time"
              value={formData.available_time}
              onChange={(e) => setFormData({ ...formData, available_time: e.target.value })}
            />
          </div>
          <Button type="submit">Save Changes</Button>
        </form>

        <Separator />

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <h4 className="text-md font-medium">Change Password</h4>
            <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Leave blank to keep current password"
            />
          </div>
            <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </div>
          <Button type="submit">Update Password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
