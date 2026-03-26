import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Loader2, Camera, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MyProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, address, city, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || user.user_metadata?.full_name || "");
        setPhone(data.phone || user.phone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || "");
      } else {
        setDisplayName(user.user_metadata?.full_name || "");
        setPhone(user.phone || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");
      }
      setLoading(false);
    };

    void loadProfile();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Photo upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(filePath);

    const newUrl = urlData.publicUrl + "?t=" + Date.now();
    setAvatarUrl(newUrl);

    await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("id", user.id);

    toast.success("Photo updated!");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone, address, city })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved! ✅");
    }
  };

  const initials = (displayName || "U").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">My Profile / मेरी प्रोफ़ाइल</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/30">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-2 cursor-pointer shadow-lg hover:bg-primary/90 transition"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name / पूरा नाम</Label>
                <Input
                  id="fullName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number / मोबाइल नंबर</Label>
                <Input
                  id="mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <Label htmlFor="address">Address / पता</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address"
                />
              </div>
              <div>
                <Label htmlFor="city">City / शहर</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground font-semibold py-5"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Profile / प्रोफ़ाइल सेव करें"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyProfilePage;
