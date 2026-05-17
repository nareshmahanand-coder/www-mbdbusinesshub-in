import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, LogOut, LayoutDashboard, Store, Settings, Trash2, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const UserProfileMenu = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("App पसंद नहीं आया");
  const [message, setMessage] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  const READ_KEY = user ? `mbd-notif-read-${user.id}` : "";

  useEffect(() => {
    if (!user) { setNotifs([]); setUnread(0); return; }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("admin_messages")
        .select("id,title,message,severity,created_at,recipient_user_id,recipient_group")
        .or(`recipient_user_id.eq.${user.id},recipient_group.eq.all,recipient_group.eq.customers`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const list = data || [];
      setNotifs(list);
      const lastRead = Number(localStorage.getItem(READ_KEY) || 0);
      setUnread(list.filter((m: any) => new Date(m.created_at).getTime() > lastRead).length);
    };
    load();
    const ch = supabase
      .channel(`user-notifs-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_messages" }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user, READ_KEY]);

  const openNotifs = (open: boolean) => {
    setNotifOpen(open);
    if (open && user) {
      localStorage.setItem(READ_KEY, String(Date.now()));
      setUnread(0);
    }
  };

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    user.phone ||
    "User";

  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
  };

  const handleSubmitRequest = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("account_delete_requests").insert({
        user_id: user.id,
        user_name: displayName,
        user_email: user.email || "",
        user_phone: user.phone || "",
        reason,
        message,
      });
      if (error) throw error;
      toast({
        title: "Request submitted / अनुरोध भेजा गया",
        description: "Admin आपके अनुरोध की समीक्षा करेंगे।",
      });
      setConfirmOpen(false);
      setReason("App पसंद नहीं आया");
      setMessage("");
    } catch (e: any) {
      toast({
        title: "Failed to submit",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <DropdownMenu open={notifOpen} onOpenChange={openNotifs}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 mr-1" aria-label="Notifications">
          <Bell className="h-5 w-5 text-primary-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Admin / Company messages</p>
        </div>
        {!notifs.length && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No messages yet</p>
        )}
        {notifs.map((n) => (
          <div key={n.id} className="px-3 py-2 border-b last:border-b-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{n.title}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${n.severity === "critical" ? "bg-red-100 text-red-700" : n.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                {n.severity}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{n.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full border-2 border-primary-foreground/30 p-0 hover:border-primary-foreground/60"
        >
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {user.email || user.phone}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/my-profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="h-4 w-4" />
            <span>My Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/merchant-dashboard" className="flex items-center gap-2 cursor-pointer">
            <Store className="h-4 w-4" />
            <span>Merchant Mode</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
          className="cursor-pointer font-semibold text-red-600 focus:text-red-700 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
          <span>Delete Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Account Request</DialogTitle>
          <DialogDescription>
            कृपया अकाउंट डिलीट करने का कारण बताएं। Admin आपका अनुरोध जल्द ही देखेंगे।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">कारण चुनें / Choose a reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="App पसंद नहीं आया">App पसंद नहीं आया</SelectItem>
                <SelectItem value="ज्यादा charges लग रहे हैं">ज्यादा charges लग रहे हैं</SelectItem>
                <SelectItem value="Technical problem है">Technical problem है</SelectItem>
                <SelectItem value="Privacy concern">Privacy concern</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">अपना message लिखें (optional)</Label>
            <Textarea
              rows={4}
              placeholder="मुझे यह परेशानी है इसलिए डिलीट कर रहा हूँ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmitRequest}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default UserProfileMenu;
