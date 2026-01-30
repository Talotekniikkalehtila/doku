"use client";

import { useMemo, useRef, useState } from "react";

type Point = {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  label?: string | null;
  note?: string | null;
};

export function ImageMarkerEditor({
  imageUrl,
  points,
  onAddPoint,
  onOpenPoint,
}: {
  imageUrl: string;
  points: Point[];
  onAddPoint: (x: number, y: number) => void;
  onOpenPoint: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [addMode, setAddMode] = useState(false);

  const sorted = useMemo(() => points ?? [], [points]);

  function handleClick(e: React.MouseEvent) {
    if (!addMode) return;
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const x = Math.min(1, Math.max(0, px));
    const y = Math.min(1, Math.max(0, py));

    onAddPoint(x, y);
    setAddMode(false);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
            addMode ? "bg-red-600 text-white" : "bg-slate-900 text-white"
          }`}
          onClick={() => setAddMode((v) => !v)}
        >
          {addMode ? "Napauta kuvaa…" : "Lisää kirjaus"}
        </button>
        <div className="text-xs text-slate-500">
          {addMode ? "Lisää piste napauttamalla kuvaa" : "Klikkaa punaista pistettä avataksesi"}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl border bg-white"
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Raporttikuva" className="block w-full select-none" draggable={false} />

        {sorted.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              onOpenPoint(p.id);
            }}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-md"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            aria-label="Avaa kirjaus"
          />
        ))}
      </div>
    </div>
  );
}
