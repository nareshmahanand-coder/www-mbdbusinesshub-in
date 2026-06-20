import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { clearNativeAuthSession, persistNativeAuthSession } from "@/lib/capacitorSessionBridge";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSuperUser: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isSuperUser: false,
  signOut: async () => {},
});

export const SUPERUSER_FLAG = "mbd-superuser";
const AUTH_NEXT_KEY = "mbd-auth-next";

export const useAuth = () => useContext(AuthContext);

const getSafeNextPath = () => {
  const stored = sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY) || "/dashboard";
  return stored.startsWith("/") && !stored.startsWith("//") ? stored : "/dashboard";
};

const redirectAfterSignIn = () => {
  const currentPath = window.location.pathname;
  if (!["/", "/login", "/signup"].includes(currentPath)) return;

  const nextPath = getSafeNextPath();
  sessionStorage.removeItem(AUTH_NEXT_KEY);
  localStorage.removeItem(AUTH_NEXT_KEY);
  sessionStorage.setItem("bharat-mitra-pending-greet", "true");
  window.history.replaceState(null, document.title, nextPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperUser, setIsSuperUser] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem(SUPERUSER_FLAG) === "true"
  );
  const syncedUserIdsRef = useRef<Set<string>>(new Set());

  // Keep isSuperUser in sync with localStorage (covers same-tab updates from LoginPage)
  useEffect(() => {
    const checkFlag = () => {
      const active = localStorage.getItem(SUPERUSER_FLAG) === "true";
      setIsSuperUser((prev) => (prev !== active ? active : prev));
    };
    window.addEventListener("storage", checkFlag);
    window.addEventListener("mbd-superuser-changed", checkFlag);
    const interval = window.setInterval(checkFlag, 1000);
    return () => {
      window.removeEventListener("storage", checkFlag);
      window.removeEventListener("mbd-superuser-changed", checkFlag);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncProfile = async (activeSession: Session | null) => {
      const activeUser = activeSession?.user;
      if (!activeUser || syncedUserIdsRef.current.has(activeUser.id)) return;

      syncedUserIdsRef.current.add(activeUser.id);

      const metadata = activeUser.user_metadata ?? {};
      const profilePayload = {
        id: activeUser.id,
        email: activeUser.email ?? null,
        phone: activeUser.phone ?? null,
        display_name: metadata.full_name ?? metadata.name ?? null,
        avatar_url: metadata.avatar_url ?? null,
        provider: activeUser.app_metadata?.provider ?? (activeUser.phone ? "phone" : "google"),
      };

      const { error } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
      if (error) {
        syncedUserIdsRef.current.delete(activeUser.id);
      }
    };

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        void persistNativeAuthSession(nextSession);
        void syncProfile(nextSession);
      } else {
        void clearNativeAuthSession();
        syncedUserIdsRef.current.clear();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);
      if (event === "SIGNED_IN" && nextSession) {
        redirectAfterSignIn();
      }
    });

    void (async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      applySession(initialSession);
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    sessionStorage.removeItem("bharat-mitra-pending-greet");
    localStorage.removeItem(SUPERUSER_FLAG);
    window.dispatchEvent(new Event("mbd-superuser-changed"));
    setIsSuperUser(false);
    await supabase.auth.signOut();
    await clearNativeAuthSession();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSuperUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
