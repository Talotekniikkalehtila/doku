"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      // Supabase hoitaa sessionin URL:sta (code, state tms)
      // Tämä call riittää useimmissa setupeissa:
      await supabase.auth.getSession();

      // Ohjaa next-parametriin jos se on mukana, muuten /
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.href = next;
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <div>Viimeistellään kirjautuminen…</div>
    </main>
  );
}