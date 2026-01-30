"use client";

import { useEffect, useState } from "react";

export function PointModal({
  open,
  onClose,
  title,
  note,
  onSave,
  onUploadImage,
  images,
  readOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  note: string;
  onSave: (next: { title: string; note: string }) => void;
  onUploadImage: (file: File) => Promise<void>;
  images: { id: string; url: string | null }[];
  readOnly?: boolean;
}) {
  const [t, setT] = useState(title);
  const [n, setN] = useState(note);
  useEffect(() => {
  if (!open) return;
  setT(title || "");
  setN(note || "");
}, [open, title, note]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-3 md:place-items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-semibold">Kirjaus</div>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100">
            Sulje
          </button>
        </div>

        <div className="grid gap-3 p-4">
          <div className="grid gap-1">
            <div className="text-xs text-slate-500">Otsikko</div>
            <input value={t} onChange={(e) => setT(e.target.value)} className="rounded-xl border px-3 py-2" />
          </div>

          <div className="grid gap-1">
            <div className="text-xs text-slate-500">Huomiot</div>
            <textarea value={n} onChange={(e) => setN(e.target.value)} className="min-h-28 rounded-xl border px-3 py-2" />
          </div>

          <div className="grid gap-2">
  {!readOnly && (
  <>
    <div className="text-xs text-slate-500">Lisää kuva tälle kohdalle</div>
    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
      + Lisää kuva
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await onUploadImage(f);
          e.target.value = "";
        }}
      />
    </label>
  </>
)}

  <div className="grid grid-cols-3 gap-2">
    {images.map((im) => (
      <div key={im.id} className="aspect-square overflow-hidden rounded-xl border bg-slate-50">
        {im.url ? <img src={im.url} alt="" className="h-full w-full object-cover" /> : null}
      </div>
    ))}
  </div>
</div>

<div className="flex items-center justify-end gap-2 pt-2">
  <button
    onClick={onClose}
    className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100"
  >
    Takaisin
  </button>

  {!readOnly && (
    <button
      onClick={() => onSave({ title: t, note: n })}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
    >
      Tallenna kohta
    </button>
  )}
</div>
  </div>
      </div>
    </div>
  );
}
