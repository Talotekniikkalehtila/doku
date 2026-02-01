"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Archive, LogOut, ShieldCheck } from "lucide-react";

const BRAND = "#3060a6";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("fi-FI", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date());
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Brändi tausta “wow”, kevyt */}
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

      {/* Header */}
      <div className="relative">
        <div className="mx-auto max-w-md px-5 pb-6 pt-7">
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
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">Etusivu</h1>

                {/* ✅ Päiväys + pieni status */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  {today ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND }} />
                      {today}
                    </span>
                  ) : null}

                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <ShieldCheck size={14} />
                    Valmiina käyttöön
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  {loading ? (
                    <span>Haetaan sessiota…</span>
                  ) : email ? (
                    <span className="truncate">
                      Kirjautunut: <span className="font-mono">{email}</span>
                    </span>
                  ) : (
                    <span className="text-slate-800">Ei sessiota</span>
                  )}
                </div>
              </div>

              {/* Brändi-merkki */}
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
        </div>
      </div>

      {/* Launcher */}
      <div className="relative mx-auto flex max-w-md flex-col px-5 pb-24">
        <div className="grid gap-4">
          {/* Luo raportti */}
          <Link
            href="/reports/new"
            className="group relative overflow-hidden rounded-3xl p-5 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
            style={{ background: hexToRgba("#ffffff", 0.86) }}
          >
            {/* Shimmer */}
            <div
              className="pointer-events-none absolute -inset-y-10 -left-40 w-40 rotate-12 opacity-0 blur-xl transition duration-700 group-hover:opacity-100 group-hover:translate-x-[520px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${hexToRgba("#ffffff", 0.65)}, transparent)`,
              }}
            />

            <div className="flex items-center gap-4">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.85)})`,
                }}
                aria-hidden
              >
                <Plus size={20} />
              </div>

              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">Luo raportti</div>
                <div className="mt-0.5 text-sm text-slate-600">Aloita uusi dokumentointi</div>
              </div>

              <div className="ml-auto text-slate-400 transition group-hover:translate-x-0.5">→</div>
            </div>
          </Link>

          {/* Arkisto */}
          <Link
            href="/archive"
            className="group rounded-3xl p-5 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
            style={{ background: hexToRgba("#ffffff", 0.86) }}
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <Archive size={20} />
              </div>

              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">Arkisto</div>
                <div className="mt-0.5 text-sm text-slate-600">Selaa aiempia raportteja</div>
              </div>

              <div className="ml-auto text-slate-400 transition group-hover:translate-x-0.5">→</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Kirjaudu ulos */}
      <div className="fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-md px-5 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
            style={{ background: hexToRgba("#ffffff", 0.88) }}
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            <LogOut size={18} />
            Kirjaudu ulos
          </button>
        </div>
      </div>

      {/* Animaatio */}
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
