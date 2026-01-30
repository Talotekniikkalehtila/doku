"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();

      // Ei sessiota -> login
      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      // Sessiolla -> valitse sun "oikea" aloitussivu
      window.location.href = "/reports"; // <- vaihda jos haluat /installer tai /archive
    })();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 text-slate-600">Ohjataan…</div>
    </main>
  );
}