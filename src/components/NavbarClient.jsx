"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Wrench } from "lucide-react";
import SignOut from "@/components/SignOut";

export default function NavbarClient({ loggedInUser, profileLink }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const links = [
    ["Services", "/homeservices"],
    ...(loggedInUser
      ? [
          ["Dashboard", profileLink],
          ["Settings", "/settings"],
        ]
      : []),
    ["Our team", "/aboutus"],
  ];
  return (
    <header className="site-header">
      <div className="page-container nav-inner">
        <Link href="/" className="brand" aria-label="Fixit home">
          <span className="brand-mark">
            <Wrench size={23} />
          </span>
          fixit<span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="main-navigation"
          className={open ? "main-nav is-open" : "main-nav"}
          aria-label="Main navigation"
        >
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          {loggedInUser ? (
            <SignOut />
          ) : (
            <>
              <Link href="/signin" onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link className="btn btn-small" href="/signup" onClick={() => setOpen(false)}>
                Get started <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
