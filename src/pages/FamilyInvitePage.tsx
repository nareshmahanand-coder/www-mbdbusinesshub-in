import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const FamilyInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data } = await supabase
        .from("family_members")
        .select("id, member_name, member_phone, status, owner_id")
        .eq("invite_token", token)
        .maybeSingle();
      setInvite(data);
      setLoading(false);
    };
    void load();
  }, [token]);

  const accept = async () => {
    if (!user || !invite) return;
    setActing(true);
    const { error } = await supabase
      .from("family_members")
      .update({
        status: "accepted",
        member_user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);
    setActing(false);
    if (error) return toast.error(error.message);
    toast.success("Accepted! आप अब Family Circle में हैं।");
    navigate("/family-safety");
  };

  const decline = async () => {
    if (!user || !invite) return;
    setActing(true);
    await supabase
      .from("family_members")
      .update({ status: "declined", member_user_id: user.id })
      .eq("id", invite.id);
    setActing(false);
    toast("Invite declined");
    navigate("/");
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto max-w-md px-4 py-10 text-center">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-3 font-bold">Invalid invite</h2>
          <p className="text-sm text-muted-foreground">
            यह invite link expired है या मौजूद नहीं है।
          </p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Home पर जाएँ
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto max-w-md px-4 py-10 text-center">
          <Shield className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-bold">Family Safety invite</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Invite accept करने के लिए पहले login करें।
          </p>
          <Button asChild className="mt-4">
            <Link to={`/login?next=/family-invite/${token}`}>Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (invite.status === "accepted") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto max-w-md px-4 py-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
          <p className="mt-3 font-bold">यह invite पहले ही accept हो चुका है ✅</p>
          <Button asChild className="mt-4">
            <Link to="/family-safety">Family Safety खोलें</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card className="border-2 border-primary/30">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-10 w-10 text-primary" />
            <CardTitle>Family Safety Circle Invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm">
              <span className="font-bold">{invite.member_name}</span> — आपको Family
              Safety Circle में जोड़ा गया है।
            </p>
            <p className="text-xs text-muted-foreground">
              Accept करने पर emergency में आपको SOS alerts और last known location
              मिलेगी। आप कभी भी इसे बदल सकते हैं।
            </p>
            <div className="flex gap-2">
              <Button onClick={accept} disabled={acting} className="flex-1">
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
              </Button>
              <Button
                onClick={decline}
                disabled={acting}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FamilyInvitePage;
