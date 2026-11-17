import Link from "next/link";
import { SiteHeader } from "@/components/ui/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#071B52] text-white">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-3xl flex-col justify-center px-6 py-16">
        <Badge variant="quarantine" className="w-fit">
          HTTP 404 &middot; Route Not Found
        </Badge>
        <h1 className="mt-4 font-display text-6xl uppercase leading-none tracking-tight sm:text-7xl">
          Signal Lost
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100/75">
          The requested page or serial route does not exist. Return to the main
          hub or jump directly to your shop console.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Back to Home &rarr;
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Open Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
