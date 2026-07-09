export const agency = {
  name: "Aurevon Studios",
  owner_name: "Sumith Kumar",
  title: "Founder & Web Designer",
  tagline: "Building better web experiences.",

  contact: {
    phone: "+91 91779 16932",
    email: "sumithkumar.dev@gmail.com",
    location: "Warangal, India",
  },

  social: {
    instagram: "@aurevon.studios",
    website: "https://aurevon.studios",
  },

  legal: {
    currency: "₹",
    proposal_valid_days: 14,
    // Client-facing payment policy — referenced by Proposal, Agreement, and
    // Invoice so all three always quote the exact same numbers instead of
    // each hardcoding its own (they previously drifted: 7 vs 14 vs 30 days,
    // plus an undefined "late fee" on the Invoice and a 1.5%/month interest
    // clause on the Agreement that appeared nowhere else).
    payment_terms_days: 7,
    late_payment_grace_days: 14,
    payment_methods: ["UPI", "Bank Transfer"],
    // Governing law for the Agreement's liability clause. Deliberately a
    // separate field from contact.location (a city, used for display) —
    // "governed by the laws of Warangal" isn't a real legal jurisdiction.
    governing_law: "India",
    client_response_days: 5,
    reengagement_hold_days: 21,
    termination_notice_days: 14,
    cure_period_days: 7,
    confidentiality_years: 2,
    refund_processing_days: 14,
  },
};
