import { useEffect, useMemo, useRef, useState } from "react";
import { City, State } from "country-state-city";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reverseGeocodeIndiaLocation, searchIndiaLocations } from "@/lib/googleLocation";

type LocationSuggestion = { name: string; label: string; type: string };

const topCities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow", "Patna", "Bhopal", "Bhilai", "Chandigarh"];

const indiaLocations = [
  ...topCities.map(city => ({ name: city, label: city, type: "Top City" })),
  ...State.getStatesOfCountry("IN").map(state => ({ name: state.name, label: state.name, type: "State" })),
  ...(City.getCitiesOfCountry("IN") ?? []).map(city => ({ name: city.name, label: `${city.name}, ${city.stateCode}`, type: "City" })),
] satisfies LocationSuggestion[];

interface LocationSearchBarProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  className?: string;
  buttonLabel?: string;
}

const LocationSearchBar = ({ value, onChange, placeholder = "Search area, city or PIN across India", className = "", buttonLabel = "GPS" }: LocationSearchBarProps) => {
  const [locationSearch, setLocationSearch] = useState(value === "All" ? "" : value);
  const [open, setOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLocationSearch(value === "All" ? "" : value), [value]);

  const results = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (!q) return topCities.map(city => ({ name: city, label: city, type: "Top City" }));
    const localMatches = indiaLocations.filter(location => location.label.toLowerCase().includes(q) || location.name.toLowerCase().includes(q)).slice(0, 40);
    const seen = new Set<string>();
    return [...remoteResults, ...localMatches].filter(location => {
      const key = location.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 60);
  }, [locationSearch, remoteResults]);

  useEffect(() => {
    const query = locationSearch.trim();
    if (query.length < 2) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchIndiaLocations(query);
        setRemoteResults(found);
      } catch {
        if (!controller.signal.aborted) setRemoteResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [locationSearch]);

  const chooseLocation = (location: string) => {
    const next = location.trim() || "All";
    setLocationSearch(next === "All" ? "" : next);
    onChange(next);
    setOpen(false);
    toast.success(next === "All" ? "Showing all India" : `Location set to ${next}`);
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) { toast.error("GPS is not available on this device"); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude, longitude } = position.coords;
        const exactLocation = await reverseGeocodeIndiaLocation(latitude, longitude);
        chooseLocation(exactLocation);
      } catch {
        toast.error("Could not detect area name. Please search your location.");
      } finally {
        setBusy(false);
      }
    }, () => { setBusy(false); toast.error("Location permission denied"); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
        <Input
          ref={inputRef}
          value={locationSearch}
          onChange={event => { setLocationSearch(event.target.value); setOpen(true); onChange(event.target.value.trim() || "All"); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 140)}
          onKeyDown={event => {
            if (event.key === "Enter" && locationSearch.trim()) chooseLocation(locationSearch.trim());
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={value === "All" || !value ? placeholder : value}
          className="h-11 rounded-lg border-2 border-accent/40 bg-background pl-9 pr-9 text-sm font-bold shadow-sm focus-visible:ring-1"
        />
        {searching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
        {open && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
            <button className="flex w-full items-center gap-2 border-b border-border px-3 py-3 text-left text-sm font-bold text-accent" onMouseDown={event => { event.preventDefault(); useCurrentLocation(); }} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {busy ? "Finding exact GPS area, city and pin code..." : "Use Current Location"}
            </button>
            {locationSearch.trim() && <button className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-extrabold text-foreground hover:bg-accent/10" onMouseDown={event => { event.preventDefault(); chooseLocation(locationSearch.trim()); }}><Search className="h-4 w-4 text-accent" /> Use “{locationSearch.trim()}”</button>}
            <div className="max-h-72 overflow-y-auto py-1">
              {results.map((location, index) => <button key={`${location.label}-${index}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/10" onMouseDown={event => { event.preventDefault(); chooseLocation(location.label); }}><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-foreground">{location.label}</span><span className="shrink-0 text-[10px] font-medium text-muted-foreground">{location.type}</span></button>)}
            </div>
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" className="h-11 shrink-0 rounded-lg text-xs font-bold" onClick={useCurrentLocation} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />} {buttonLabel}
      </Button>
    </div>
  );
};

export default LocationSearchBar;