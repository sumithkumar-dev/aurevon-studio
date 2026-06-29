import { Link } from "@tanstack/react-router";
import aurevonLogoLight from "@/assets/logo/aurevon-logo-light.svg";
import { Mail, Phone, MessageCircle, MapPin, Instagram } from "lucide-react";
import { CONTACT } from "@/lib/contact-info";

const TELANGANA_CITIES = [
  "Hyderabad",
  "Secunderabad",
  "Warangal",
  "Nizamabad",
  "Karimnagar",
  "Khammam",
];

const LOCAL_BUSINESSES = [
  "Dental & skin clinics",
  "Cafés & restaurants",
  "Salons & spas",
  "Gyms & fitness studios",
  "Retail & professional services",
];

export function Footer() {
  return (
    <footer className="border-t border-border mt-20 md:mt-24">
      <div className="container-aurevon py-14 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="flex items-center">
              <img
                src={aurevonLogoLight}
                alt="Aurevon Studios"
                width="180"
                height="45"
                className="h-10 w-auto"
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Premium websites for business owners across Telangana - clinics,
              cafés, salons, and shops that want customers to trust them the
              moment they land online.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={CONTACT.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:bg-accent-glow transition-colors"
              >
                <MessageCircle size={14} /> Chat on WhatsApp
              </a>
              <a
                href={`tel:${CONTACT.phoneTel}`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Phone size={14} /> {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-accent mb-4">
              Serving Telangana
            </h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Based in Telangana, working with local owners who care about how
              their business shows up when someone searches on Google, Maps, or
              Instagram.
            </p>
            <div className="flex flex-wrap gap-2">
              {TELANGANA_CITIES.map((city) => (
                <span
                  key={city}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-muted-foreground"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm text-foreground mb-3 font-sans font-medium">
              Local businesses we build for
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {LOCAL_BUSINESSES.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-1 gap-8">
            <div>
              <h4 className="text-sm text-foreground mb-3 font-sans font-medium">
                Explore
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/services"
                    className="hover:text-foreground transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    to="/portfolio"
                    className="hover:text-foreground transition-colors"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/process"
                    className="hover:text-foreground transition-colors"
                  >
                    Process
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-foreground mb-3 font-sans font-medium">
                Contact
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-accent shrink-0" />
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {CONTACT.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-accent shrink-0" />
                  <a
                    href={`tel:${CONTACT.phoneTel}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {CONTACT.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-accent shrink-0" />
                  <a
                    href={CONTACT.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Instagram size={14} className="text-accent shrink-0" />
                  <a
                    href="https://instagram.com/aurevon.studios"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    @aurevon.studios
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-accent shrink-0" />
                  {CONTACT.location}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-aurevon py-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} AUREVON Studio. Proudly serving local
            businesses in Telangana.
          </span>
          <span className="flex items-center gap-4">
            <a
              href="https://instagram.com/aurevon.studios"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Instagram size={12} /> Instagram
            </a>
            <span className="text-border">·</span>
            <a
              href="tel:+919177916932"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Phone size={12} /> Call
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
