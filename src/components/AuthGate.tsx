"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const isPublicPath = (p: string) => {
  if (p === "/login" || p.startsWith("/login/")) return true;
  if (p === "/auth/callback" || p.startsWith("/auth/callback/")) return true;
  if (p === "/share" || p.startsWith("/share/")) return true;
  if (p.startsWith("/_next")) return true;
  if (p === "/favicon.ico") return true;
  return false;
};

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Julkiset reitit läpi ilman sessiota
    if (isPublicPath(pathname)) {
      setChecking(false);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        // Rakenna next vain selaimessa (ei hookkeja, ei Suspense-vaatimuksia)
        const next =
          window.location.pathname + (window.location.search || "") + (window.location.hash || "");
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }

      setChecking(false);
    })();
  }, [pathname]);

  if (checking && !isPublicPath(pathname)) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-slate-50 text-slate-600">
        Tarkistetaan kirjautuminen…
      </div>
    );
  }

  return <>{children}</>;
}