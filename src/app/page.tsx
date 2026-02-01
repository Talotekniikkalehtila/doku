"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
            <div className="text-slate-700">Haetaan sessiota…</div>
          ) : email ? (
            <div className="text-slate-900">
              ✅ Kirjautunut: <span className="font-mono">{email}</span>
            </div>
          ) : (
            <div className="text-slate-900">❌ Ei sessiota</div>
          )}

          {/* ✅ Selkeät napit: mobiilissa pinoutuu, desktopissa rivissä */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
              onClick={() => (window.location.href = "/reports/new")}
            >
              Luo uusi raportti
            </button>

            <Link
              href="/archive"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 hover:bg-slate-50"
            >
              Arkisto
            </Link>

            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 hover:bg-slate-50"
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
