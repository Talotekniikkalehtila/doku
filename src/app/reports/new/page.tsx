"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, FilePlus2, Type, Loader2, Sparkles } from "lucide-react";

const BRAND = "#3060a6";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

    // Varmista profiili (kevyt)
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
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Sama bränditausta kuin etusivulla */}
      <div
        className="absolute inset-0 animate-homebg"
        style={{
          background: `
            radial-gradient(1200px 600px at 10% 10%, ${hexToRgba(BRAND, 0.18)}, transparent 60%),
            radial-gradient(1000px 500px at 90% 20%, ${hexToRgba(BRAND, 0.12)}, transparent 60%),
            radial-gradient(900px 500px at 50% 95%, ${hexToRgba(BRAND, 0.10)}, transparent 60%),
            linear-gradient(180deg, ${hexToRgba(BRAND, 0.10)}, transparent 35%)
          `,
        }}
      />

      <div className="relative mx-auto max-w-md px-5 pb-24 pt-7">
        {/* Header card (sama tyyli kuin etusivu) */}
        <div
          className="rounded-3xl border p-5 shadow-sm backdrop-blur-xl"
          style={{
            background: hexToRgba("#ffffff", 0.86),
            borderColor: hexToRgba("#ffffff", 0.55),
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-600">Dokumentointi</div>
              <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <FilePlus2 size={22} style={{ color: BRAND }} />
                Luo uusi raportti
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  <Sparkles size={14} />
                  Premium-luonti
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND }} />
                  Täytä vain tärkeimmät
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-700">
                Anna nimi – voit täydentää sisällön muokkauksessa.
              </p>
            </div>

            {/* Brändimerkki */}
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.85)})`,
              }}
              title="JLTT"
            >
              <span className="text-sm font-semibold">JL</span>
            </div>
          </div>
        </div>

        {/* Lomakekortti (glass + ring + shimmer kuten etusivun linkeissä) */}
        <div
          className="group relative mt-4 overflow-hidden rounded-3xl p-5 shadow-lg ring-1 ring-white/60 backdrop-blur-xl"
          style={{ background: hexToRgba("#ffffff", 0.86) }}
        >
          {/* Shimmer */}
          <div
            className="pointer-events-none absolute -inset-y-10 -left-40 w-40 rotate-12 opacity-0 blur-xl transition duration-700 group-hover:opacity-100 group-hover:translate-x-[520px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${hexToRgba("#ffffff", 0.65)}, transparent)`,
            }}
          />

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Type size={16} className="text-slate-400" />
            Raportin nimi
          </label>
          <div className="mt-1 text-sm text-slate-600">
            Esim. “Eura / x-huolto 02.02.2026”
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Uusi raportti"
            className="mt-3 w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition
                       border-white/70 focus:border-white/90 focus:ring-4"
            style={{
              boxShadow: "inset 0 1px 0 rgba(0,0,0,0.03)",
            }}
          />

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">min. 3 merkkiä</span>
            <span className={isTitleValid ? "text-emerald-600" : "text-slate-400"}>
              {title.trim().length}/3
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={createReport}
            disabled={loading || !isTitleValid}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]
                       disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.92)})`,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Luodaan...
              </>
            ) : (
              <>Luo ja siirry muokkaukseen</>
            )}
          </button>

          {/* Error */}
          {msg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {msg}
            </div>
          ) : null}
        </div>

        {/* Secondary actions */}
        <div className="mt-4 grid gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
            style={{ background: hexToRgba("#ffffff", 0.88) }}
          >
            <ArrowLeft size={18} />
            Takaisin etusivulle
          </Link>
        </div>
      </div>

      {/* Sama animaatio kuin etusivulla */}
      <style jsx>{`
        @keyframes homeBgMove {
          0% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.03) translateY(-14px);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }
        .animate-homebg {
          animation: homeBgMove 22s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
