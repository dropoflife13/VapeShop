"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#highlights", label: "Why VapeVault" },
  { href: "/#shops", label: "Available Shops" },
  { href: "/reservations", label: "Reserve Pickup" },
  { href: "/serials", label: "Verify Serial" },
  { href: "/register-shop", label: "For Shops" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 h-[72px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors duration-200 hover:border-[#F58A1F] hover:text-[#F58A1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58A1F] md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 leading-none tracking-[0.2em]">
            <img
              src="/images/logo-light.png"
              alt="VapeVault Manila Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain dark:hidden"
            />
            <img
              src="/images/logo-dark.png"
              alt="VapeVault Manila Logo"
              width={36}
              height={36}
              className="hidden h-9 w-9 object-contain dark:block"
            />
            <div>
              <span className="block font-mono text-[11px] font-bold uppercase text-[var(--text-primary)]">
                VAPEVAULT
              </span>
              <span className="block font-mono text-[10px] font-semibold uppercase text-[#E86F12] dark:text-[#F58A1F]">
                STOREFRONT
              </span>
            </div>
          </Link>
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)] md:flex"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 transition-colors duration-200 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58A1F]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/auth"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Sign In
          </Link>
        </div>
      </div>

      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        hidden={!open}
        className={cn(
          "fixed inset-x-0 top-[72px] bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 p-6 backdrop-blur-xl transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-2">
          {NAV_LINKS.map((item, idx) => (
            <Link
              key={item.href}
              ref={idx === 0 ? firstLinkRef : undefined}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-primary)] transition-colors duration-200 hover:border-[#F58A1F]"
            >
              <span>{item.label}</span>
              <span aria-hidden="true" className="text-[#F58A1F]">
                &rarr;
              </span>
            </Link>
          ))}
          <Link
            href="/reservations"
            onClick={() => setOpen(false)}
            className={buttonVariants({
              variant: "primary",
              size: "lg",
              className: "mt-4 w-full",
            })}
          >
            <ShoppingBag className="h-4 w-4" />
            Reserve Pickup
          </Link>
        </nav>
      </div>
    </header>
  );
}
