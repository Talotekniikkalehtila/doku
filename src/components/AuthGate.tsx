"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const isPublic = (p: string) =>
  p === "/login" || p.startsWith("/login/") || p.startsWith("/share/");

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isPublic(pathname)) {
      setChecking(false);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        const qs = search?.toString();
        const next = pathname + (qs ? `?${qs}` : "");
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }

      setChecking(false);
    })();
  }, [pathname, search]);

  if (checking && !isPublic(pathname)) {
    return <div style={{ padding: 24 }}>Tarkistetaan kirjautuminen…</div>;
  }

  return <>{children}</>;
}