import { Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={QA[0].q}
      className="divide-y divide-border border-y border-border"
    >
      {QA.map((item) => (
        <AccordionItem key={item.q} value={item.q} className="border-b-0">
          <AccordionTrigger
            className="py-6 hover:no-underline [&>span]:no-underline"
            icon={
              <span className="shrink-0 size-9 rounded-full border border-border flex items-center justify-center text-foreground transition-transform duration-300 group-data-[state=open]:rotate-45">
                <Plus size={16} />
              </span>
            }
          >
            <span className="text-lg md:text-xl text-foreground group-hover:text-accent transition-colors">
              {item.q}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <p className="pb-6 max-w-2xl text-muted-foreground leading-relaxed">
              {item.a}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
