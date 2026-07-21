import nodemailer from "npm:nodemailer@6.9.13";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const OSB_USERNAME = Deno.env.get("SHOPIER_OSB_USERNAME")!;
const OSB_KEY = Deno.env.get("SHOPIER_OSB_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASS")!;
const SENDER = Deno.env.get("SENDER_EMAIL") || "iletisim@gringlizce.com";
const ADMIN_EMAIL = Deno.env.get("RECIPIENT_EMAIL") || "atasal@gringlizce.com";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let pw = "";
  for (let i = 0; i < length; i++) pw += chars[arr[i] % chars.length];
  return pw;
}

function esc(s: unknown): string {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

async function verifyHash(res: string, hash: string): Promise<boolean> {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(OSB_KEY);
  const dataBytes = enc.encode(res + OSB_USERNAME);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

async function parseBody(req: Request): Promise<{ res: string; hash: string }> {
  const contentType = req.headers.get("content-type") || "";
  console.log("OSB content-type:", contentType);

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return {
      res: String(form.get("res") || ""),
      hash: String(form.get("hash") || ""),
    };
  }

  const text = await req.text();
  console.log("OSB raw body length:", text.length);

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(text);
      return {
        res: String(parsed.res || ""),
        hash: String(parsed.hash || ""),
      };
    } catch {}
  }

  const params = new URLSearchParams(text);
  return {
    res: params.get("res") || "",
    hash: params.get("hash") || "",
  };
}

