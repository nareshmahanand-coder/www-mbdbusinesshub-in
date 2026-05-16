import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SUPERUSER_FLAG } from "@/contexts/AuthContext";

const ADMIN_PIN = "02032026";

interface Props {
  className?: string;
}

const AdminPinAccess = ({ className }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");

  const submit = () => {
    if (pin === ADMIN_PIN) {
      localStorage.setItem(SUPERUSER_FLAG, "true");
      window.dispatchEvent(new Event("mbd-superuser-changed"));
      setOpen(false);
      setPin("");
      navigate("/admin");
    } else {
      toast.error("Invalid PIN");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "text-[9px] text-muted-foreground/30 hover:text-muted-foreground/60 underline-offset-2 hover:underline"
        }
      >
        Official System Access
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Enter Admin PIN</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="••••••••"
            className="text-center tracking-widest"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={pin.length < 4}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPinAccess;