"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = "/reports";
      } else {
        window.location.href = "/login";
      }
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center text-slate-600">
      Kirjaudutaan sisään…
    </main>
  );
}
