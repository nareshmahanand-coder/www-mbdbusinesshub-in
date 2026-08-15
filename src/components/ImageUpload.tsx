import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder: string;
  label?: string;
}

const ImageUpload = ({ images, onImagesChange, maxImages = 1, folder, label }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) { toast.error(`Maximum ${maxImages} image(s) allowed`); return; }

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5 MB)"); continue; }
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) { toast.error("Upload failed"); continue; }
      const { data: pub } = supabase.storage.from("uploads").getPublicUrl(path);
      newUrls.push(pub.publicUrl);
    }

    if (newUrls.length) onImagesChange([...images, ...newUrls]);
    setUploading(false);
  };

  const remove = (idx: number) => onImagesChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              <span className="text-[9px]">{uploading ? "Uploading…" : "गैलरी / Gallery"}</span>
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              <span className="text-[9px]">{uploading ? "Uploading…" : "कैमरा / Camera"}</span>
            </button>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={maxImages > 1}
        className="hidden"
        onChange={e => upload(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => upload(e.target.files)}
      />
    </div>
  );
};

export default ImageUpload;

export const NoImage = () => (
  <div className="flex h-32 w-full items-center justify-center rounded-lg bg-muted">
    <div className="flex flex-col items-center gap-1 text-muted-foreground">
      <ImageIcon className="h-8 w-8" />
      <span className="text-[10px]">No Image</span>
    </div>
  </div>
);
