// Providers Laundry — website chat assistant
// POST /api/chat  { message, history: [{role:'user'|'bot', text}], intent: 'chat'|'order'|'lead', fields }
// ->              { reply, escalateWhatsApp?, fields?, done? }
//
// Needs the ANTHROPIC_API_KEY environment variable (Netlify > Site configuration > Environment variables).
// Completed orders and leads are posted to the Netlify forms "chatOrder" / "chatLead"
// (hidden forms in index.html), so they appear under Forms in the Netlify dashboard.

import Anthropic from "@anthropic-ai/sdk";

const WHATSAPP = "233202775247";
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are the website assistant for Providers Laundry, a laundry and dry-cleaning service in Cape Coast, Ghana (a Providers Group venture). Operations Manager: Justice.

Facts you may use (never invent others, never promise discounts, prices or times not listed here):
Services: Wash & Fold; Wash & Iron; Dry Cleaning (delicate & formal wear); Bulk & Linens (hotels, hostels, households). Stain treatment, eco-friendly biodegradable detergents, quality guaranteed.
Free pickup & delivery across Cape Coast: Cape Coast Central, Pedu, Abura, Kotokuraba, Siwdu, Adisadel, Nkanfoa, Efutu, Bakaano, University of Cape Coast, and surrounding communities.
Monthly plans (all include free pickup & delivery):
- Basic Plan: GHS 399/mo. 2 pickups a month, 8kg per bag. Wash & fold, eco-friendly detergents, 48hr turnaround. Great for students & individuals.
- Standard Plan (most preferred): GHS 699/mo. 4 pickups a month, 10kg per bag. Wash, fold & ironing, stain treatment, priority scheduling, 48hr turnaround.
- Premium Plan: GHS 1,299/mo. 8 pickups a month, 12kg per bag. Wash, fold & ironing, stain treatment, dry cleaning included (2 items), express 24hr turnaround, dedicated service line.
One-off orders and express orders are available; their prices are quoted by the team, so offer WhatsApp for a quote (set "escalate" true).
How it works: book a pickup (call, WhatsApp or online) -> we wash & care -> delivered fresh to your door.
Contact: WhatsApp / call 020 277 5247, email hello@providerslaundry.com, online order form https://forms.gle/fAQJPwPyu5YyQ45p8.

Style: warm, friendly, Ghanaian ("Akwaaba" is fine once). Keep replies short: 1-3 sentences or a short list. Plain text only, no markdown. Politely decline topics unrelated to laundry.

Order mode (intent "order"): collect name, phone, location (area/landmark), service (Wash & Fold / Wash & Iron / Dry Cleaning / Bulk & Linens), plan (Basic / Standard / Premium / One-time) and preferred pickup date; notes are optional. Ask for what is missing, one or two items at a time, and carry forward fields already known. Set "done" true once name, phone, location and service are known, then confirm the pickup request and say the team will call or WhatsApp to confirm the time.
Lead mode (intent "lead"): collect name and phone (notes optional). Set "done" true once both are known and thank them.
In chat mode, return the fields object with empty strings and done false.`;

const FIELD_NAMES = ["name", "phone", "location", "service", "plan", "date", "notes"];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "escalate", "done", "fields"],
  properties: {
    reply: { type: "string" },
    escalate: { type: "boolean" },
    done: { type: "boolean" },
    fields: {
      type: "object",
      additionalProperties: false,
      required: FIELD_NAMES,
      properties: Object.fromEntries(FIELD_NAMES.map((k) => [k, { type: "string" }])),
    },
  },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const waLink = (text) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi Providers Laundry, ${text}`.slice(0, 300))}`;

const clip = (s, n) => String(s ?? "").slice(0, n);

function buildMessages(history, message, intent, fields) {
  const out = [];
  for (const h of (Array.isArray(history) ? history : []).slice(-14)) {
    const role = h?.role === "user" ? "user" : "assistant";
    const text = clip(h?.text, 1500).trim();
    if (!text) continue;
    if (!out.length && role === "assistant") continue;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += "\n" + text;
    else out.push({ role, content: text });
  }
  const msg = clip(message, 1500).trim();
  const last = out[out.length - 1];
  if (!last || last.role !== "user") out.push({ role: "user", content: msg });
  else if (!last.content.endsWith(msg)) last.content += "\n" + msg;

  const mode = ["order", "lead"].includes(intent) ? intent : "chat";
  out[out.length - 1].content = `[intent: ${mode}; known fields: ${JSON.stringify(fields || {})}]\n${out[out.length - 1].content}`;
  return out;
}

async function saveToForm(formName, fields, transcript) {
  const site = process.env.URL;
  if (!site) return;
  const body = new URLSearchParams({ "form-name": formName, ...fields, transcript: transcript.slice(0, 4000) });
  try {
    await fetch(site + "/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  } catch (e) {
    console.error("form save failed", e);
  }
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { message, history, intent, fields } = payload || {};
  if (!message || typeof message !== "string") return json({ error: "message required" }, 400);

  if (!process.env.ANTHROPIC_API_KEY) {
    return json({
      reply: "Our assistant is offline right now. Message us on WhatsApp and we'll sort your laundry quickly.",
      escalateWhatsApp: waLink(message),
    });
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: buildMessages(history, message, intent, fields),
    });

    if (response.stop_reason === "refusal") {
      return json({ reply: "I can't help with that here, but our team can. Tap below to chat on WhatsApp.", escalateWhatsApp: waLink(message) });
    }

    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const data = JSON.parse(text);
    const result = { reply: data.reply };
    if (data.escalate) result.escalateWhatsApp = waLink(message);

    if (intent === "order" || intent === "lead") {
      const f = data.fields || {};
      result.fields = f;
      const complete = intent === "order" ? f.name && f.phone && f.location && f.service : f.name && f.phone;
      result.done = Boolean(data.done && complete);
      if (result.done) {
        const transcript = [...(history || []), { role: "bot", text: data.reply }]
          .map((h) => `${h.role === "user" ? "Customer" : "Assistant"}: ${h.text}`)
          .join("\n");
        await saveToForm(intent === "order" ? "chatOrder" : "chatLead", f, transcript);
      }
    }
    return json(result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.error("rate limited", err.message);
    else if (err instanceof Anthropic.APIError) console.error("api error", err.status, err.message);
    else console.error("chat error", err);
    return json({
      reply: "Sorry, I'm having trouble right now. Please WhatsApp us and we'll reply quickly.",
      escalateWhatsApp: waLink(message),
    });
  }
};

export const config = { path: "/api/chat" };
