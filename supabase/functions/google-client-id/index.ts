const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") || "";
  return new Response(JSON.stringify({ clientId }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});