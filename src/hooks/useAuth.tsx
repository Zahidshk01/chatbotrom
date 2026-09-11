import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const EXPLICIT_SIGN_OUT_KEY = "kender.explicit-sign-out";

export function markExplicitSignOut() {
  try {
    sessionStorage.setItem(EXPLICIT_SIGN_OUT_KEY, "1");
  } catch {
    /* storage blocked */
  }
}

function consumeExplicitSignOut() {
  try {
    const explicit = sessionStorage.getItem(EXPLICIT_SIGN_OUT_KEY) === "1";
    sessionStorage.removeItem(EXPLICIT_SIGN_OUT_KEY);
    return explicit;
  } catch {
    return false;
  }
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** A stored token exists and the user never signed out explicitly. */
  maybeSignedIn: boolean;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  maybeSignedIn: false,
});


// True if a Supabase auth token blob is still sitting in localStorage.
// Used to avoid bouncing the user to /auth while a token refresh is in flight
// (e.g. app opened after being closed overnight, or opened while offline).
function hasStoredSession() {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token") && localStorage.getItem(k)) {
        return true;
      }
    }
  } catch {
    /* storage blocked */
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const signedOutRef = useRef(false);
  const restoreInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT") {
        // SIGNED_OUT is also emitted after some automatic refresh failures.
        // Only the Settings action is allowed to make that decision for the
        // user; transient wake/network failures are handled by load() below.
        if (consumeExplicitSignOut()) {
          signedOutRef.current = true;
          setSession(null);
          setLoading(false);
        }
        return;
      }
      if (!s) {
        if (!hasStoredSession()) setLoading(false);
        return;
      }
      signedOutRef.current = false;
      setSession(s);
      setLoading(false);
      window.dispatchEvent(new CustomEvent("kender:session-ready"));
    });

    const load = async () => {
      if (signedOutRef.current) return;
      if (restoreInFlightRef.current) return restoreInFlightRef.current;

      const restore = (async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (cancelled) return;

          // getSession() already performs the SDK's serialized refresh when an
          // access token is stale. Calling refreshSession() again here races
          // the SDK's own wake-up refresh and can invalidate a rotated token.
          if (data.session) {
            signedOutRef.current = false;
            setSession(data.session);
            window.dispatchEvent(new CustomEvent("kender:session-ready"));
          } else if (error && hasStoredSession()) {
            return;
          }
        } catch {
          /* offline: keep current state and retry on the next wake-up */
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      restoreInFlightRef.current = restore;
      try {
        await restore;
      } finally {
        if (restoreInFlightRef.current === restore) restoreInFlightRef.current = null;
      }
    };

    void load();

    // Re-validate when the tab wakes up or connectivity returns, so a
    // long-idle session gets a fresh token instead of silently expiring.
    const revalidate = () => {
      if (document.visibilityState !== "visible") return;
      void load();
    };
    const handleOnline = () => void load();
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", revalidate);
    window.addEventListener("pageshow", revalidate);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", revalidate);
      window.removeEventListener("pageshow", revalidate);
      sub.subscription.unsubscribe();
    };
  }, []);
  const maybeSignedIn = !!session || (!signedOutRef.current && hasStoredSession());

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, maybeSignedIn }}>
      {children}
    </Ctx.Provider>
  );

}

export const useAuth = () => useContext(Ctx);
