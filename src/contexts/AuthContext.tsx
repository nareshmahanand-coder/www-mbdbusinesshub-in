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

export const useAuth = () => useContext(AuthContext);

const AUTH_URL_PARAM_KEYS = [
  "access_token",
  "refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "type",
  "code",
  "state",
  "error",
  "error_code",
  "error_description",
];

const getAuthParamsFromUrl = () => {
  const params = new URLSearchParams();
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.forEach((value, key) => params.set(key, value));

  const hash = window.location.hash.replace(/^#/, "");
  if (hash && (hash.includes("access_token=") || hash.includes("refresh_token=") || hash.includes("code=") || hash.includes("error="))) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => params.set(key, value));
  }

  return params;
};

const cleanAuthParamsFromUrl = () => {
  const url = new URL(window.location.href);
  let changed = false;

  AUTH_URL_PARAM_KEYS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  const hash = url.hash.replace(/^#/, "");
  if (hash && (hash.includes("access_token=") || hash.includes("refresh_token=") || hash.includes("code=") || hash.includes("error="))) {
    const hashParams = new URLSearchParams(hash);
    AUTH_URL_PARAM_KEYS.forEach((key) => hashParams.delete(key));
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
    changed = true;
  }

  if (changed) {
    window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
};

const recoverSessionFromAuthUrl = async (): Promise<Session | null> => {
  if (typeof window === "undefined") return null;

  const params = getAuthParamsFromUrl();
  const hasAuthParams = AUTH_URL_PARAM_KEYS.some((key) => params.has(key));
  if (!hasAuthParams) return null;

  try {
    const oauthError = params.get("error_description") || params.get("error");
    if (oauthError) throw new Error(oauthError);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
      return data.session ?? null;
    }

    const code = params.get("code");
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return data.session ?? null;
    }
  } catch (error) {
    console.error("[auth] OAuth session recovery failed", error);
  } finally {
    cleanAuthParamsFromUrl();
  }

  return null;
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
    let initializing = true;

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
      if (initializing && event === "INITIAL_SESSION") return;
      applySession(nextSession);
    });

    void (async () => {
      const recoveredSession = await recoverSessionFromAuthUrl();
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      initializing = false;
      applySession(recoveredSession ?? initialSession);
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
