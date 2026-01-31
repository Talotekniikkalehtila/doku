"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">Etusivu</h1>

        <div className="mt-4 rounded-lg bg-white p-4 shadow">
          {loading ? (
            <div className="text-slate-600">Haetaan sessiota…</div>
          ) : email ? (
            <div className="text-slate-700">
              ✅ Kirjautunut: <span className="font-mono">{email}</span>
            </div>
          ) : (
            <div className="text-slate-700">❌ Ei sessiota</div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              className="rounded bg-slate-900 px-3 py-2 text-white"
              onClick={() => (window.location.href = "/reports/new")}
            >
              Luo uusi raportti
            </button>

            <button
              className="rounded border px-3 py-2"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Kirjaudu ulos
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}