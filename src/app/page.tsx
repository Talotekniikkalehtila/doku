"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const BRAND = "#3060a6";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Brändi tausta “wow”, hyvin kevyt */}
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

      {/* Header / top area */}
      <div className="relative">
        <div
          className="mx-auto max-w-md px-5 pb-6 pt-7"
          style={{
            ["--brand" as any]: BRAND,
          }}
        >
          <div
            className="rounded-3xl border p-5 shadow-sm backdrop-blur-xl"
            style={{
              background: hexToRgba("#ffffff", 0.86),
              borderColor: hexToRgba("#ffffff", 0.55),
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-600">
                  Dokumentointi
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                  Etusivu
                </h1>

                <div className="mt-2 text-sm text-slate-700">
                  {loading ? (
                    <span>Haetaan sessiota…</span>
                  ) : email ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: BRAND }}
                      />
                      <span className="truncate">
                        Kirjautunut: <span className="font-mono">{email}</span>
                      </span>
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
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Launcher-napit */}
      <div className="relative mx-auto flex max-w-md flex-col px-5 pb-24">
        <div className="grid gap-4">
          {/* Luo raportti - premium highlight */}
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
                  background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(
                    BRAND,
                    0.85
                  )})`,
                }}
                aria-hidden
              >
                <span className="text-lg">＋</span>
              </div>

              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">
                  Luo raportti
                </div>
                <div className="mt-0.5 text-sm text-slate-600">
                  Aloita uusi dokumentointi
                </div>
              </div>

              <div className="ml-auto text-slate-400 transition group-hover:translate-x-0.5">
                →
              </div>
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
                <span className="text-lg">📁</span>
              </div>

              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">
                  Arkisto
                </div>
                <div className="mt-0.5 text-sm text-slate-600">
                  Selaa aiempia raportteja
                </div>
              </div>

              <div className="ml-auto text-slate-400 transition group-hover:translate-x-0.5">
                →
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Kirjaudu ulos: alhaalla premium-tyylillä */}
      <div className="fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-md px-5 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
          <button
            className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
            style={{ background: hexToRgba("#ffffff", 0.88) }}
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            🚪 Kirjaudu ulos
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

