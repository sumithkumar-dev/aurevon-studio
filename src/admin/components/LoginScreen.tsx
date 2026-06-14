import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const emailInvalid = touched.email && !EMAIL_RE.test(email.trim());
  const passwordInvalid = touched.password && password.length === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!EMAIL_RE.test(email.trim()) || password.length === 0) {
      setError(null);
      return;
    }
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md surface-card p-6 md:p-8"
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
          <span className="font-display text-lg tracking-[0.2em] text-foreground">
            AUREVON
          </span>
        </Link>
        <div className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">
          Admin
        </div>
        <h1 className="mt-2 text-3xl text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the email/password you created in your Supabase project.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={emailInvalid || undefined}
              className={
                "mt-2 w-full bg-surface border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors " +
                (emailInvalid
                  ? "border-destructive/60 focus:border-destructive/60"
                  : "border-border focus:border-accent/60")
              }
              placeholder="you@aurevon.studio"
            />
            {emailInvalid && (
              <p className="mt-1.5 text-xs text-destructive">
                Enter a valid email address.
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                aria-invalid={passwordInvalid || undefined}
                className={
                  "w-full bg-surface border rounded-xl px-4 py-3 pr-12 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors " +
                  (passwordInvalid
                    ? "border-destructive/60 focus:border-destructive/60"
                    : "border-border focus:border-accent/60")
                }
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordInvalid && (
              <p className="mt-1.5 text-xs text-destructive">
                Password is required.
              </p>
            )}
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
