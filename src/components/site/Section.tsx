import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Section({
  eyebrow,
  title,
  intro,
  children,
  id,
  className = "",
}: {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`container-aurevon py-12 md:py-24 lg:py-28 ${className}`}>
      {(eyebrow || title || intro) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mb-9 md:mb-14"
        >
          {eyebrow && (
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <span className="size-1.5 rounded-full bg-accent" />
              <span className="text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.25em] text-muted-foreground">
                {eyebrow}
              </span>
            </div>
          )}
          {title && (
            <h2 className="text-[2rem] min-[390px]:text-[2.2rem] md:text-5xl lg:text-[3.25rem] leading-[1.1] md:leading-[1.08] text-balance">
              {title}
            </h2>
          )}
          {intro && (
            <p className="mt-4 md:mt-6 text-base md:text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed">
              {intro}
            </p>
          )}
        </motion.div>
      )}
      {children}
    </section>
  );
}
