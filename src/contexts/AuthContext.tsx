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
const OAUTH_RECOVERED_FLAG = "mbd-oauth-recovered";

export const useAuth = () => useContext(AuthContext);

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

    const recoverSessionFromOAuthUrl = async (): Promise<Session | null> => {
      if (typeof window === "undefined") return null;

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(window.location.search);
      const authorizationCode = queryParams.get("code");
      const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");

      const finishRecovery = (nextSession: Session) => {
        sessionStorage.setItem(OAUTH_RECOVERED_FLAG, "true");
        const cleanPath = window.location.pathname === "/" ? "/auth/continue" : window.location.pathname;
        window.history.replaceState(null, "", `${window.location.origin}${cleanPath}`);
        return nextSession;
      };

      if (authorizationCode) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(authorizationCode);
        if (error || !data.session) return null;
        return finishRecovery(data.session);
      }

      if (!accessToken || !refreshToken) return null;

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session) return null;

      return finishRecovery(data.session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);
      if (event === "SIGNED_IN" && nextSession) {
        sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      }
    });

    void (async () => {
      const recoveredSession = await recoverSessionFromOAuthUrl();
      if (recoveredSession) {
        applySession(recoveredSession);
        return;
      }

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
