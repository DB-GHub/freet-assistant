# Freet Shoe Choice Assistant — Handover Document
*Last updated: 23 April 2026*

---

## Project Overview

A conversational AI shoe recommendation widget for [Freet Barefoot Footwear](https://freetbarefoot.com), embedded on their website. It guides customers through a structured discovery flow to recommend the best Freet shoe for their needs.

---

## Live URLs

| Resource | URL |
|---|---|
| Widget (live) | https://freet-assistant.vercel.app/widget.html |
| API base | https://freet-assistant.vercel.app/api/ |
| GitHub repo | https://github.com/DB-GHub/freet-assistant |
| Vercel project | freet-assistant (project ID: prj_BQOFHyAND3HWpuddptSqlX8oNtOX) |
| CustomGPT project | Project ID: 95025 |

---

## Credentials & Keys

| Service | Key / Token |
|---|---|
| GitHub PAT | *stored in Vercel env / ask Dan* |
| GitHub user | `DB-GHub` |
| Vercel token | *stored in Vercel env / ask Dan* |
| CustomGPT API key | *stored in Vercel env as CUSTOMGPT_API_KEY / ask Dan* |
| Git author | Dan / dan@noordinarypigeon.com |

---

## Repository Structure

```
freet-assistant/
├── api/
│   ├── conversation.js   — Creates a new CustomGPT session
│   ├── message.js        — Sends a message; prepends system prompt to every user message
│   └── images.js         — Returns product image URLs by model name
├── public/
│   ├── widget.html       — The embeddable chat widget UI
│   └── widget.js         — Frontend JS for the widget
└── vercel.json           — Vercel routing config
```

---

## Architecture

1. **Frontend** (`widget.html` / `widget.js`) — A chat UI embedded on the Freet website. On load, it calls `/api/conversation` to create a session. Each user message is sent to `/api/message`.

2. **Backend** (`api/message.js`) — A Vercel serverless function. It prepends the full system prompt to every user message before forwarding to the CustomGPT API. This ensures consistent behaviour regardless of CustomGPT dashboard settings.

3. **CustomGPT** — Hosts the Freet knowledge base (product pages, FAQs, etc.) and runs the GPT-4.1 model. The system prompt is injected via the `prompt` field on every API call.

4. **Images** (`api/images.js`) — Maps model names to product image URLs. The widget renders `[IMAGE:Model Name]` tags in AI responses as actual images.

### Important API note
The CustomGPT messages API **requires multipart/form-data**, not JSON. The `prompt` field has a hard **8,000 character limit** (this is a CustomGPT API-level validation, not a context window limit). The current system prompt is ~4,763 chars, leaving ~3,200 chars of headroom for user messages.

---

## System Prompt Logic (in `api/message.js`)

The system prompt instructs the AI to:

1. **Run a category-based discovery flow** — identify which of four categories the customer needs (Everyday/Smart Casual, Hiking & Walking, Fitness & Sport, Running), then ask 2–3 targeted questions before recommending.

2. **Always recommend exactly two models** — one primary, one alternative.

3. **Use the product directory** for colour accuracy — never guess colours.

4. **Skip discovery only** if the user's first message contains all three of: a clear activity, a material/style preference, AND a colour or product name. General statements ("smart casual shoes") always trigger the discovery flow.

5. **Answer direct product questions immediately** without going through the discovery flow.

6. **Use a strict recommendation format** — REQUIREMENTS SUMMARY, then two products with [IMAGE:Model Name] tags, ratings, and shop links.

---

## Product Directory (current as of 23 April 2026)

Scraped directly from freetbarefoot.com UK product pages. Kids category intentionally excluded.

**EVERYDAY / SMART CASUAL / OFFICE / TRAVEL**
| Product | Colours |
|---|---|
| Vibe 2 | White, Black |
| Keld 3 | Olive |
| Danum | Olive |
| Salcombe | Brown, Black |
| Lundy | Black, Khaki, Purple |
| Tanga 3 | Navy, Pink |
| Zennor 2 | Black, Blue, Khaki |
| Durham | Brown *(casual boot — great for smart casual/office)* |
| York 2 | Black |
| Richmond 2 | Brown |
| Flex 2 | Navy, Black, Grey/Red |
| Citee 2 | Black |
| Skeeby | Navy Teal |
| Esk 2 | Brown |
| Arken 2 | Black |

**HIKING & WALKING**
| Product | Colours |
|---|---|
| Chamois | Brown |
| Mudee L2 | Brown |
| Mudee 2 | Black, Brown |
| Selva | Black/Brown |
| Feldom 3 | Olive Green |
| Calver 2 | Black/Orange |
| Bootee 2 | Black, Brown |
| Howgill | Black/Grey, Khaki Green |
| Connect 4 | Black/Red |

**FITNESS & SPORT**
| Product | Colours |
|---|---|
| Milo | Black |
| Pace | Charcoal, Black |
| Tanga 2 | Grey, Black, Navy |
| Mooch | Brown, Blue |

**RUNNING**
Flex 2, Feldom 3, Calver 2, Pace, Tanga 2 (see colours above)

---

## Key Decisions Made

- **Kids category removed** from the discovery flow (April 2026) — excluded by client request.
- **System prompt is injected per-message** (not stored in CustomGPT dashboard) — gives full version control via GitHub.
- **Colour accuracy rule added** — the AI must only recommend shoes in colours that actually exist, using the product directory.
- **Durham** explicitly flagged as suitable for Everyday/Smart Casual, not just Hiking.
- **Newest version rule** — the AI always recommends the latest numbered version of a model (e.g. Richmond 2 over Richmond).
- **Discovery flow skip threshold** — tightened so general statements ("smart casual shoes") always trigger questions; only very specific messages (activity + material + colour) skip ahead.

---

## How to Deploy Changes

```bash
# Clone the repo
git clone https://github.com/DB-GHub/freet-assistant.git
cd freet-assistant

# Make changes to api/message.js (system prompt) or other files

# Commit and push — Vercel auto-deploys on push to main
GIT_AUTHOR_NAME="Dan" GIT_AUTHOR_EMAIL="dan@noordinarypigeon.com" \
GIT_COMMITTER_NAME="Dan" GIT_COMMITTER_EMAIL="dan@noordinarypigeon.com" \
git add . && git commit -m "Your message" && \
git push origin main
```

Vercel deploys automatically within ~60 seconds of a push to `main`.

---

## Testing the API Directly

```bash
# Create a session
curl -s -X POST "https://freet-assistant.vercel.app/api/conversation" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# Send a message (use the session_id from above)
curl -s -X POST "https://freet-assistant.vercel.app/api/message" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"YOUR_SESSION_ID","prompt":"Hello"}'
```

---

## Recent Git History

| Commit | Description |
|---|---|
| `9755a71` | Fix: compress system prompt to 4763 chars (was 8088, over CustomGPT 8000 limit) |
| `16e8e7a` | Fix: send multipart/form-data to CustomGPT API (was sending JSON which caused timeout) |
| `167bae3` | Fix: tighten skip-to-recommendation rule |
| `6148013` | Update: add product colour directory, remove Kids category |
| `a655f8b` | Improve: category-based discovery flow |
| `7a1a334` | Improve: always recommend newest model version |
