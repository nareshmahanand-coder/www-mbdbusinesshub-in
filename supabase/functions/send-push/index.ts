// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- FCM OAuth2 access token from service account ----
async function getAccessToken(saJson: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: saJson.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${b64(header)}.${b64(claim)}`;

  // Import PEM private key
  const pem = (saJson.private_key as string)
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsigned}.${sig}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("FCM token error: " + JSON.stringify(j));
  return j.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!saRaw) throw new Error("FCM_SERVICE_ACCOUNT_JSON not set");
    const sa = JSON.parse(saRaw);
    const projectId = sa.project_id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { user_id, title, message, link } = body ?? {};
    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokens, error } = await supabase
      .from("device_push_tokens")
      .select("token")
      .eq("user_id", user_id);
    if (error) throw error;
    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(sa);
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const results: any[] = [];
    for (const { token } of tokens) {
      const payload = {
        message: {
          token,
          notification: { title, body: message ?? "" },
          data: { link: link ?? "/", title, message: message ?? "" },
          android: {
            priority: "HIGH",
            notification: {
              channel_id: "mbd_default",
              sound: "default",
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
          },
        },
      };
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      results.push({ token: token.slice(0, 12), ok: r.ok, status: r.status, body: j });
      if (!r.ok && (j?.error?.status === "NOT_FOUND" || j?.error?.status === "UNREGISTERED")) {
        await supabase.from("device_push_tokens").delete().eq("token", token);
      }
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});