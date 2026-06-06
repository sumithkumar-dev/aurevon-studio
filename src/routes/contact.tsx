import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Section } from "@/components/site/Section";
import { Check, Mail, MapPin, Phone, MessageCircle, Loader2 } from "lucide-react";
import { CONTACT } from "@/lib/contact-info";
import { supabase } from "@/integrations/supabase/client";
import { useMeta } from "@/lib/use-meta";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const INDUSTRIES = ["Café / Restaurant", "Dental Clinic", "Dermatology Clinic", "Other Clinic", "Gym / Fitness", "Salon / Spa", "Other"];
const BUDGETS = ["Under ₹30k", "₹30k – ₹60k", "₹60k – ₹1L", "₹1L+"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-ring transition-colors";

function ContactPage() {
  useMeta({
    title: "Contact — AUREVON",
    description: "Tell us about your business and we'll put together a thoughtful proposal.",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      business_name: String(fd.get("business_name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      industry: String(fd.get("industry") || "").trim(),
      budget: String(fd.get("budget") || "").trim(),
      message: String(fd.get("message") || "").trim() || null,
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.business_name) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const { error: dbError } = await supabase
        .from("contact_submissions")
        .insert(payload);
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or email us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="pt-24 md:pt-28 pb-6">
        <div className="container-aurevon max-w-4xl">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Contact</div>
          <h1 className="mt-4 text-5xl md:text-6xl text-balance leading-[1.05]">
            Let's talk about your website.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Share a few details about your business. We'll get back within one working day with a thoughtful proposal — design direction, scope and timeline.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="surface-card p-8 md:p-10"
          >
            {submitted ? (
              <div className="text-center py-10">
                <div className="mx-auto size-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Check size={22} />
                </div>
                <h3 className="mt-5 text-2xl text-foreground">Thank you.</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  We've received your details and will be in touch within one working day.
                </p>
              </div>
            ) : (
              <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
                <Field label="Your Name">
                  <input name="name" required className={inputCls} placeholder="Full name" />
                </Field>
                <Field label="Business Name">
                  <input name="business_name" required className={inputCls} placeholder="e.g. Brew Haven Café" />
                </Field>
                <Field label="Phone Number">
                  <input name="phone" required type="tel" className={inputCls} placeholder="+91" />
                </Field>
                <Field label="Email">
                  <input name="email" required type="email" className={inputCls} placeholder="you@business.com" />
                </Field>
                <Field label="Industry">
                  <select name="industry" required className={inputCls} defaultValue="">
                    <option value="" disabled>Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Budget">
                  <select name="budget" required className={inputCls} defaultValue="">
                    <option value="" disabled>Select budget</option>
                    {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Tell us about your project">
                    <textarea name="message" rows={5} className={inputCls} placeholder="Briefly describe your business and what you'd like the website to do." />
                  </Field>
                </div>
                {error && (
                  <div className="md:col-span-2 text-sm text-destructive">{error}</div>
                )}
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 mt-2">
                  <p className="text-xs text-muted-foreground">We respond within one working day.</p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors disabled:opacity-60"
                  >
                    {submitting ? (<><Loader2 size={14} className="animate-spin" /> Sending…</>) : "Send proposal request"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          <aside className="space-y-4">
            <div className="surface-card p-6">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-foreground hover:text-accent transition-colors">
                <Mail size={16} className="text-accent" />
                <span className="text-sm">{CONTACT.email}</span>
              </a>
              <a href={`tel:${CONTACT.phoneTel}`} className="mt-3 flex items-center gap-3 text-foreground hover:text-accent transition-colors">
                <Phone size={16} className="text-accent" />
                <span className="text-sm">{CONTACT.phoneDisplay}</span>
              </a>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 text-foreground hover:text-accent transition-colors">
                <MessageCircle size={16} className="text-accent" />
                <span className="text-sm">WhatsApp us directly</span>
              </a>
              <div className="mt-3 flex items-center gap-3 text-foreground">
                <MapPin size={16} className="text-accent" />
                <span className="text-sm">{CONTACT.location}</span>
              </div>
            </div>
            <div className="surface-card p-6">
              <h4 className="text-foreground">What happens next</h4>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li><span className="text-accent">01 ·</span> We reply within 1 working day.</li>
                <li><span className="text-accent">02 ·</span> Short call to understand your business.</li>
                <li><span className="text-accent">03 ·</span> You receive a clear written proposal.</li>
              </ol>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
