const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const express = require("express");
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

function loadEnvFile() {
  const explicit = typeof process.env.DOTENV_CONFIG_PATH === "string" ? process.env.DOTENV_CONFIG_PATH.trim() : "";
  const candidates = explicit
    ? [explicit]
    : [process.env.NODE_ENV === "production" ? ".env.server" : ".env.local", ".env"];

  for (const rel of candidates) {
    const full = path.join(__dirname, rel);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full });
      break;
    }
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_EVENT = process.env.DEFAULT_EVENT || "yun_jiaozi_dongzhi";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY;

const PASSCODE_SECRET = process.env.PASSCODE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

let supabaseClient = null;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return supabaseClient;
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

const shareImages = new Map();
const SHARE_IMAGE_TTL_MS = 30 * 60 * 1000;
const SHARE_IMAGE_MAX_ITEMS = 80;

function cleanupShareImages() {
  const now = Date.now();
  for (const [id, item] of shareImages.entries()) {
    if (!item || now - item.createdAt > SHARE_IMAGE_TTL_MS) {
      shareImages.delete(id);
    }
  }
  if (shareImages.size <= SHARE_IMAGE_MAX_ITEMS) return;
  const entries = Array.from(shareImages.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
  for (let i = 0; i < entries.length - SHARE_IMAGE_MAX_ITEMS; i++) {
    shareImages.delete(entries[i][0]);
  }
}

setInterval(cleanupShareImages, 60 * 1000).unref?.();

function nowIso() {
  return new Date().toISOString();
}

function hashPasscode(passcode) {
  if (!PASSCODE_SECRET) throw new Error("Passcode secret is not configured. Set PASSCODE_SECRET.");
  return crypto.createHmac("sha256", PASSCODE_SECRET).update(passcode).digest("hex");
}

async function getParticipantCount(event) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const { data, error } = await supabase.from("participants").select("count").eq("event", event).maybeSingle();
  if (error) throw error;
  const n = data?.count;
  return typeof n === "number" ? n : Number(n) || 0;
}

async function incrementParticipant(event) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const { data, error } = await supabase.rpc("increment_participant", { p_event: event });
  if (error) {
    const message = typeof error.message === "string" ? error.message : "";
    if (message.includes("increment_participant") || message.includes("function")) {
      throw new Error(buildSupabaseSchemaError(error));
    }
    throw error;
  }
  return typeof data === "number" ? data : Number(data) || 0;
}

async function getBlessingCount() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const { count, error } = await supabase.from("blessings").select("*", { count: "exact", head: true }).eq("is_public", true);
  if (error) {
    const msg = typeof error.message === "string" ? error.message : "";
    if (msg.includes("is_public") && msg.includes("column")) {
      const { count: legacyCount, error: legacyError } = await supabase.from("blessings").select("*", { count: "exact", head: true });
      if (legacyError) throw legacyError;
      return typeof legacyCount === "number" ? legacyCount : 0;
    }
    throw error;
  }
  return typeof count === "number" ? count : 0;
}

async function verifySupabaseSchema() {
  const supabase = getSupabaseClient();
  if (!supabase) return { configured: false };

  const { error: pErr } = await supabase.from("participants").select("event").limit(1);
  if (pErr) throw new Error(buildSupabaseSchemaError(pErr));

  const { error: bErr } = await supabase.from("blessings").select("id").limit(1);
  if (bErr) throw new Error(buildSupabaseSchemaError(bErr));

  return { configured: true };
}

function buildSupabaseSchemaError(err) {
  const original = err && typeof err.message === "string" ? err.message : String(err || "");
  const sql = [
    "create table if not exists public.participants (",
    "  event text primary key,",
    "  count bigint not null default 0,",
    "  updated_at timestamptz not null default now()",
    ");",
    "",
    "create or replace function public.increment_participant(p_event text)",
    "returns bigint",
    "language plpgsql",
    "as $$",
    "declare new_count bigint;",
    "begin",
    "  insert into public.participants(event, count, updated_at)",
    "  values (p_event, 1, now())",
    "  on conflict (event) do update",
    "    set count = public.participants.count + 1,",
    "        updated_at = now()",
    "  returning count into new_count;",
    "  return new_count;",
    "end;",
    "$$;",
    "",
    "create table if not exists public.blessings (",
    "  id bigserial primary key,",
    "  content text not null,",
    "  is_public boolean not null default true,",
    "  passcode_hash text,",
    "  passcode_hint text,",
    "  created_at timestamptz not null default now()",
    ");",
    "",
    "create unique index if not exists blessings_passcode_hash_uniq",
    "  on public.blessings(passcode_hash)",
    "  where passcode_hash is not null;",
  ].join("\n");

  return `Supabase schema missing or inaccessible.\nRun this SQL in Supabase SQL Editor:\n\n${sql}\n\nOriginal error: ${original}`;
}

