import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface Props {
  gender: string;
  onGenderChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  profession: string;
  onProfessionChange: (v: string) => void;
  ageRange: number[];
  onAgeRangeChange: (v: number[]) => void;
}

const MatrimonyFilters = ({
  gender, onGenderChange,
  city, onCityChange,
  profession, onProfessionChange,
  ageRange, onAgeRangeChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border p-3 shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-foreground w-full"
      >
        <SlidersHorizontal className="h-4 w-4 text-[hsl(340,60%,35%)]" />
        Filter Profiles
        <span className="ml-auto text-xs text-muted-foreground">{open ? "Hide ▲" : "Show ▼"}</span>
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Gender</label>
            <Select value={gender} onValueChange={onGenderChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">City</label>
            <Input
              placeholder="e.g. Bhilai"
              value={city}
              onChange={e => onCityChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Profession</label>
            <Input
              placeholder="e.g. Engineer"
              value={profession}
              onChange={e => onProfessionChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              Age: {ageRange[0]} – {ageRange[1]} yrs
            </label>
            <Slider
              min={18} max={60} step={1}
              value={ageRange}
              onValueChange={onAgeRangeChange}
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrimonyFilters;
