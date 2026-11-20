/* Providers Laundry — Chat Widget
 * Drop-in script. Usage:
 *   <script src="https://YOUR-SITE.netlify.app/widget.js" data-chat-endpoint="/api/chat"></script>
 * Or set window.PROVIDERS_CHAT_ENDPOINT before load.
 */
(function () {
  const ENDPOINT =
    document.currentScript?.dataset.chatEndpoint ||
    window.PROVIDERS_CHAT_ENDPOINT ||
    "/api/chat";

  // Inline line-icons (Lucide-style), no emoji
  const SVG = {
    chat: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    shirt: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a8 8 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.39l1.3 4.27A4 4 0 0 0 6.52 13c.5.74 1 1.5 1.51 2.2l.17.25a8 8 0 0 0 8.6 0l.17-.25c.51-.7 1.01-1.46 1.51-2.2a4 4 0 0 0 2.94-3.31l1.3-4.27a2 2 0 0 0-1.34-2.39Z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-4l-3-4h-4v9"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    map: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M3 12h18"/><path d="M3 6a2 2 0 0 1 2-2h2"/><path d="M17 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-4.5A8 8 0 1 1 8 19.5L3 21Z"/><path d="M8.5 9.5c.5 2 2 3.5 4 4 .8-.3 1.2-.1 1.4.2.2.4-.2 1.3-.4 1.5-.2.2-1 1-2.5.4-1.6-.7-3-2.1-3.7-3.7-.6-1.5.2-2.3.4-2.5.2-.2 1.1-.6 1.5-.4.3.2.5.6.3 1.4Z"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  const BRAND = "Providers Laundry";
  const COLORS = { primary: "#0e9fae", secondary: "#0b7f8c", dark: "#0b3f47" };

  // --- Build DOM ---
  const root = document.createElement("div");
  root.id = "pl-chat-root";
  root.innerHTML = `
    <style>
      #pl-chat-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #pl-launcher { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary}); color: #fff; border: none; cursor: pointer;
        box-shadow: 0 6px 20px rgba(8,175,241,.4); display: flex; align-items: center; justify-content: center; z-index: 999998; transition: transform .2s, box-shadow .2s; }
      #pl-launcher:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 10px 28px rgba(8,175,241,.5); }
      #pl-panel { position: fixed; bottom: 92px; right: 20px; width: 372px; max-width: calc(100vw - 40px); height: 540px; max-height: calc(100vh - 120px);
        background: #fff; border-radius: 18px; box-shadow: 0 16px 50px rgba(0,0,0,.2); z-index: 999999; display: none; flex-direction: column; overflow: hidden; }
      #pl-header { background: linear-gradient(135deg, ${COLORS.dark}, #0f5560); color: #fff; padding: 16px 18px; display: flex; align-items: center; gap: 12px; }
      #pl-header .avatar { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; color: #7dd3fc; flex: none; }
      #pl-header .title { font-weight: 700; font-size: 14.5px; line-height: 1.2; }
      #pl-header .sub { font-size: 11px; opacity: .8; display: flex; align-items: center; gap: 5px; }
      #pl-header .sub .dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,.25); }
      #pl-header .close { margin-left: auto; background: transparent; border: none; color: #fff; cursor: pointer; display: flex; }
      #pl-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f5f8fb; display: flex; flex-direction: column; gap: 10px; }
      .pl-msg { max-width: 86%; padding: 10px 14px; border-radius: 16px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
      .pl-msg.bot { background: #fff; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #eaf1f7; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
      .pl-msg.user { background: ${COLORS.primary}; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
      .pl-quick { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 10px; background: #f5f8fb; }
      .pl-quick button { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #cfe9ea; color: ${COLORS.secondary}; border-radius: 16px; padding: 7px 12px; font-size: 12px; cursor: pointer; transition: background .2s; }
      .pl-quick button:hover { background: #eef9ff; }
      .pl-quick button svg { width: 15px; height: 15px; }
      #pl-inputbar { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #eef0f3; background: #fff; }
      #pl-input { flex: 1; border: 1.5px solid #dde3ea; border-radius: 22px; padding: 10px 16px; font-size: 13.5px; outline: none; }
      #pl-input:focus { border-color: ${COLORS.primary}; }
      #pl-send { background: ${COLORS.primary}; color: #fff; border: none; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex: none; }
      #pl-send:disabled { opacity: .6; }
      .pl-wa { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; background: #25D366; color: #fff !important; text-decoration: none; padding: 7px 13px; border-radius: 14px; font-size: 12.5px; font-weight: 600; }
      .pl-typing { font-style: italic; opacity: .6; font-size: 12px; }
    </style>
    <button id="pl-launcher" aria-label="Chat with Providers Laundry">${SVG.chat}</button>
    <div id="pl-panel" role="dialog" aria-label="Chat">
      <div id="pl-header">
        <div class="avatar">${SVG.shirt}</div>
        <div>
          <div class="title">${BRAND}</div>
          <div class="sub"><span class="dot"></span> Online · replies instantly</div>
        </div>
        <button class="close" id="pl-close" aria-label="Close">${SVG.close}</button>
      </div>
      <div id="pl-messages"></div>
      <div class="pl-quick" id="pl-quick"></div>
      <div id="pl-inputbar">
        <input id="pl-input" type="text" placeholder="Ask about services, pricing…" autocomplete="off" />
        <button id="pl-send" aria-label="Send">${SVG.send}</button>
      </div>
    </div>`;
  document.body.appendChild(root);

  const launcher = root.querySelector("#pl-launcher");
  const panel = root.querySelector("#pl-panel");
  const messages = root.querySelector("#pl-messages");
  const input = root.querySelector("#pl-input");
  const send = root.querySelector("#pl-send");
  const quick = root.querySelector("#pl-quick");
  const closeBtn = root.querySelector("#pl-close");

  let mode = "chat"; // chat | order | lead
  let orderFields = {};
  let history = []; // {role:'user'|'bot', text}

  const QUICK = [
    { label: "Place an order", icon: SVG.clipboard, act: () => startOrder() },
    { label: "Pricing & plans", icon: SVG.map, act: () => sendMsg("What are your plans and prices?") },
    { label: "Coverage areas", icon: SVG.truck, act: () => sendMsg("Which areas do you cover?") },
    { label: "Leave my details", icon: SVG.clipboard, act: () => startLead() },
  ];

  function addMsg(text, who, extraHtml) {
    const div = document.createElement("div");
    div.className = "pl-msg " + who;
    div.textContent = text;
    if (extraHtml) div.innerHTML += extraHtml;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }
  function addTyping() {
    return addMsg("typing…", "bot", "");
  }
  function renderQuick() {
    quick.innerHTML = "";
    QUICK.forEach((q) => {
      const b = document.createElement("button");
      b.innerHTML = q.icon + "<span>" + q.label + "</span>";
      b.onclick = q.act;
      quick.appendChild(b);
    });
  }
  function setQuickDisabled(disabled) {
    quick.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
  }

  async function callApi(message) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, intent: mode, fields: orderFields }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function sendMsg(textOverride) {
    const text = (textOverride || input.value || "").trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    history.push({ role: "user", text });
    const typing = addTyping();
    send.disabled = true;
    try {
      const data = await callApi(text);
      typing.remove();
      let extra = "";
      if (data.escalateWhatsApp) {
        extra = `<br><a class="pl-wa" href="${data.escalateWhatsApp}" target="_blank" rel="noopener">${SVG.wa} Continue on WhatsApp</a>`;
      }
      addMsg(data.reply || "…", "bot", extra);
      history.push({ role: "bot", text: data.reply || "" });

      // Handle order/lead multi-step
      if ((mode === "order" || mode === "lead") && data.fields) {
        orderFields = data.fields;
      }
      if (mode === "order" && data.done) {
        addMsg("Is there anything else I can help with?", "bot");
        resetMode();
      } else if (mode === "lead" && data.done) {
        resetMode();
      }
    } catch (e) {
      typing.remove();
      addMsg("Sorry, connection issue. Please try again or WhatsApp +233 20 277 5247.", "bot");
    } finally {
      send.disabled = false;
    }
  }

  function startOrder() {
    mode = "order";
    orderFields = {};
    addMsg("Let's get your laundry sorted! Tell me your name, phone, location, service (Wash & Fold / Wash & Iron / Dry Cleaning / Bulk), and plan (Basic / Standard / Premium / One-Time). Or just answer my questions.", "bot");
    input.focus();
  }
  function startLead() {
    mode = "lead";
    orderFields = {};
    addMsg("Sure! Share your name and phone number and we'll reach out.", "bot");
    input.focus();
  }
  function resetMode() {
    mode = "chat";
    orderFields = {};
    renderQuick();
  }

  // Events
  launcher.onclick = () => {
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    if (panel.style.display === "flex") {
      input.focus();
      if (!messages.childElementCount) {
        addMsg(`Hi! I'm the Providers Laundry assistant. Ask me anything, place an order, or leave your details.`, "bot");
        renderQuick();
      }
    }
  };
  closeBtn.onclick = () => (panel.style.display = "none");
  send.onclick = () => sendMsg();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMsg(); });

  renderQuick();
})();