function handleApiError(res, err) {
  const msg = err && typeof err.message === "string" ? err.message : "";
  if (msg.startsWith("Supabase is not configured.")) {
    res.status(500).json({ error: "supabase_not_configured" });
    return;
  }
  if (msg.startsWith("Passcode secret is not configured.")) {
    res.status(500).json({ error: "passcode_not_configured" });
    return;
  }
  if (msg.startsWith("Supabase schema missing or inaccessible.")) {
    res.status(500).json({ error: "supabase_schema_error" });
    return;
  }
  res.status(500).json({ error: "internal_error" });
}

app.get("/favicon.ico", (req, res) => {
  res.type("image/x-icon").sendFile(path.join(__dirname, "favicon.ico"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/cloud", (req, res, next) => {
  if (req.originalUrl === "/cloud") {
    res.redirect(301, "/cloud/");
    return;
  }
  next();
});

app.get("/dumpling", (req, res, next) => {
  if (req.originalUrl === "/dumpling") {
    res.redirect(301, "/dumpling/");
    return;
  }
  next();
});

app.get("/couplet", (req, res, next) => {
  if (req.originalUrl === "/couplet") {
    res.redirect(301, "/couplet/");
    return;
  }
  next();
});

app.use("/cloud", express.static(path.join(__dirname, "public", "cloud")));
app.use("/dumpling", express.static(path.join(__dirname, "public", "dumpling")));
app.use("/couplet", express.static(path.join(__dirname, "public", "couplet")));
app.use(express.static(path.join(__dirname, "public")));

// --- Couplet AI Logic ---
const FALLBACK_COUPLETS = [
  { keywords: ["default", "马", "新年"], upper: "神马当先迎新岁", lower: "龙腾虎跃展宏图", cross: "马到成功" },
  { keywords: ["财", "富", "钱"], upper: "财源滚滚随春到", lower: "喜气洋洋伴福来", cross: "招财进宝" },
  { keywords: ["学", "考", "智"], upper: "书山有路勤为径", lower: "学海无涯苦作舟", cross: "金榜题名" },
  { keywords: ["家", "团圆", "亲"], upper: "一家和睦一家福", lower: "四季平安四季春", cross: "阖家欢乐" },
  { keywords: ["爱", "情", "婚"], upper: "百年好合双心结", lower: "五世其昌百事兴", cross: "永结同心" },
  { keywords: ["事业", "职", "工"], upper: "大展宏图兴伟业", lower: "与时俱进创辉煌", cross: "前程似锦" },
  { keywords: ["健康", "体", "寿"], upper: "福如东海长流水", lower: "寿比南山不老松", cross: "健康长寿" },
  { keywords: ["甜蜜", "甜"], upper: "生活甜蜜如蜜糖", lower: "日子红火似火炉", cross: "幸福美满" },
  { keywords: ["升职", "高升"], upper: "步步高升鹏程远", lower: "官运亨通事业兴", cross: "平步青云" },
  { keywords: ["腾飞"], upper: "骏马奔腾开胜景", lower: "春风浩荡展鸿图", cross: "大展宏图" },
];

async function generateCoupletAI(keyword) {
  // 1. Easter Egg
  if (keyword.toUpperCase() === "TRAE") {
    return { upper: "代码千行马蹄急", lower: "创意无限春风来", cross: "码力全开" };
  }

  // 2. Try Real API
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  const apiBase = process.env.AI_API_BASE || "https://api.openai.com/v1";
  
  if (apiKey) {
    try {
      const prompt = `请为我创作一副关于"${keyword}"的马年春联。要求：
1. 包含上联、下联、横批。
2. 字数：上联下联各7个字，横批4个字。
3. 风格：喜庆、吉祥、文雅。
4. 必须以JSON格式返回，格式为：{"upper": "上联内容", "lower": "下联内容", "cross": "横批内容"}。
5. 不要包含任何其他文字或Markdown格式。`;

      const response = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL_NAME || "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "你是一个精通中国传统文化的AI助手，擅长写春联。" },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } else {
        console.error("AI API Error:", await response.text());
      }
    } catch (e) {
      console.error("AI Generation Failed:", e);
    }
  }

  // 3. Fallback Logic
  const match = FALLBACK_COUPLETS.find(c => c.keywords.some(k => keyword.includes(k)));
  if (match) return { upper: match.upper, lower: match.lower, cross: match.cross };
  
  const random = FALLBACK_COUPLETS[Math.floor(Math.random() * FALLBACK_COUPLETS.length)];
  return { upper: random.upper, lower: random.lower, cross: random.cross };
}

app.post("/api/couplet/generate", async (req, res) => {
  try {
    const keyword = typeof req.body?.keyword === "string" ? req.body.keyword.trim() : "";
    if (!keyword) {
      res.status(400).json({ error: "keyword_required" });
      return;
    }
    const couplet = await generateCoupletAI(keyword);
    res.json(couplet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "generation_failed" });
  }
});
// -----------------------

