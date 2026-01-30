"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const isPublicPath = (pathname: string) => {
  // ✅ jaot julkiseksi + login/callback
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/auth/callback" || pathname.startsWith("/auth/callback/")) return true;
  if (pathname === "/share" || pathname.startsWith("/share/")) return true;

  // Next/static
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;

  return false;
};

export default function AuthGate() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!pathname) return;

    // julkiset reitit läpi
    if (isPublicPath(pathname)) {
      setChecking(false);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        const next = pathname + (search?.toString() ? `?${search.toString()}` : "");
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }

      setChecking(false);
    })();
  }, [pathname, search]);

  // pieni “loading”, ettei vilku suojattu sisältö
  if (checking && pathname && !isPublicPath(pathname)) {
    return (
      <div className="fixed inset-0 bg-slate-50 grid place-items-center text-slate-600">
        Tarkistetaan kirjautuminen…
      </div>
    );
  }

  return null;
}
