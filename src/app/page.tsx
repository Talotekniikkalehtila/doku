"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      if (!uid) return;

      const { data } = await supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle();
      setName(data?.display_name || s.session?.user?.email || "");
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl p-4 grid gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Dokumentointi</div>
          <div className="text-xl font-semibold">
            {name ? `Tervetuloa, ${name}` : "Tervetuloa!"}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Luo raportteja kuvista ja merkitse huomiot pisteinä.
          </div>
        </div>

        <div className="grid gap-2">
          <button
            onClick={() => (window.location.href = "/reports/new")}
            className="rounded-2xl bg-slate-900 px-4 py-4 text-left text-white shadow-sm"
          >
            <div className="text-base font-semibold">+ Luo uusi raportti</div>
            <div className="text-sm text-white/80">Lisää kuva ja merkinnät</div>
          </button>

          <button
            onClick={() => (window.location.href = "/archive")}
            className="rounded-2xl border bg-white px-4 py-4 text-left shadow-sm"
          >
            <div className="text-base font-semibold">Siirry arkistoon</div>
            <div className="text-sm text-slate-600">Katso aiemmat raportit</div>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/login")}
            className="rounded-xl px-4 py-2 text-sm hover:bg-slate-100"
          >
            Kirjaudu
          </button>
          <button
            onClick={logout}
            className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Kirjaudu ulos
          </button>
        </div>
      </div>
    </main>
  );
}