app.get("/api/participants", async (req, res) => {
  try {
    const event = typeof req.query.event === "string" && req.query.event ? req.query.event : DEFAULT_EVENT;
    const count = await getParticipantCount(event);
    res.json({ event, count });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post("/api/participants", async (req, res) => {
  try {
    const event = typeof req.body?.event === "string" && req.body.event ? req.body.event : DEFAULT_EVENT;
    const count = await incrementParticipant(event);
    res.json({ event, count });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get("/api/blessings/count", async (req, res) => {
  try {
    const count = await getBlessingCount();
    res.json({ count });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get("/api/blessings", async (req, res) => {
  try {
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    const query = supabase.from("blessings").select("id, content, created_at").eq("is_public", true).order("created_at", { ascending: false }).limit(limit);
    const { data, error } = await query;

    if (error) {
      const msg = typeof error.message === "string" ? error.message : "";
      if (msg.includes("is_public") && msg.includes("column")) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("blessings")
          .select("id, content, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (legacyError) throw legacyError;
        res.json(legacyData || []);
        return;
      }
      throw error;
    }
    res.json(data || []);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post("/api/blessings", async (req, res) => {
  try {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 200) {
      res.status(400).json({ error: "invalid_content" });
      return;
    }

    const delivery = req.body?.delivery === "secret" ? "secret" : "public";
    const passcode = typeof req.body?.passcode === "string" ? req.body.passcode.trim() : "";
    const passcodeHint = typeof req.body?.passcodeHint === "string" ? req.body.passcodeHint.trim() : "";

    if (delivery === "secret") {
      if (!passcode || passcode.length > 64) {
        res.status(400).json({ error: "invalid_passcode" });
        return;
      }
      if (passcodeHint.length > 80) {
        res.status(400).json({ error: "invalid_passcode_hint" });
        return;
      }
    }

    const createdAt = nowIso();
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    const insertRow =
      delivery === "secret"
        ? {
            content,
            created_at: createdAt,
            is_public: false,
            passcode_hash: hashPasscode(passcode),
            passcode_hint: passcodeHint ? passcodeHint : null,
          }
        : { content, created_at: createdAt, is_public: true, passcode_hash: null, passcode_hint: null };

    const { data: blessing, error } = await supabase.from("blessings").insert(insertRow).select("id, content, created_at, is_public, passcode_hint").single();

    if (error) {
      const code = typeof error.code === "string" ? error.code : "";
      if (code === "23505") {
        res.status(409).json({ error: "passcode_taken" });
        return;
      }
      const msg = typeof error.message === "string" ? error.message : "";
      if (delivery === "public" && msg.includes("is_public") && msg.includes("column")) {
        const { data: legacyBlessing, error: legacyError } = await supabase
          .from("blessings")
          .insert({ content, created_at: createdAt })
          .select("id, content, created_at")
          .single();
        if (legacyError) throw legacyError;
        const publicCount = await getBlessingCount();
        res.json({ blessing: legacyBlessing, publicCount, delivery: "public" });
        return;
      }
      throw error;
    }

    const publicCount = await getBlessingCount();
    res.json({ blessing, publicCount, delivery });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post("/api/blessings/redeem", async (req, res) => {
  try {
    const passcode = typeof req.body?.passcode === "string" ? req.body.passcode.trim() : "";
    if (!passcode || passcode.length > 64) {
      res.status(400).json({ error: "invalid_passcode" });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

    const { data, error } = await supabase
      .from("blessings")
      .select("id, content, created_at, passcode_hint")
      .eq("passcode_hash", hashPasscode(passcode))
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    res.json({ blessing: data });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get("/api/share-qr", async (req, res) => {
  try {
    const data = typeof req.query.data === "string" ? req.query.data : "";
    if (!data || data.length > 2048) {
      res.status(400).json({ error: "bad_request" });
      return;
    }
    const buf = await QRCode.toBuffer(data, {
      type: "png",
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#3b2f2a", light: "#ffffff" },
    });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.end(buf);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post(
  "/api/share-image",
  express.raw({ type: ["image/png", "image/webp", "application/octet-stream"], limit: "3mb" }),
  (req, res) => {
    try {
      const buf = req.body;
      if (!Buffer.isBuffer(buf) || buf.length < 20) {
        res.status(400).json({ error: "bad_request" });
        return;
      }
      const ct = typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "application/octet-stream";
      const type = ct === "image/webp" ? "image/webp" : "image/png";
      const id = crypto.randomBytes(16).toString("hex");
      shareImages.set(id, { buf, type, createdAt: Date.now() });
      cleanupShareImages();
      res.setHeader("Cache-Control", "no-store");
      res.json({ url: `/share-image/${id}` });
    } catch (err) {
      handleApiError(res, err);
    }
  }
);

app.get("/share-image/:id", (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  const item = id ? shareImages.get(id) : null;
  if (!item) {
    res.status(404).send("not_found");
    return;
  }
  res.setHeader("Content-Type", item.type);
  res.setHeader("Cache-Control", "no-store");
  const ext = item.type === "image/webp" ? "webp" : "png";
  res.setHeader("Content-Disposition", `inline; filename="dumpling.${ext}"`);
  res.end(item.buf);
});

app.get("/health", (req, res) => {
  res.json({ ok: true, supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY) });
});

function listen(port) {
  const server = app.listen(port, () => {
    console.log(`winterSolstice listening on http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      const next = port + 1;
      if (next <= port + 20) {
        listen(next);
        return;
      }
    }
    throw err;
  });
}

listen(PORT);
