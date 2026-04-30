import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, Loader2, FileCheck } from "lucide-react";
import { toast } from "sonner";

interface KycDocUploadProps {
  label: string;
  labelHindi?: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  userId: string;
  folder: string;
}

const KycDocUpload = ({ label, labelHindi, required, value, onChange, userId, folder }: KycDocUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5 MB)"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success(`${label} uploaded!`);
    setUploading(false);
  };

  return (
    <div>
      <label className="text-xs font-medium text-foreground flex items-center gap-1 mb-1">
        {label}
        {labelHindi && <span className="font-hindi text-muted-foreground">({labelHindi})</span>}
        {required ? <span className="text-destructive text-sm">*</span> : <span className="text-muted-foreground text-[10px] ml-1">(वैकल्पिक / Optional)</span>}
      </label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="h-20 w-28 rounded-lg object-cover border border-border" />
          <button type="button" onClick={() => onChange("")}
            className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
            <X className="h-3 w-3" />
          </button>
          <div className="absolute bottom-0.5 left-0.5 rounded bg-green-600/90 px-1 py-0.5 flex items-center gap-0.5">
            <FileCheck className="h-2.5 w-2.5 text-white" />
            <span className="text-[8px] text-white font-bold">Uploaded</span>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          <span className="text-xs">{uploading ? "Uploading…" : `Camera / Upload ${label}`}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => upload(e.target.files?.[0])} />
    </div>
  );
};

export default KycDocUpload;
