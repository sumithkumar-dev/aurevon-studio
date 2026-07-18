import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMeta } from "@/lib/use-meta";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";

export function AdminPage() {
  useMeta({ title: "Admin - AUREVON", noindex: true });
  const [session, setSession] = useState<{
    email?: string | null;
    fullName?: string | null;
  } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(
        data.session
          ? {
              email: data.session.user.email,
              fullName: data.session.user.user_metadata?.full_name,
            }
          : null,
      );
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(
        s
          ? {
              email: s.user.email,
              fullName: s.user.user_metadata?.full_name,
            }
          : null,
      );
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="surface-card flex w-full max-w-sm items-center gap-3 p-5 text-sm text-muted-foreground">
          <Loader2 className="animate-spin text-accent" size={18} />
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <Dashboard email={session.email ?? ""} fullName={session.fullName} />;
}
