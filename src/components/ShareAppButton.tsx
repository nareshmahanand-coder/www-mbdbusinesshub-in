import { Share2, Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/hooks/use-toast";

const SHARE_URL = "https://shop.mbdbusinesshub.in";
const SHARE_TEXT = `Mera Bharat Dukaan — आपका पड़ोस, आपकी दुकान, ज़ीरो कमीशन। अभी खोलें: ${SHARE_URL}`;

type Props = Omit<ButtonProps, "onClick"> & {
  label?: string;
  showInstall?: boolean;
};

export async function shareApp() {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({
        title: "Mera Bharat Dukaan",
        text: SHARE_TEXT,
        url: SHARE_URL,
      });
      return "shared" as const;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(SHARE_URL);
      toast({ title: "Link copied", description: SHARE_URL });
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`,
      "_blank",
      "noopener,noreferrer",
    );
    return "fallback" as const;
  } catch {
    return "cancelled" as const;
  }
}

const ShareAppButton = ({ label = "Share App", showInstall = true, variant = "outline", size = "sm", className, ...rest }: Props) => {
  const { canInstall, promptInstall } = usePwaInstall();

  const handleClick = async () => {
    if (showInstall && canInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") return;
    }
    await shareApp();
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} {...rest}>
      {canInstall && showInstall ? <Download className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      <span>{canInstall && showInstall ? "Install App" : label}</span>
    </Button>
  );
};

export default ShareAppButton;