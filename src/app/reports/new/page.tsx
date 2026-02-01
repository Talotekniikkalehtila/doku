"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NewReportPage() {
  const [title, setTitle] = useState("Uusi raportti");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const isTitleValid = useMemo(() => title.trim().length >= 3, [title]);

  async function createReport() {
    setLoading(true);
    setMsg("");

    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user?.id;
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    await supabase
      .from("profiles")
      .upsert({ id: uid, display_name: s.session?.user?.email });

    const { data, error } = await supabase
      .from("reports")
      .insert({ owner_id: uid, title: title.trim() })
      .select("id")
      .single();

    console.log("create report result:", { data, error });

    if (error) {
      setMsg("Raportin luonti epäonnistui: " + error.message);
      setLoading(false);
      return;
    }

    if (!data?.id) {
      setMsg("Raportti luotiin, mutta ID puuttuu. Tarkista insert/select.");
      setLoading(false);
      return;
    }

    window.location.href = `/reports/${data.id}`;
  }

  return (
    <main className="min-h-screen text-slate-900">
      {/* Premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(1200px_circle_at_20%_10%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(147,51,234,0.18),transparent_55%),radial-gradient(800px_circle_at_40%_90%,rgba(16,185,129,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/0 to-white/0" />
      </div>

      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
            Valmiina luontiin
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Luo uusi raportti
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Anna raportille nimi. Voit täydentää sisällön muokkauksessa.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/15 bg-white/7 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-white/70">
                  Raportin nimi
                </div>
                <div className="mt-1 text-sm text-white/55">
                  Näkyy otsikossa ja listauksissa.
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                min. 3 merkkiä
              </div>
            </div>

            <div className="mt-4">
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-white/25 focus:bg-white/12 focus:ring-4 focus:ring-blue-500/15"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Esim. vikapaikannus"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-white/55">
                  Vinkki: käytä kohdetta + päivämäärää
                </span>
                <span className={isTitleValid ? "text-emerald-300/90" : "text-white/45"}>
                  {title.trim().length}/3
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={createReport}
              disabled={loading || !isTitleValid}
              className="mt-4 w-full rounded-2xl bg-gradient-to-b from-white/18 to-white/8 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 transition hover:from-white/22 hover:to-white/10 hover:ring-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Luodaan...
                  </>
                ) : (
                  "Luo ja siirry muokkaukseen"
                )}
              </span>
            </button>

            {/* Error / info */}
            {msg ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {msg}
              </div>
            ) : null}
          </div>

          {/* Back */}
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white/85 backdrop-blur transition hover:bg-white/8 hover:border-white/18"
          >
            ← Takaisin
          </button>

          <div className="mt-3 text-center text-xs text-white/45">
            Luonti tekee tyhjän raportin. Sisältö lisätään muokkauksessa.
          </div>
        </div>
      </div>
    </main>
  );
}

