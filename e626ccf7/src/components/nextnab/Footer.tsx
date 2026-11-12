import { Link } from "@tanstack/react-router";
import { Globe, Heart, Mail, Phone, Share2 } from "lucide-react";
import { Logo } from "./Logo";
import { AppDownloadButtons } from "./AppDownloadButtons";
import { container } from "@/lib/design-system";

const quickLinks = ["About Us", "Sustainability", "Careers", "Privacy Policy"];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-low">
      <div className={`${container} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Connecting Latur to the essentials they need, when they need them. High-velocity
            reliability for groceries and home services.
          </p>
          <div className="mt-6 flex gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground shadow-soft">
              <Share2 className="size-4" aria-hidden="true" />
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground shadow-soft">
              <Globe className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {quickLinks.map((label) => (
              <li key={label}>
                <Link to="/" className="transition-colors hover:text-primary">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">Contact Information</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-primary">
                <Mail className="size-4" aria-hidden="true" />
              </span>
              <a href="mailto:support@nextnab.com" className="hover:text-primary">
                support@nextnab.com
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-primary">
                <Phone className="size-4" aria-hidden="true" />
              </span>
              <a href="tel:+919876543210" className="hover:text-primary">
                +91 98765 43210
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">Download App</h3>
          <AppDownloadButtons className="mt-4 flex-col items-stretch [&>a]:justify-start" />
        </div>
      </div>

      <div className="border-t border-border">
        <div
          className={`${container} flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row`}
        >
          <p>© 2024 NextNab Technologies. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart className="size-3.5 fill-brand text-brand" aria-hidden="true" /> in
            Latur.
          </p>
        </div>
      </div>
    </footer>
  );
}
