import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import LocationSearchBar from "@/components/LocationSearchBar";
import MatrimonyProfileCard from "@/components/matrimony/ProfileCard";
import MatrimonyFilters from "@/components/matrimony/Filters";
import MatrimonyMyProfile from "@/components/matrimony/MyProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Sparkles, Users } from "lucide-react";
import SubscriptionButton from "@/components/SubscriptionButton";
import { BadgeCheck } from "lucide-react";
import { useUserMembershipProfile } from "@/hooks/useUserMembershipProfile";

export interface MatrimonyProfile {
  id: string;
  name: string;
  gender: string;
  dob: string | null;
  height: string;
  education: string;
  profession: string;
  city: string;
  about_me: string;
  family_background: string;
  hobbies: string;
  job_details: string;
  photos: string[];
  is_published: boolean;
  subscription_plan: string | null;
  subscription_end: string | null;
  user_id: string;
  aadhaar_number?: string | null;
  aadhaar_front_url?: string | null;
  aadhaar_back_url?: string | null;
  pan_number?: string | null;
  pan_url?: string | null;
}

export const getAge = (dob: string | null) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const locationTokens = (value = "") => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const matchesLocation = (profileCity = "", selectedLocation = "All") => {
  if (selectedLocation === "All") return true;
  const profileTokens = locationTokens(profileCity);
  const selectedTokens = locationTokens(selectedLocation);
  return profileTokens.some(token => selectedTokens.includes(token)) || selectedTokens.some(token => profileTokens.includes(token));
};

const MatrimonyPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") === "my-profile" ? "my-profile" : "browse");
  const [profiles, setProfiles] = useState<MatrimonyProfile[]>([]);
  const [myProfile, setMyProfile] = useState<MatrimonyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterGender, setFilterGender] = useState("All");
  const [filterCity, setFilterCity] = useState("");
  const [filterProfession, setFilterProfession] = useState("");
  const [filterAgeRange, setFilterAgeRange] = useState([18, 60]);

  useEffect(() => { loadData(); }, [user]);

  // STRICT per-user check via user_profiles ONLY
  const { isActive: profileActive, loading: profileLoading } = useUserMembershipProfile();

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, myRes] = await Promise.all([
      supabase.from("matrimony_profiles").select("*").eq("is_published", true).order("created_at", { ascending: false }),
      user ? supabase.from("matrimony_profiles").select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as unknown as MatrimonyProfile[]);
    if (myRes.data) setMyProfile(myRes.data as unknown as MatrimonyProfile);
    setLoading(false);
  };

  const browsable = useMemo(() => {
    return profiles
      .filter(p => p.user_id !== user?.id)
      .filter(p => {
        if (filterGender !== "All" && p.gender !== filterGender) return false;
        if (filterCity && !matchesLocation(p.city, filterCity)) return false;
        if (filterProfession && !p.profession?.toLowerCase().includes(filterProfession.toLowerCase())) return false;
        const age = getAge(p.dob);
        if (age !== null && (age < filterAgeRange[0] || age > filterAgeRange[1])) return false;
        return true;
      });
  }, [profiles, user, filterGender, filterCity, filterProfession, filterAgeRange]);

  // Daily recommendations: first 3 profiles (simple algo)
  const recommendations = browsable.slice(0, 3);
  const otherProfiles = browsable.slice(3);

  return (
    <div className="min-h-screen bg-[hsl(340,30%,97%)]">
      <AppHeader />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[hsl(340,60%,25%)] to-[hsl(340,50%,35%)] text-white">
        <div className="container mx-auto px-4 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="h-6 w-6 fill-[hsl(40,90%,65%)] text-[hsl(40,90%,65%)]" />
            <h1 className="text-xl font-bold tracking-tight">मेरी जीवनसाथी</h1>
          </div>
          <p className="text-xs text-white/70">Mera Bharat Dukaan — Premium Marriage Bureau</p>
        </div>
      </div>

      <div className="container mx-auto px-3 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full max-w-sm mx-auto bg-white/80 border border-border">
            <TabsTrigger value="browse" className="flex-1 gap-1.5 data-[state=active]:bg-[hsl(340,60%,25%)] data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Browse
            </TabsTrigger>
            <TabsTrigger value="my-profile" className="flex-1 gap-1.5 data-[state=active]:bg-[hsl(340,60%,25%)] data-[state=active]:text-white">
              <Heart className="h-3.5 w-3.5" /> My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4 space-y-5">
            <LocationSearchBar value={filterCity || "All"} onChange={location => setFilterCity(location === "All" ? "" : location)} placeholder="Search partner location — Delhi, Bhilai, Pune..." />

            {/* Filters */}
            <MatrimonyFilters
              gender={filterGender} onGenderChange={setFilterGender}
              city={filterCity} onCityChange={setFilterCity}
              profession={filterProfession} onProfessionChange={setFilterProfession}
              ageRange={filterAgeRange} onAgeRangeChange={setFilterAgeRange}
            />

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white animate-pulse h-72" />
                ))}
              </div>
            ) : browsable.length === 0 ? (
              <div className="py-16 text-center">
                <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground font-hindi">कोई प्रोफ़ाइल नहीं मिली</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {/* Daily Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4.5 w-4.5 text-[hsl(40,90%,50%)]" />
                      <h2 className="font-bold text-foreground text-sm">Daily Recommendations</h2>
                      <span className="text-[10px] bg-[hsl(40,90%,90%)] text-[hsl(40,90%,30%)] px-2 py-0.5 rounded-full font-medium">
                        आज के लिए
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {recommendations.map(p => (
                        <MatrimonyProfileCard key={p.id} profile={p} isRecommended onRequestContact={() => {}} userId={user?.id} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Profiles */}
                {otherProfiles.length > 0 && (
                  <div>
                    <h2 className="font-bold text-foreground text-sm mb-3">All Profiles</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {otherProfiles.map(p => (
                        <MatrimonyProfileCard key={p.id} profile={p} onRequestContact={() => {}} userId={user?.id} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="my-profile" className="mt-4">
            {user && profileActive && (
              <div className="mb-4 rounded-2xl border border-[hsl(140,40%,60%)] bg-[hsl(140,40%,95%)] p-4 text-center shadow-sm">
                <BadgeCheck className="mx-auto h-10 w-10 text-[hsl(140,60%,30%)]" />
                <p className="mt-2 text-sm font-bold text-[hsl(140,60%,25%)]">Your subscription is active</p>
                <p className="mt-1 text-xs text-muted-foreground font-hindi">आपकी मैरिज ब्यूरो प्रीमियम मेंबरशिप सक्रिय है।</p>
              </div>
            )}
            {user && !profileActive && !profileLoading && (
              <div className="mb-4 rounded-2xl border border-[hsl(340,40%,80%)] bg-white p-4 shadow-sm">
                <p className="text-center text-sm font-bold text-[hsl(340,60%,25%)]">
                  Premium Marriage Bureau — Auto-Debit
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <SubscriptionButton
                    membership_type="marriage_bureau"
                    plan_type="monthly"
                    redirectTo="/matrimony"
                    buttonText="₹99 / माह — Premium"
                    className="w-full rounded-full bg-[hsl(340,60%,25%)] hover:bg-[hsl(340,60%,20%)] text-white font-bold"
                  />
                  <SubscriptionButton
                    membership_type="marriage_bureau"
                    plan_type="yearly"
                    redirectTo="/matrimony"
                    buttonText="₹999 / साल — Premium"
                    className="w-full rounded-full bg-[hsl(40,90%,45%)] hover:bg-[hsl(40,90%,40%)] text-white font-bold"
                  />
                </div>
              </div>
            )}
            <MatrimonyMyProfile
              user={user}
              myProfile={myProfile}
              onReload={loadData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MatrimonyPage;