function extractProducts(order: Record<string, unknown>): Array<{ id: string; price: number | null }> {
  const items: Array<{ id: string; price: number | null }> = [];
  const seen = new Set<string>();

  const mainId = String(order.productid || "").trim();
  const totalPrice = parseFloat(String(order.price || "0")) || null;

  if (mainId) {
    items.push({ id: mainId, price: totalPrice });
    seen.add(mainId);
  }

  const productlistRaw = order.productlist;
  if (!productlistRaw) return items;

  let listStr = "";
  if (typeof productlistRaw === "string") {
    listStr = productlistRaw.trim();
  } else if (Array.isArray(productlistRaw)) {
    for (const entry of productlistRaw) {
      let id = "";
      if (typeof entry === "string" || typeof entry === "number") {
        id = String(entry).trim();
      } else if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        id = String(obj.id || obj.productid || obj.product_id || "").trim();
      }
      if (id && !seen.has(id)) {
        items.push({ id, price: null });
        seen.add(id);
      }
    }
    return items;
  }

  if (!listStr || listStr === "[]" || listStr === "null") return items;

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(listStr);
  } catch {
    parsed = null;
  }

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      let id = "";
      if (typeof entry === "string" || typeof entry === "number") {
        id = String(entry).trim();
      } else if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        id = String(obj.id || obj.productid || obj.product_id || "").trim();
      }
      if (id && !seen.has(id)) {
        items.push({ id, price: null });
        seen.add(id);
      }
    }
    return items;
  }

  if (listStr.includes(",")) {
    for (const part of listStr.split(",")) {
      const id = part.trim();
      if (id && !seen.has(id)) {
        items.push({ id, price: null });
        seen.add(id);
      }
    }
    return items;
  }

  if (listStr && !seen.has(listStr)) {
    items.push({ id: listStr, price: null });
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return new Response("Shopier OSB endpoint ready. Use POST.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  let res = "", hash = "";
  try {
    const parsed = await parseBody(req);
    res = parsed.res;
    hash = parsed.hash;
  } catch (e) {
    console.error("OSB body parse failed:", e);
    return new Response("missing parameter", { status: 400 });
  }

  console.log("OSB parsed:", { hasRes: !!res, hasHash: !!hash, resLen: res.length, hashLen: hash.length });

  if (!res || !hash) {
    return new Response("missing parameter", { status: 400 });
  }

  if (!(await verifyHash(res, hash))) {
    console.warn("OSB hash mismatch");
    return new Response("invalid hash", { status: 401 });
  }

  let order: Record<string, unknown>;
  try {
    const jsonStr = atob(res);
    order = JSON.parse(jsonStr);
  } catch {
    return new Response("invalid payload", { status: 400 });
  }

  console.log("OSB raw order:", JSON.stringify({
    orderid: order.orderid,
    productid: order.productid,
    productlist: order.productlist,
    chartdetails: order.chartdetails,
    price: order.price,
  }));

  const buyerEmail = String(order.email || "").toLowerCase().trim();
  const orderid = String(order.orderid || "");
  const buyerName = String(order.buyername || "").trim();
  const buyerSurname = String(order.buyersurname || "").trim();
  const istest = order.istest === 1 || order.istest === "1";
  const fullName = `${buyerName} ${buyerSurname}`.trim() || buyerEmail;

  const products = extractProducts(order);

  if (!buyerEmail || !orderid || products.length === 0) {
    console.warn("OSB: missing required fields", { buyerEmail, orderid, productCount: products.length });
    return new Response("success", { status: 200 });
  }

  const productIds = products.map((p) => p.id);
  const { data: dbProducts } = await supabase
    .from("products")
    .select("slug, name, shopier_product_id, product_type, ai_quota")
    .in("shopier_product_id", productIds);

  type ProductMeta = { slug: string; name: string; product_type: string; ai_quota: number | null };
  const dbByShopierId = new Map<string, ProductMeta>();
  for (const p of dbProducts || []) {
    dbByShopierId.set(String(p.shopier_product_id), {
      slug: p.slug,
      name: p.name,
      product_type: p.product_type,
      ai_quota: p.ai_quota,
    });
  }

  const unmatched = products.filter((p) => !dbByShopierId.has(p.id));
  const matched = products
    .filter((p) => dbByShopierId.has(p.id))
    .map((p) => {
      const meta = dbByShopierId.get(p.id)!;
      return {
        ...p,
        slug: meta.slug,
        name: meta.name,
        product_type: meta.product_type,
        ai_quota: meta.ai_quota,
      };
    });

  if (unmatched.length > 0) {
    try {
      await transporter.sendMail({
        from: SENDER,
        to: ADMIN_EMAIL,
        subject: "[Gringlizce] Bilinmeyen Shopier ürünü",
        text:
          `Shopier siparişi geldi, products tablosunda eşleşmeyen ürünler var.

Order ID: ${orderid}
Müşteri: ${fullName} <${buyerEmail}>
Test: ${istest ? "EVET" : "HAYIR"}

Eşleşmeyen Shopier ProductID'ler:
${unmatched.map((u) => "  - " + u.id).join("\n")}

products tablosuna shopier_product_id ekle veya manuel işle.`,
      });
    } catch (e) {
      console.error("admin mail failed:", e);
    }
  }

  if (matched.length === 0) {
    return new Response("success", { status: 200 });
  }

  let userId = "";
  let isNewUser = false;
  let generatedPassword = "";

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", buyerEmail)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    generatedPassword = generatePassword(12);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: buyerEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !createData?.user) {
      console.error("user creation failed:", createError);
      try {
        await transporter.sendMail({
          from: SENDER,
          to: ADMIN_EMAIL,
          subject: "[Gringlizce] Kullanıcı oluşturma hatası",
          text:
            `Shopier siparişi geldi ama kullanıcı oluşturulamadı.

Müşteri: ${buyerEmail}
Order: ${orderid}
Ürünler: ${matched.map((m) => m.name).join(", ")}
Hata: ${createError?.message || "bilinmeyen"}`,
        });
      } catch {}
      return new Response("success", { status: 200 });
    }

    userId = createData.user.id;
    isNewUser = true;
  }

  type InsertedProduct = { slug: string; name: string; product_type: string; ai_quota: number | null };
  const insertedProducts: InsertedProduct[] = [];
  const failedProducts: Array<{ slug: string; name: string; error: string }> = [];

  for (const product of matched) {
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("shopier_order_id", orderid)
      .eq("product_slug", product.slug)
      .maybeSingle();

    if (existing) {
      continue;
    }

    const { error: insertError } = await supabase.from("purchases").insert({
      user_id: userId,
      product_slug: product.slug,
      shopier_order_id: orderid,
      amount_paid: product.price,
      purchased_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("purchase insert failed:", insertError);
      failedProducts.push({ slug: product.slug, name: product.name, error: insertError.message });
    } else {
      insertedProducts.push({
        slug: product.slug,
        name: product.name,
        product_type: product.product_type,
        ai_quota: product.ai_quota,
      });
    }
  }

  if (failedProducts.length > 0) {
    try {
      await transporter.sendMail({
        from: SENDER,
        to: ADMIN_EMAIL,
        subject: "[Gringlizce] Satın alma kaydı hatası",
        text:
          `Kullanıcı oluştu/bulundu ama bazı purchases satırları eklenemedi.

Müşteri: ${buyerEmail}
Order: ${orderid}

Hata olan ürünler:
${failedProducts.map((f) => `  - ${f.name} (${f.slug}): ${f.error}`).join("\n")}`,
      });
    } catch {}
  }

  if (insertedProducts.length === 0) {
    return new Response("success", { status: 200 });
  }

  // ====== AI PACK QUOTA ARTIRIMI ======
  const aiPackInserted = insertedProducts.filter(
    (p) => p.product_type === "ai_pack" && p.ai_quota && p.ai_quota > 0,
  );
  const materialInserted = insertedProducts.filter((p) => p.product_type !== "ai_pack");
  const totalAiAdded = aiPackInserted.reduce((sum, p) => sum + (p.ai_quota || 0), 0);

  if (totalAiAdded > 0) {
    const { error: quotaError } = await supabase.rpc("add_ai_quota", {
      p_user_id: userId,
      p_amount: totalAiAdded,
    });

    if (quotaError) {
      console.error("ai_quota RPC failed:", quotaError);
      try {
        await transporter.sendMail({
          from: SENDER,
          to: ADMIN_EMAIL,
          subject: "[Gringlizce] AI quota güncellemesi başarısız",
          text:
            `AI pack satın alma kaydı eklendi ama ai_quota artırılamadı.

Müşteri: ${buyerEmail}
Order: ${orderid}
Eklenmesi gereken miktar: ${totalAiAdded}
Hata: ${quotaError.message}

Manuel düzeltme:
UPDATE public.ai_quota SET total_quota = total_quota + ${totalAiAdded} WHERE user_id = '${userId}';`,
        });
      } catch {}
    }
  }

  // ====== EMAIL HAZIRLIĞI ======
  const materialListHtml = materialInserted
    .map((p) => `<li><b>${esc(p.name)}</b></li>`)
    .join("");

  const materialSection = materialInserted.length > 0
    ? `
  <p>Aldığınız materyaller:</p>
  <ul style="margin:10px 0 20px 20px">${materialListHtml}</ul>`
    : "";

  const aiSection = aiPackInserted.length > 0
    ? `
  <div style="background:#fff8e7;padding:18px;border-radius:6px;margin:18px 0;border-left:3px solid #f5b800">
    <p style="margin:0 0 8px 0"><b>AI Sorgu Hakkı</b></p>
    <p style="margin:0">Hesabınıza <b>${totalAiAdded}</b> AI sorgu hakkı eklendi. Soru bankasında bir soruyu çözdükten sonra <b>"Gri'ye Sor"</b> butonuna basarak kullanabilirsiniz. Her soru için bir defa danışılabilir.</p>
  </div>`
    : "";

  let subject: string;
  if (materialInserted.length > 0 && aiPackInserted.length === 0) {
    subject = isNewUser
      ? "Gri English - Materyal erişim bilgileriniz"
      : (materialInserted.length === 1
          ? `Gri English - ${materialInserted[0].name} hesabınıza eklendi`
          : `Gri English - ${materialInserted.length} yeni materyal hesabınıza eklendi`);
  } else if (aiPackInserted.length > 0 && materialInserted.length === 0) {
    subject = isNewUser
      ? "Gri English - AI sorgu hakkı ve erişim bilgileri"
      : `Gri English - ${totalAiAdded} AI sorgu hakkı hesabınıza eklendi`;
  } else {
    subject = isNewUser
      ? "Gri English - Materyaller, AI hakkı ve erişim bilgileri"
      : `Gri English - Materyaller ve ${totalAiAdded} AI sorgu hakkı hesabınıza eklendi`;
  }

  let html: string;
  if (isNewUser) {
    html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#222;line-height:1.6;padding:20px">
  <h2 style="color:#1a5fb4;margin-bottom:10px">Hoş geldiniz</h2>
  <p>Merhaba ${esc(fullName)},</p>
  <p>Gri English'ten yaptığınız satın alma için erişim bilgileriniz aşağıdadır.</p>
  ${materialSection}
  ${aiSection}
  <div style="background:#f5f5f5;padding:20px;border-radius:6px;margin:20px 0">
    <p style="margin:6px 0"><b>Giriş adresi:</b><br><a href="https://gringlizce.com/giris.html">https://gringlizce.com/giris.html</a></p>
    <p style="margin:6px 0"><b>Kullanıcı adı:</b> ${esc(buyerEmail)}</p>
    <p style="margin:6px 0"><b>Geçici şifre:</b> <code style="background:#fff;padding:4px 10px;border-radius:3px;font-size:15px">${esc(generatedPassword)}</code></p>
  </div>
  <p>Giriş yaptıktan sonra <b>Panelim</b> sayfasında tüm materyalleriniz görünecektir.</p>
  <p>İlk girişten sonra şifrenizi değiştirmenizi öneririz.</p>
  <p>Sorularınız için <a href="mailto:atasal@gringlizce.com">atasal@gringlizce.com</a> adresinden bize ulaşabilirsiniz.</p>
  <p style="margin-top:30px;color:#666">Gri English</p>
</div>`;
  } else {
    const headerText = materialInserted.length > 0 && aiPackInserted.length > 0
      ? "Yeni materyaller ve AI hakkı hazır"
      : (materialInserted.length > 0 ? "Yeni materyalleriniz hazır" : "AI sorgu hakkı eklendi");
    html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#222;line-height:1.6;padding:20px">
  <h2 style="color:#1a5fb4;margin-bottom:10px">${headerText}</h2>
  <p>Merhaba ${esc(fullName)},</p>
  <p>Satın aldıklarınız hesabınıza eklendi:</p>
  ${materialSection}
  ${aiSection}
  <p style="margin:25px 0"><a href="https://gringlizce.com/panelim.html" style="background:#1a5fb4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">Panele git</a></p>
  <p>Mevcut şifreniz geçerlidir. Unuttuysanız giriş sayfasından "Şifremi unuttum" ile sıfırlayabilirsiniz.</p>
  <p style="margin-top:30px;color:#666">Gri English</p>
</div>`;
  }

  try {
    await transporter.sendMail({ from: SENDER, to: buyerEmail, subject, html });
  } catch (e) {
    console.error("buyer mail failed:", e);
  }

  const totalPrice = parseFloat(String(order.price || "0"));
  const productLines = insertedProducts
    .map((p) =>
      p.product_type === "ai_pack"
        ? `  - ${p.name} (${p.slug}) [AI pack: +${p.ai_quota} hak]`
        : `  - ${p.name} (${p.slug})`,
    )
    .join("\n");

  try {
    await transporter.sendMail({
      from: SENDER,
      to: ADMIN_EMAIL,
      subject: insertedProducts.length === 1
        ? `[Gringlizce] Satış: ${insertedProducts[0].name}`
        : `[Gringlizce] Sepet satışı: ${insertedProducts.length} ürün`,
      text:
        `Yeni Shopier siparişi başarıyla işlendi.

Ürünler:
${productLines}
${totalAiAdded > 0 ? `\nAI quota eklendi: +${totalAiAdded} hak\n` : ""}
Müşteri: ${fullName} <${buyerEmail}>
Toplam: ${totalPrice} TL
Order ID: ${orderid}
Test mi: ${istest ? "EVET" : "HAYIR"}
Yeni kullanıcı: ${isNewUser ? "EVET (şifre oluşturuldu)" : "HAYIR (mevcut hesaba eklendi)"}

Müşteriye otomatik mail gönderildi.`,
    });
  } catch (e) {
    console.error("admin mail failed:", e);
  }

  return new Response("success", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
});