"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const BRAND = "#3060a6"; // ← vaihda tähän teidän brändisininen jos eri

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
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

  const bgA = hexToRgba(BRAND, 0.18);
  const bgB = hexToRgba(BRAND, 0.06);
  const ring = hexToRgba(BRAND, 0.28);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* App-tyylinen “header” */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${bgA}, ${bgB})`,
          borderBottom: `1px solid ${hexToRgba(BRAND, 0.12)}`,
        }}
      >
        <div className="mx-auto max-w-md px-5 pb-6 pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-600">Dokumentointi</div>
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

            {/* pieni “badge”/logo-paikka */}
            <div
              className="mt-1 hidden h-10 w-10 shrink-0 rounded-2xl sm:block"
              style={{
                background: hexToRgba(BRAND, 0.12),
                border: `1px solid ${hexToRgba(BRAND, 0.14)}`,
              }}
              title="JLTT"
            />
          </div>
        </div>
      </div>

      {/* Sisältö: keskitetty launcher */}
      <div className="mx-auto flex max-w-md flex-col px-5 pb-24 pt-6">
        <div className="grid gap-4">
          {/* Luo raportti - päätoiminto */}
          <Link
            href="/reports/new"
            className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99]"
            style={{ boxShadow: `0 0 0 1px ${ring}` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-white"
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
            className="group rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <span className="text-lg">📁</span>
              </div>

              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">Arkisto</div>
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

      {/* Kirjaudu ulos: mobiilissa alhaalla kiinteä */}
      <div className="fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-md px-5 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
          <button
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99]"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            Kirjaudu ulos
          </button>
        </div>
      </div>
    </main>
  );
}
