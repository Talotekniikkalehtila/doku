"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FilePlus2, Type, ArrowLeft, Sparkles, Loader2 } from "lucide-react";

export default function NewReportPage() {
  const [title, setTitle] = useState("Uusi raportti");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const isTitleValid = useMemo(() => title.trim().length >= 3, [title]);

  async function createReport() {
    if (!isTitleValid || loading) return;

    setLoading(true);
    setMsg("");

    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user?.id;

    if (!uid) {
      window.location.href = "/login";
      return;
    }

    // Kevyt varmistus: profiilirivi olemassa
    await supabase.from("profiles").upsert({
      id: uid,
      display_name: s.session?.user?.email ?? null,
    });

    const { data, error } = await supabase
      .from("reports")
      .insert({ owner_id: uid, title: title.trim() })
      .select("id")
      .single();

    if (error) {
      setMsg("Raportin luonti epäonnistui: " + error.message);
      setLoading(false);
      return;
    }

    if (!data?.id) {
      setMsg("Raportti luotiin, mutta ID puuttuu (insert/select).");
      setLoading(false);
      return;
    }

    window.location.href = `/reports/${data.id}`;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* taustaan kevyt brändi-vivahde (sama linja kuin “login/etusivu”-tyyliin) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-50" />
        <div
          className="absolute -top-48 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--brand, #3060a6), transparent 60%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
            <Sparkles className="h-4 w-4" style={{ color: "var(--brand, #3060a6)" }} />
            Premium-luonti
          </div>

          <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <FilePlus2 className="h-6 w-6" style={{ color: "var(--brand, #3060a6)" }} />
            Luo uusi raportti
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Täytä vain tärkeimmät – voit täydentää raporttia muokkauksessa.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
            {/* Label */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Type className="h-4 w-4 text-slate-400" />
                  Raportin nimi
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Näkyy otsikossa ja listauksissa.
                </div>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                min. 3 merkkiä
              </div>
            </div>

            {/* Input */}
            <div className="mt-4">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] outline-none transition
                           focus:border-[var(--brand,#3060a6)] focus:ring-4 focus:ring-[var(--brand,#3060a6)]/15"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Esim. Kauttua / IV-huolto 2.2.2026"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Vinkki: kohde + työ + päivämäärä
                </span>
                <span className={isTitleValid ? "text-emerald-600" : "text-slate-400"}>
                  {title.trim().length}/3
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={createReport}
              disabled={loading || !isTitleValid}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition
                         disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--brand, #3060a6)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget.style.background = "var(--brand-dark, #244a82)");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.background = "var(--brand, #3060a6)");
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Luodaan...
                </>
              ) : (
                <>
                  Luo ja siirry muokkaukseen
                </>
              )}
            </button>

            {/* Error */}
            {msg ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {msg}
              </div>
            ) : null}

            {/* Microcopy */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Raportti luodaan luonnokseksi ja tallentuu sinulle. Sisältö lisätään muokkauksessa.
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4 text-slate-400" />
              Takaisin
            </button>

            <div className="text-xs text-slate-500">
              Nopea luonti • Premium-ilme
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


