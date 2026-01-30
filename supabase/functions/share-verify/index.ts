// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomToken(len = 48) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return btoa(String.fromCharCode(...bytes)).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { slug, password } = await req.json();
    if (!slug) return json({ error: "Missing slug" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: share, error: e1 } = await admin
      .from("report_shares")
      .select("id, password_hash")
      .eq("slug", slug)
      .single();

    if (e1 || !share) return json({ error: "Not found" }, 404);

    if (share.password_hash) {
      if (!password) return json({ needPassword: true }, 401);
      const ok = await bcrypt.compare(password, share.password_hash);
      if (!ok) return json({ error: "Wrong password" }, 403);
    }

    // Create session token valid 7 days
    const token = randomToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await admin.from("report_share_sessions").insert({
      share_id: share.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return json({ sessionToken: token, expiresAt });
  } catch (err: any) {
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});
