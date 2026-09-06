import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X } from "lucide-react";
import { useRef } from "react";
import { getCategoryFields, getCategoryGroup, type CategoryField } from "@/data/categoryFields";

interface Props {
  category: string;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  /** Uploads a file and returns its public URL (used for photo fields). */
  onUpload?: (file: File) => Promise<string | null>;
  uploading?: boolean;
}

const PhotoField = ({
  field, url, onPick, onClear, uploading,
}: { field: CategoryField; url: string; onPick: (capture: boolean) => void; onClear: () => void; uploading?: boolean }) => (
  <div className="rounded-xl border-2 border-dashed border-border bg-white/50 p-3">
    <Label className="text-sm">
      {field.label} {field.required && <span className="text-destructive">*</span>}
      <span className="block font-hindi text-[11px] text-muted-foreground">{field.labelHindi}</span>
    </Label>
    {url ? (
      <div className="relative mt-2">
        <img src={url} alt={field.label} className="h-28 w-full rounded-lg border border-border object-cover" />
        <button type="button" onClick={onClear} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
          <X className="h-3 w-3" />
        </button>
      </div>
    ) : (
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" disabled={uploading} onClick={() => onPick(false)}
          className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#FF9933]/50 bg-[#FF9933]/5">
          <div className="text-center">
            <Upload className="mx-auto h-5 w-5 text-[#FF9933]" />
            <p className="mt-1 text-[11px] font-semibold text-[#1a237e]">{uploading ? "..." : "गैलरी"}</p>
          </div>
        </button>
        <button type="button" disabled={uploading} onClick={() => onPick(true)}
          className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#138808]/50 bg-[#138808]/5">
          <div className="text-center">
            <Camera className="mx-auto h-5 w-5 text-[#138808]" />
            <p className="mt-1 text-[11px] font-semibold text-[#1a237e]">{uploading ? "..." : "कैमरा"}</p>
          </div>
        </button>
      </div>
    )}
  </div>
);

const CategoryFields = ({ category, values, onChange, onUpload, uploading }: Props) => {
  const fields = getCategoryFields(category);
  const group = getCategoryGroup(category);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const pendingKey = useRef<string>("");

  if (!category || !fields.length) return null;

  const setValue = (key: string, value: any) => onChange({ ...values, [key]: value });

  const pickPhoto = (key: string, capture: boolean) => {
    pendingKey.current = key;
    (capture ? camRef : fileRef).current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUpload) return;
    const url = await onUpload(file);
    if (url) setValue(pendingKey.current, url);
  };

  const toggleMulti = (key: string, option: string) => {
    const current: string[] = Array.isArray(values[key]) ? values[key] : [];
    setValue(key, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  return (
    <div className="space-y-4 rounded-xl border-2 border-[#FF9933]/30 bg-[#FF9933]/5 p-3">
      <div className="text-center">
        <p className="text-sm font-bold text-[#1a237e]">{group?.title ?? "Category Details"}</p>
        <p className="font-hindi text-[11px] text-muted-foreground">{group?.titleHindi ?? "श्रेणी के अनुसार जानकारी"}</p>
      </div>

      <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />
      <input type="file" accept="image/*" capture="environment" ref={camRef} className="hidden" onChange={handleFile} />

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.key];
          const wide = field.type === "textarea" || field.type === "multiselect";
          return (
            <div key={field.key} className={wide ? "sm:col-span-2" : undefined}>
              {field.type === "photo" ? (
                <PhotoField
                  field={field}
                  url={typeof value === "string" ? value : ""}
                  uploading={uploading}
                  onPick={(capture) => pickPhoto(field.key, capture)}
                  onClear={() => setValue(field.key, "")}
                />
              ) : (
                <>
                  <Label className="text-sm">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                    <span className="block font-hindi text-[11px] text-muted-foreground">{field.labelHindi}</span>
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea value={value ?? ""} placeholder={field.placeholder} onChange={(e) => setValue(field.key, e.target.value)} />
                  ) : field.type === "select" ? (
                    <Select value={value ?? ""} onValueChange={(v) => setValue(field.key, v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : field.type === "multiselect" ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(field.options ?? []).map((o) => {
                        const active = Array.isArray(value) && value.includes(o);
                        return (
                          <Button key={o} type="button" size="sm" variant={active ? "default" : "outline"}
                            className="h-8 rounded-full text-[11px]" onClick={() => toggleMulti(field.key, o)}>
                            {active ? "✓ " : ""}{o}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={value ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFields;
