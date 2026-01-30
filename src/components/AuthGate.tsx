"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!alive) return;

      const ok = !!data.session && !error;
      setAuthed(ok);
      setChecking(false);

      // Jos ei ole kirjautunut ja ei olla login-sivulla -> ohjaa login
      if (!ok && pathname !== "/login") {
        router.replace("/login");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, pathname]);

  if (checking) {
    return (
      <div style={{ padding: 24, color: "#334155" }}>
        Tarkistetaan kirjautuminen…
      </div>
    );
  }

  if (!authed && pathname !== "/login") {
    // redirect on jo käynnissä
    return (
      <div style={{ padding: 24, color: "#334155" }}>
        Ohjataan kirjautumiseen…
      </div>
    );
  }

  // Authed tai login-sivu
  return <>{children}</>;
}
