import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import aurevonLogoLight from "@/assets/logo/aurevon-logo-light.svg";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FieldErrors = { email?: string; password?: string };

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters.";
  return errors;
}

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const errors = useMemo(
    () => (submitted ? validate(email, password) : {}),
    [email, password, submitted],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setAuthError(null);
    const v = validate(email, password);
    if (v.email || v.password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      // Friendlier message for the most common failure.
      const msg = /invalid login credentials/i.test(error.message)
        ? "That email and password don't match. Try again."
        : error.message;
      setAuthError(msg);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card/40 p-7 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] md:p-9"
      >
        <Link to="/" className="flex items-center">
          <img
            src={aurevonLogoLight}
            alt="Aurevon Studios"
            width="160"
            height="40"
            className="h-9 w-auto"
          />
        </Link>

        <div className="mt-7 text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
          Admin
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">
          Sign in to your workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the email and password you set up in Supabase.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-err" : undefined}
                placeholder="you@aurevon.studio"
                className={`w-full rounded-xl border bg-background pl-10 pr-3 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                  errors.email
                    ? "border-destructive/60"
                    : "border-border focus:border-accent/60"
                }`}
              />
            </div>
            {errors.email ? (
              <p
                id="login-email-err"
                className="mt-1.5 text-xs text-destructive"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "login-password-err" : undefined
                }
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-background pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                  errors.password
                    ? "border-destructive/60"
                    : "border-border focus:border-accent/60"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password ? (
              <p
                id="login-password-err"
                className="mt-1.5 text-xs text-destructive"
              >
                {errors.password}
              </p>
            ) : null}
          </div>

          {authError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {authError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-60"
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need access?{" "}
          <Link to="/contact" className="text-accent hover:underline">
            Contact the team
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
