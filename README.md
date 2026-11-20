# providerslaundry.com

Static site + one Netlify Function, deployed on Netlify.

```
index.html        page
styles.css        styling
main.js           nav, scroll reveal, hero video, pickup form (Netlify Forms)
widget.js         chat bubble (talks to /api/chat)
netlify/functions/chat.mjs   AI chat assistant (Claude)
assets/           logos, favicon, share image, hero ad video (mp4 + webm + poster)
```

## Netlify setup (once)

1. **Environment variable:** Site configuration → Environment variables → add `ANTHROPIC_API_KEY`.
   Without it the chat still works but only offers the WhatsApp hand-off.
2. **Forms:** Netlify registers `pickupRequest` (the website form), plus `chatOrder` and `chatLead`
   (orders and contacts captured by the chat assistant). Turn on email notifications under Forms → Form notifications.
3. Build settings: no build command, publish directory `.` (already set in `netlify.toml`).

## Editing

Prices, plans, coverage areas and contacts live in `index.html`. The chat assistant has its own copy of the
same facts in the `SYSTEM` prompt in `netlify/functions/chat.mjs`, so update both when prices change.

A commented-out testimonials section is ready in `index.html`: add real customer quotes and uncomment it.
