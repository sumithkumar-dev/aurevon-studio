export type CaseStudyOutcome = {
  label: string;
  value: string;
};

export type CaseStudy = {
  title: string;
  category: string;
  location: string;
  tagline: string;
  url: string;
  challenge: string;
  built: string;
  highlights: string[];
  outcomes: CaseStudyOutcome[];
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    title: "Brew Haven Café",
    category: "Café & Restaurant",
    location: "Hanmakonda, Telangana",
    tagline: "The neighbourhood spot - now easy to find, browse, and visit.",
    url: "https://brew-haven-cafe-omega.vercel.app/",
    image: "/portfolio/brew-haven.webp",
    challenge:
      "Regulars loved the café, but new customers couldn't find the menu, opening hours, or directions. Weekend footfall depended on word of mouth instead of showing up in local searches.",
    built:
      "A warm, inviting site that puts the menu, ambience, and location front and centre - so someone discovering Brew Haven on their phone knows exactly what to expect before they arrive.",
    highlights: [
      "Menu easy to scan on mobile",
      "Hours & location above the fold",
      "Gallery that captures the vibe",
      "Google Maps directions built in",
      "Shareable link for social bios",
    ],
    outcomes: [
      { label: "Discoverability", value: "Shows up when locals search nearby" },
      { label: "Menu clarity", value: "New customers browse before visiting" },
      { label: "Weekend ready", value: "Hours & location always visible" },
    ],
  },
  {
    title: "SmileCare Dental Clinic",
    category: "Dental Clinic",
    location: "Hyderabad, Telangana",
    tagline:
      "A clinic site that answers patient questions before they pick up the phone.",
    url: "https://dental-clinic-web-demo.vercel.app/",
    image: "/portfolio/smilecare-dental.webp",
    challenge:
      "Patients were calling for basic details - timings, treatments, and doctor availability - because nothing clear showed up when they searched on Google or Maps.",
    built:
      "A calm, mobile-first clinic website with every service explained plainly, doctor profiles that build trust, and one-tap WhatsApp booking for appointment enquiries.",
    highlights: [
      "Service pages patients actually read",
      "Doctor profiles with credentials",
      "One-tap WhatsApp booking",
      "Hours, location & directions upfront",
      "Mobile-first for local searches",
    ],
    outcomes: [
      {
        label: "Patient trust",
        value: "Professional first impression from search",
      },
      {
        label: "Fewer basic calls",
        value: "Hours, services & team visible instantly",
      },
      {
        label: "Mobile-ready",
        value: "Built for how Hyderabad patients browse",
      },
    ],
  },
  {
    title: "Aaravi Derma Clinic",
    category: "Dermatology Clinic",
    location: "Hanmakonda, Telangana",
    tagline: "Helping patients understand treatments before they walk in.",
    url: "https://derma-clinic-gray.vercel.app/",
    image: "/portfolio/aaravi-spa.webp",
    challenge:
      "Skin and aesthetics treatments need credibility - but the clinic relied on Instagram alone, leaving serious patients unsure about procedures, pricing context, and who would treat them.",
    built:
      "A refined clinic experience that walks patients through treatments clearly, introduces the medical team with authority, and makes booking feel as professional as the care inside.",
    highlights: [
      "Treatment guides in plain language",
      "Before/after friendly layout",
      "Consultation booking flow",
      "Team credentials front and centre",
      "Fast load on mobile data",
    ],
    outcomes: [
      { label: "Credibility", value: "Medical-grade look patients expect" },
      {
        label: "Clarity",
        value: "Treatments explained without jargon overload",
      },
      { label: "Enquiries", value: "Clear path from browse to consultation" },
    ],
  },
];
