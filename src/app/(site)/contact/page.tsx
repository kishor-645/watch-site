import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/home/page-hero";
import { container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the MyWatch concierge or visit our Mumbai boutique. Book a private appointment, ask about an order, or arrange a service.",
  alternates: { canonical: "/contact" },
};

const HOURS = [
  { days: "Monday – Friday", time: "11:00 – 20:00" },
  { days: "Saturday", time: "11:00 – 21:00" },
  { days: "Sunday", time: "By appointment" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            At your <span className="italic text-gold-gradient">service</span>
          </>
        }
        description="Whether you are choosing your first fine watch or your fifteenth, our concierge is here to help."
      />

      <div className={cn(container, "grid gap-16 pt-20 lg:grid-cols-12 lg:gap-20 lg:pt-28")}>
        <Reveal className="lg:col-span-7">
          <section aria-labelledby="form-heading">
            <h2 id="form-heading" className="text-3xl font-medium sm:text-4xl">
              Send us a message
            </h2>
            <p className="mt-3 text-muted-foreground">We reply to every enquiry within one business day.</p>
            <div className="mt-10">
              <ContactForm />
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-5">
          <aside aria-labelledby="boutique-heading" className="border border-gold/15 bg-charcoal/60 p-8 sm:p-10">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold">The Boutique</p>
            <h2 id="boutique-heading" className="mt-4 text-3xl font-medium">
              MyWatch Mumbai
            </h2>

            <ul className="mt-8 space-y-6 text-sm">
              <li className="flex gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
                <address className="not-italic leading-relaxed text-muted-foreground">
                  14 Rampart Row, Kala Ghoda
                  <br />
                  Fort, Mumbai 400001
                  <br />
                  Maharashtra, India
                </address>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
                <a href="tel:+912240001234" className="rounded-sm text-muted-foreground outline-none transition-colors hover:text-gold-light focus-visible:text-gold-light focus-visible:ring-2 focus-visible:ring-gold/50">
                  +91 22 4000 1234
                </a>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
                <a href="mailto:concierge@mywatch.in" className="rounded-sm text-muted-foreground outline-none transition-colors hover:text-gold-light focus-visible:text-gold-light focus-visible:ring-2 focus-visible:ring-gold/50">
                  concierge@mywatch.in
                </a>
              </li>
            </ul>

            <div className="mt-10 border-t border-border pt-8">
              <h3 className="flex items-center gap-3 font-sans text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground">
                <Clock className="size-4 text-gold" strokeWidth={1.25} aria-hidden />
                Opening hours
              </h3>
              <dl className="mt-5 space-y-3 text-sm">
                {HOURS.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-border/60 pb-3 last:border-0">
                    <dt className="text-muted-foreground">{h.days}</dt>
                    <dd className="text-foreground">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
              Private viewings are available outside opening hours. Mention your preferred time in your message.
            </p>
          </aside>
        </Reveal>
      </div>
    </>
  );
}
