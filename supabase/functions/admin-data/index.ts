import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_PIN = "02032026";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const KYC_BUCKET = "kyc-photos";

const EKYC_UPLOAD_PATH = "/ekyc?mode=upload&source=resend";

const isMissing = (v: unknown) => !v || String(v).trim() === "";

const kycPhotoKind = (name: string): "selfie_url" | "aadhaar_front_url" | "aadhaar_back_url" | null => {
  const n = name.toLowerCase().replace(/_/g, "-");
  if (n.includes("selfie")) return "selfie_url";
  if (n.includes("aadhaar-front") || n.includes("aadhar-front") || n.includes("front")) return "aadhaar_front_url";
  if (n.includes("aadhaar-back") || n.includes("aadhar-back") || n.includes("back")) return "aadhaar_back_url";
  return null;
};

const enrichKycRows = async (sb: any, rows: any[]) => {
  return Promise.all((rows || []).map(async (row) => {
    const next = { ...row };
    const missingBefore = ["selfie_url", "aadhaar_front_url", "aadhaar_back_url"].filter((key) => isMissing(next[key]));
    if (!next.user_id || missingBefore.length === 0) {
      next.missing_photos = missingBefore;
      return next;
    }

    const { data: files } = await sb.storage.from(KYC_BUCKET).list(String(next.user_id), {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    const patch: Record<string, string> = {};
    for (const file of files || []) {
      if (!file?.name) continue;
      const kind = kycPhotoKind(file.name);
      if (!kind || !isMissing(next[kind])) continue;
      const path = `${next.user_id}/${file.name}`;
      const { data: pub } = sb.storage.from(KYC_BUCKET).getPublicUrl(path);
      if (pub?.publicUrl) {
        next[kind] = pub.publicUrl;
        patch[kind] = pub.publicUrl;
      }
    }

    if (Object.keys(patch).length > 0) {
      await sb.from("kyc_verifications").update(patch).eq("id", next.id);
    }
    next.missing_photos = ["selfie_url", "aadhaar_front_url", "aadhaar_back_url"].filter((key) => isMissing(next[key]));
    return next;
  }));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const pin = req.headers.get("x-admin-pin") || "";
  if (pin !== ADMIN_PIN) return json({ error: "unauthorized" }, 401);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const action: string = body.action || "overview";

  try {
    switch (action) {
      case "overview": {
        const now = new Date();
        const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [users, premium, merchants, premiumMerchants, payToday, payMonth, kyc, complaints] = await Promise.all([
          sb.from("profiles").select("id", { count: "exact", head: true }),
          sb.from("bharat_gaurav_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
          sb.from("merchant_profiles").select("id", { count: "exact", head: true }),
          sb.from("merchant_profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
          sb.from("payment_orders").select("amount").eq("status", "paid").gte("updated_at", startDay),
          sb.from("payment_orders").select("amount").eq("status", "paid").gte("updated_at", startMonth),
          sb.from("kyc_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
          sb.from("complaints").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);
        const sum = (r: any) => (r.data || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
        return json({
          users: users.count || 0,
          premium: premium.count || 0,
          merchants: merchants.count || 0,
          premiumMerchants: premiumMerchants.count || 0,
          freeMerchants: (merchants.count || 0) - (premiumMerchants.count || 0),
          todayEarn: sum(payToday),
          monthEarn: sum(payMonth),
          kyc: kyc.count || 0,
          complaints: complaints.count || 0,
        });
      }
      case "users": {
        const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
        return json({ rows: data || [] });
      }
      case "merchants": {
        const { data } = await sb.from("merchant_profiles").select("*").order("created_at", { ascending: false }).limit(1000);
        return json({ rows: data || [] });
      }
      case "matrimony": {
        const { data } = await sb.from("matrimony_profiles").select("*").order("created_at", { ascending: false }).limit(1000);
        return json({ rows: data || [] });
      }
      case "subscriptions": {
        const [bg, mp, mat] = await Promise.all([
          sb.from("bharat_gaurav_memberships").select("*").order("created_at", { ascending: false }),
          sb.from("merchant_profiles").select("user_id,shop_name,premium_plan,premium_start_date,plan_ends_at,is_premium,created_at").eq("is_premium", true).order("created_at", { ascending: false }),
          sb.from("matrimony_profiles").select("user_id,name,subscription_plan,subscription_start,subscription_end,created_at").not("subscription_plan", "is", null).order("created_at", { ascending: false }),
        ]);
        const userIds = Array.from(new Set([
          ...(bg.data || []).map((r: any) => r.user_id),
          ...(mp.data || []).map((r: any) => r.user_id),
          ...(mat.data || []).map((r: any) => r.user_id),
        ].filter(Boolean)));
        let profileMap: Record<string, any> = {};
        let payMap: Record<string, any> = {};
        if (userIds.length) {
          const [{ data: profs }, { data: pays }] = await Promise.all([
            sb.from("profiles").select("id,display_name,email,phone").in("id", userIds),
            sb.from("payment_orders").select("user_id,module,status,amount,created_at,razorpay_payment_id").in("user_id", userIds).order("created_at", { ascending: false }),
          ]);
          (profs || []).forEach((p: any) => { profileMap[p.id] = p; });
          (pays || []).forEach((p: any) => {
            const k = `${p.user_id}|${p.module}`;
            if (!payMap[k]) payMap[k] = p;
          });
        }
        return json({ bg: bg.data || [], mp: mp.data || [], mat: mat.data || [], profiles: profileMap, payments: payMap });
      }
      case "kyc": {
        const filter = body.filter || "pending";
        let q = sb.from("kyc_verifications").select("*").order("created_at", { ascending: false }).limit(500);
        if (filter === "expired") {
          q = q.lt("kyc_expires_at", new Date().toISOString());
        } else if (filter !== "all") {
          q = q.eq("status", filter);
        }
        const { data } = await q;
        const rows = await enrichKycRows(sb, data || []);
        return json({ rows });
      }
      case "kyc_certificate": {
        const { id, user_id } = body;
        if (!id && !user_id) return json({ error: "id or user_id required" }, 400);
        let q = sb.from("kyc_verifications").select("*").order("created_at", { ascending: false }).limit(1);
        q = id ? q.eq("id", id) : q.eq("user_id", user_id);
        const { data, error } = await q;
        if (error) return json({ error: error.message }, 400);
        const rows = await enrichKycRows(sb, data || []);
        return json({ row: rows[0] || null });
      }
      case "complaints": {
        const { data } = await sb.from("complaints").select("*").order("created_at", { ascending: false }).limit(500);
        return json({ rows: data || [] });
      }
      case "agents": {
        const { data: agents } = await sb.from("agents").select("*").order("created_at", { ascending: false }).limit(1000);
        const ids = (agents || []).map((a: any) => a.id);
        let refCounts: Record<string, number> = {};
        let commTotals: Record<string, number> = {};
        if (ids.length) {
          const [{ data: refs }, { data: comms }] = await Promise.all([
            sb.from("agent_referrals").select("agent_id").in("agent_id", ids),
            sb.from("agent_commissions").select("agent_id,amount").in("agent_id", ids),
          ]);
          (refs || []).forEach((r: any) => { refCounts[r.agent_id] = (refCounts[r.agent_id] || 0) + 1; });
          (comms || []).forEach((c: any) => { commTotals[c.agent_id] = (commTotals[c.agent_id] || 0) + Number(c.amount || 0); });
        }
        return json({ rows: agents || [], refCounts, commTotals });
      }
      case "agent_detail": {
        const { id } = body;
        if (!id) return json({ error: "id required" }, 400);
        const [{ data: agent }, { data: referrals }, { data: commissions }] = await Promise.all([
          sb.from("agents").select("*").eq("id", id).maybeSingle(),
          sb.from("agent_referrals").select("*").eq("agent_id", id).order("created_at", { ascending: false }),
          sb.from("agent_commissions").select("*").eq("agent_id", id).order("created_at", { ascending: false }),
        ]);
        const userIds = Array.from(new Set((referrals || []).map((r: any) => r.merchant_user_id).filter(Boolean)));
        let merchants: any[] = [];
        if (userIds.length) {
          const { data } = await sb.from("merchant_profiles").select("user_id,shop_name,city,phone,is_premium,premium_plan,plan_ends_at").in("user_id", userIds);
          merchants = data || [];
        }
        return json({ agent: agent || null, referrals: referrals || [], commissions: commissions || [], merchants });
      }
      case "agent_status": {
        const { id, status, admin_notes } = body;
        if (!id || !["pending", "approved", "rejected", "suspended"].includes(status)) {
          return json({ error: "invalid status" }, 400);
        }
        const { error } = await sb.from("agents").update({ status, admin_notes: admin_notes ?? "" }).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "audit": {
        const filter = body.filter || "all";
        let q = sb.from("payment_orders").select("*").order("created_at", { ascending: false }).limit(500);
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        return json({ rows: data || [] });
      }
      case "analytics": {
        const since = new Date(); since.setDate(since.getDate() - 30);
        const [users, payments, merchants, members] = await Promise.all([
          sb.from("profiles").select("created_at").gte("created_at", since.toISOString()),
          sb.from("payment_orders").select("amount,created_at,status").eq("status", "paid").gte("created_at", since.toISOString()),
          sb.from("merchant_profiles").select("is_premium"),
          sb.from("bharat_gaurav_memberships").select("plan,status,amount"),
        ]);
        return json({
          users: users.data || [], payments: payments.data || [],
          merchants: merchants.data || [], members: members.data || [],
        });
      }
      case "update": {
        // body: { table, id, patch }
        const { table, id, patch } = body;
        const allowed = ["merchant_profiles", "matrimony_profiles", "kyc_verifications", "complaints"];
        if (!allowed.includes(table)) return json({ error: "table not allowed" }, 400);
        const { error } = await sb.from(table).update(patch).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "block_user": {
        // body: { user_id, reason }
        const { user_id, reason } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        const { error } = await sb.from("profiles").update({
          blocked: true,
          block_reason: reason || "Blocked by admin",
          blocked_at: new Date().toISOString(),
        }).eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "unblock_user": {
        const { user_id } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        const { error } = await sb.from("profiles").update({
          blocked: false,
          block_reason: "",
          blocked_at: null,
        }).eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "resend_kyc": {
        // body: { user_id }
        const { user_id } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        const now = new Date().toISOString();
        await sb.from("kyc_verifications")
          .update({ status: "pending", re_kyc_requested_at: now, kyc_expires_at: now })
          .eq("user_id", user_id);
        // Use the first admin as sender_id (admin_messages requires non-null sender)
        const { data: anyAdmin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
        const senderId = anyAdmin?.user_id || user_id;
        await sb.from("admin_messages").insert({
          sender_id: senderId,
          recipient_user_id: user_id,
          recipient_group: "user",
          title: "e-KYC Resend / पुनः e-KYC करें",
          message: `कृपया अपना e-KYC upload form दोबारा पूरा करें: ${EKYC_UPLOAD_PATH}\nMobile OTP → Aadhaar Number → Aadhaar Front/Back Photo → Selfie`,
          severity: "warning",
        });
        return json({ ok: true, link: EKYC_UPLOAD_PATH });
      }
      case "delete_kyc": {
        const { id } = body;
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await sb.from("kyc_verifications").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "resend_payment_link": {
        // body: { user_id, module: "bharat_gaurav"|"merchant_premium"|"marriage_bureau", plan: "monthly"|"yearly" }
        const { user_id, module: mod, plan } = body;
        if (!user_id || !mod) return json({ error: "user_id and module required" }, 400);
        const planLabel = plan === "yearly" ? "Yearly" : "Monthly";
        const map: Record<string, { path: string; title: string; amount: string }> = {
          bharat_gaurav: {
            path: "/membership",
            title: `Bharat Gaurav ${planLabel} Plan`,
            amount: plan === "yearly" ? "₹100/year" : "₹10/month",
          },
          merchant_premium: {
            path: "/merchant",
            title: `Merchant Portal Premium (${planLabel})`,
            amount: plan === "yearly" ? "₹999/year" : "₹99/month",
          },
          marriage_bureau: {
            path: "/matrimony",
            title: `Marriage Bureau Premium (${planLabel})`,
            amount: plan === "yearly" ? "₹999/year" : "₹99/month",
          },
        };
        const info = map[mod];
        if (!info) return json({ error: "unknown module" }, 400);
        const { data: anyAdmin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
        const senderId = anyAdmin?.user_id || user_id;
        const { error } = await sb.from("admin_messages").insert({
          sender_id: senderId,
          recipient_user_id: user_id,
          recipient_group: "user",
          title: `Payment Link: ${info.title}`,
          message: `${info.amount}\nPayment page खोलने के लिए नीचे बटन दबाएँ: ${info.path}`,
          severity: "info",
        });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, path: info.path });
      }
      case "manual_verify": {
        // body: { user_id }
        const { user_id } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        const now = new Date().toISOString();
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        await sb.from("kyc_verifications").update({
          status: "verified",
          verified_at: now,
          kyc_expires_at: expires,
          re_kyc_requested_at: null,
        }).eq("user_id", user_id);
        try { await sb.from("merchant_profiles").update({ is_verified: true }).eq("user_id", user_id); } catch (_) {}
        const { data: anyAdmin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
        const senderId = anyAdmin?.user_id || user_id;
        await sb.from("admin_messages").insert({
          sender_id: senderId,
          recipient_user_id: user_id,
          recipient_group: "user",
          title: "Account Verified ✅",
          message: "आपका KYC + Payment Admin द्वारा सत्यापित (verified) कर दिया गया है।",
          severity: "info",
        });
        return json({ ok: true });
      }
      case "delete_user": {
        const { user_id } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        const tables = [
          "payment_orders","merchant_profiles","matrimony_profiles","kyc_verifications",
          "blood_donors","blood_donations","blood_requests","classifieds","jobs","job_applications",
          "complaints","saved_shops","service_providers","family_members",
          "last_known_locations","user_roles","bharat_gaurav_memberships","admin_messages",
          "account_delete_requests",
        ];
        for (const t of tables) {
          try { await sb.from(t).delete().eq("user_id", user_id); } catch (_) {}
        }
        try { await sb.from("admin_messages").delete().eq("recipient_user_id", user_id); } catch (_) {}
        try { await sb.from("profiles").delete().eq("id", user_id); } catch (_) {}
        try { await sb.auth.admin.deleteUser(user_id); } catch (_) {}
        return json({ ok: true });
      }
      case "send_direct_message": {
        const { user_id, title, message, severity } = body;
        if (!user_id || !title || !message) return json({ error: "user_id, title, message required" }, 400);
        const { data: anyAdmin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
        const senderId = anyAdmin?.user_id || user_id;
        const { error } = await sb.from("admin_messages").insert({
          sender_id: senderId,
          recipient_user_id: user_id,
          recipient_group: "user",
          title,
          message,
          severity: severity || "info",
        });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "search_users": {
        const q = String(body.q || "").trim();
        let query = sb.from("profiles").select("id,display_name,phone,email").order("created_at", { ascending: false }).limit(30);
        if (q) query = query.or(`display_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
        const { data } = await query;
        return json({ rows: data || [] });
      }
      case "delete_subscription": {
        // body: { kind: "bg"|"mp"|"mat", id (bg=membership id, mp/mat=user_id) }
        const { kind, id } = body;
        if (!kind || !id) return json({ error: "kind and id required" }, 400);
        if (kind === "bg") {
          // Best-effort: cancel Razorpay subscription if a subscription_id was stored.
          const { data: row } = await sb.from("bharat_gaurav_memberships").select("*").eq("id", id).maybeSingle();
          let payOrder: any = null;
          if (row?.payment_order_id) {
            const { data } = await sb.from("payment_orders").select("metadata").eq("id", row.payment_order_id).maybeSingle();
            payOrder = data;
          }
          const subId = payOrder?.metadata?.razorpay_subscription_id || payOrder?.metadata?.subscription_id || null;
          if (subId) {
            const keyId = Deno.env.get("RAZORPAY_KEY_ID");
            const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
            if (keyId && keySecret) {
              try {
                await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}/cancel`, {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
                  },
                  body: JSON.stringify({ cancel_at_cycle_end: 0 }),
                });
              } catch (_) { /* ignore */ }
            }
          }
          const { error } = await sb.from("bharat_gaurav_memberships")
            .update({ status: "cancelled", expires_at: new Date().toISOString() })
            .eq("id", id);
          if (error) return json({ error: error.message }, 400);
          return json({ ok: true });
        }
        if (kind === "mp") {
          const { error } = await sb.from("merchant_profiles").update({
            is_premium: false,
            premium_plan: null,
            premium_start_date: null,
            plan_ends_at: null,
          }).eq("user_id", id);
          if (error) return json({ error: error.message }, 400);
          return json({ ok: true });
        }
        if (kind === "mat") {
          const { error } = await sb.from("matrimony_profiles").update({
            subscription_plan: null,
            subscription_start: null,
            subscription_end: null,
          }).eq("user_id", id);
          if (error) return json({ error: error.message }, 400);
          return json({ ok: true });
        }
        return json({ error: "unknown kind" }, 400);
      }
      case "delete_requests": {
        const filter = body.filter || "pending";
        let q = sb.from("account_delete_requests").select("*").order("created_at", { ascending: false }).limit(500);
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        return json({ rows: data || [] });
      }
      case "duplicate_attempts": {
        const { data } = await sb
          .from("duplicate_attempts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        const ids = Array.from(new Set(
          (data || []).flatMap((r: any) => [r.attempted_user_id, r.existing_user_id]).filter(Boolean),
        ));
        let profileMap: Record<string, any> = {};
        if (ids.length > 0) {
          const { data: profs } = await sb
            .from("profiles").select("id, display_name, email, phone").in("id", ids);
          (profs || []).forEach((p: any) => { profileMap[p.id] = p; });
        }
        return json({ rows: (data || []).map((r: any) => ({
          ...r,
          attempted_profile: r.attempted_user_id ? profileMap[r.attempted_user_id] || null : null,
          existing_profile: r.existing_user_id ? profileMap[r.existing_user_id] || null : null,
        })) });
      }
      case "delete_duplicate_attempt": {
        const { id } = body;
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await sb.from("duplicate_attempts").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "reject_delete_request": {
        const { id, notes } = body;
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await sb.from("account_delete_requests")
          .update({ status: "rejected", reviewer_notes: notes || "", reviewed_at: new Date().toISOString() })
          .eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "approve_delete_request": {
        const { id } = body;
        if (!id) return json({ error: "id required" }, 400);
        const { data: reqRow, error: rErr } = await sb.from("account_delete_requests").select("*").eq("id", id).maybeSingle();
        if (rErr || !reqRow) return json({ error: rErr?.message || "request not found" }, 404);
        const userId = reqRow.user_id;
        const tables = [
          "payment_orders","merchant_profiles","matrimony_profiles","kyc_verifications",
          "blood_donors","blood_donations","blood_requests","classifieds","jobs","job_applications",
          "complaints","saved_shops","shop_ratings","service_providers","family_members",
          "last_known_locations","user_roles","bharat_gaurav_memberships","profiles",
        ];
        for (const t of tables) {
          try { await sb.from(t).delete().eq("user_id", userId); } catch (_) {}
        }
        try { await sb.from("profiles").delete().eq("id", userId); } catch (_) {}
        try { await sb.auth.admin.deleteUser(userId); } catch (_) {}
        await sb.from("account_delete_requests")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", id);
        return json({ ok: true });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});