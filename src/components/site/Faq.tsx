import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const QA = [
  {
    q: "How long does a website take?",
    a: "Most projects launch in 2–4 weeks, depending on scope and how quickly content and feedback come together.",
  },
  {
    q: "Will it work on mobile?",
    a: "Yes. Every site we build is designed mobile-first and tested across phones, tablets and desktops.",
  },
  {
    q: "Can you redesign my current website?",
    a: "Absolutely. We frequently take outdated or unfinished sites and rebuild them into something that actually represents your business.",
  },
  {
    q: "What information do you need from me?",
    a: "Your business basics - services, hours, photos, contact details - and any brand assets you already have. We'll guide the rest.",
  },
  {
    q: "Can I update content later?",
    a: "Yes. We can hand over a simple editing setup, or stay on as your studio for ongoing updates.",
  },
  {
    q: "Do you handle hosting and domain?",
    a: "We help you set up reliable hosting and connect your domain, so launch day is smooth.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border border-y border-border">
      {QA.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full py-6 flex items-center justify-between gap-6 text-left group"
            >
              <span className="text-lg md:text-xl text-foreground group-hover:text-accent transition-colors">
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3 }}
                className="shrink-0 size-9 rounded-full border border-border flex items-center justify-center text-foreground"
              >
                <Plus size={16} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 max-w-2xl text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
