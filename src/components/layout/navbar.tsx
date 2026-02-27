import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/sellers", label: "Sellers" },
  { href: "/transactions", label: "Transactions" },
  { href: "/facilitators", label: "Facilitators" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2 font-semibold">
          <Image
            src="/x402-radar-icon.svg"
            alt="x402 Radar"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span>x402 Radar</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
