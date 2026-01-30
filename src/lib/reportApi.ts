import { supabase } from "@/lib/supabaseClient";

export async function requireUserId() {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user?.id;
  if (!uid) throw new Error("Not logged in");
  return uid;
}

export async function uploadCover(ownerId: string, reportId: string, file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${ownerId}/${reportId}/cover.${ext}`;

  const { error } = await supabase.storage.from("report-images").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { error: e2 } = await supabase.from("reports").update({ cover_image_path: path }).eq("id", reportId);
  if (e2) throw e2;

  return path;
}

export async function createPoint(reportId: string, x: number, y: number) {
  const { data, error } = await supabase
    .from("report_points")
    .insert({ report_id: reportId, x, y })
    .select("id,x,y,label,note")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePoint(pointId: string, patch: { label?: string; note?: string }) {
  const { error } = await supabase.from("report_points").update(patch).eq("id", pointId);
  if (error) throw error;
}

export async function uploadPointImage(ownerId: string, reportId: string, pointId: string, file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${ownerId}/${reportId}/points/${pointId}/${filename}`;

  const { error } = await supabase.storage.from("report-images").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data, error: e2 } = await supabase
    .from("report_point_images")
    .insert({ point_id: pointId, image_path: path })
    .select("id,image_path,point_id")
    .single();

  if (e2) throw e2;
  return data;
}

export async function getOwnerReport(reportId: string) {
  const { data: report, error: eR } = await supabase
    .from("reports")
    .select("id,title,status,cover_image_path,created_at,updated_at")
    .eq("id", reportId)
    .single();
  if (eR) throw eR;

  const { data: points, error: eP } = await supabase
    .from("report_points")
    .select("id,report_id,x,y,label,note,created_at,updated_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  if (eP) throw eP;

  const pointIds = (points ?? []).map((p) => p.id);
  const { data: imgs } = pointIds.length
    ? await supabase.from("report_point_images").select("id,point_id,image_path,created_at").in("point_id", pointIds)
    : { data: [] as any[] };

  return { report, points: points ?? [], point_images: imgs ?? [] };
}

export async function signedUrl(path: string) {
  const { data, error } = await supabase.storage.from("report-images").createSignedUrl(path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}
