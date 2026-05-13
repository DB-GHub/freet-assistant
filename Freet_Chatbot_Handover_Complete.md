# Freet Virtual Shopping Assistant — Complete Project Handover

**Last updated:** 23 April 2026
**Prepared by:** Dan Burman, No Ordinary Pigeon
**Client:** Freet Barefoot Footwear (Andrew Jackson & Daisy Jackson)

This document is a fully self-contained record of the Freet AI Shopping Assistant build. It is intended to allow any competent developer or AI assistant to pick up, maintain, or extend the project from scratch with no prior knowledge.

---

## 1. What Was Built

A conversational AI shoe recommendation widget for [Freet Barefoot](https://freetbarefoot.com), embedded on their UK Shopify website. It acts as a 24/7 digital sales assistant — asking customers a short series of questions about their intended use, terrain, material preferences, and colour, then recommending exactly two Freet products with images, customer review highlights, and direct purchase links.

The assistant was built to solve a specific problem: Freet's product range is large and nuanced (30+ models across Everyday, Hiking, Fitness, and Running categories), and customers — particularly those new to barefoot footwear — frequently struggle to identify the right shoe without guidance.

---

## 2. Live URLs & Key Identifiers

| Resource | Value |
|---|---|
| Live widget | https://freet-assistant.vercel.app/widget.html |
| API base | https://freet-assistant.vercel.app/api/ |
| GitHub repository | https://github.com/DB-GHub/freet-assistant |
| Vercel project ID | `prj_BQOFHyAND3HWpuddptSqlX8oNtOX` |
| CustomGPT project ID | `95025` |
| Stable rollback tag | `v1.0-working-23apr` |
| Git author | Dan / dan@noordinarypigeon.com |
| GitHub user | `DB-GHub` |

All API credentials (CustomGPT API key, Vercel token, GitHub PAT) are stored as environment variables in the Vercel project dashboard. They are **not** stored in the repository. Contact Dan for access.

---

## 3. Architecture

The solution has three layers:

**Layer 1 — Frontend (Vercel static hosting)**
`public/widget.html` and `public/widget.js` provide the chat UI. On page load, the widget calls `/api/conversation` to create a new CustomGPT session. Each user message is sent to `/api/message`. The widget renders `[IMAGE:Model Name]` tags in AI responses as actual product images (via `/api/images`).

**Layer 2 — Backend Proxy (Vercel Serverless Functions)**
Three Node.js API routes handle all server-side logic:
- `api/conversation.js` — Creates a new CustomGPT conversation session and returns a `session_id`.
- `api/message.js` — The core function. Prepends the full System Prompt to every user message, then forwards the combined prompt to CustomGPT via `multipart/form-data`. This is where all the AI behaviour is controlled.
- `api/images.js` — Maps model names to product image URLs for rendering in the widget.

The proxy layer exists for two reasons: (1) to keep the CustomGPT API key secure server-side, and (2) to inject the System Prompt on every message, giving full version control via GitHub rather than relying on the CustomGPT dashboard.

**Layer 3 — AI Engine (CustomGPT.ai, Project ID 95025)**
CustomGPT hosts the Freet knowledge base (indexed from the Freet UK website, product pages, and review summaries) and runs the underlying GPT-4.1 model. The System Prompt is injected via the `prompt` field on every API call — CustomGPT's own "persona" settings are intentionally left minimal.

---

## 4. Repository Structure

```
freet-assistant/
├── api/
│   ├── conversation.js   — Creates a new CustomGPT session
│   ├── message.js        — Sends a message; prepends system prompt
│   └── images.js         — Returns product image URLs by model name
├── public/
│   ├── widget.html       — The embeddable chat widget UI
│   └── widget.js         — Frontend JS for the widget
└── vercel.json           — Vercel routing config
```

---

## 5. The System Prompt (Full Text)

The System Prompt lives in `api/message.js` as the constant `SYSTEM_INSTRUCTIONS`. It is prepended to every user message. The current version is approximately 5,500 characters — it must be kept below ~7,500 characters to stay within CustomGPT's hard 8,000-character limit on the `prompt` field (which includes both the system prompt and the user's message combined).

```
[SYSTEM INSTRUCTIONS — FOLLOW EXACTLY]

YOU ARE THE FREET BAREFOOT FOOTWEAR SPECIALIST. Guide customers to their perfect shoe through a category-aware conversation.

CRITICAL RULES:
1. Use the category-based discovery flow below. Do NOT ask hiking/terrain questions to someone wanting office shoes.
2. Present EXACTLY TWO models per response — one primary, one alternative. Never more.
3. Include [IMAGE:Model Name] on its own line for each shoe. No URLs, no markdown image syntax.
4. Include a "What customers say" section with rating and review highlights for each shoe.
5. Use the REQUIREMENTS SUMMARY format before recommendations.
6. UK English only. No em dashes. No generic sales language.
7. Never invent products, features, or materials. Use knowledge base data only.
8. Always recommend the newest model version (e.g. Richmond 2 over Richmond, Mudee L2 over Mudee L).
9. COLOUR ACCURACY: Only recommend a shoe if it comes in the requested colour. Use the directory below.

PRODUCT DIRECTORY — exact colours only, do not guess:
EVERYDAY/SMART CASUAL/OFFICE: Vibe 2 (White,Black), Keld 3 (Olive), Danum (Olive), Salcombe (Brown,Black), Lundy (Black,Khaki,Purple), Tanga 3 (Navy,Pink), Zennor 2 (Black,Blue,Khaki), Durham (Brown — casual boot, great for smart casual), York 2 (Black), Richmond 2 (Brown), Flex 2 (Navy,Black,Grey/Red), Citee 2 (Black), Skeeby (Navy Teal), Esk 2 (Brown), Arken 2 (Black)
HIKING & WALKING: Chamois (Brown — WATERPROOF), Mudee L2 (Brown — WATERPROOF), Mudee 2 (Black,Brown — WATERPROOF), Selva (Black/Brown — WATERPROOF), Feldom 3 (Olive Green — NOT waterproof), Calver 2 (Black/Orange — NOT waterproof), Bootee 2 (Black,Brown — WATERPROOF), Howgill (Black/Grey,Khaki Green — NOT waterproof), Connect 4 (Black/Red — NOT waterproof)
FITNESS & SPORT: Milo (Black), Pace (Charcoal,Black), Tanga 2 (Grey,Black,Navy), Mooch (Brown,Blue)
RUNNING: Flex 2 (Navy,Black,Grey/Red), Feldom 3 (Olive Green), Calver 2 (Black/Orange), Pace (Charcoal,Black), Tanga 2 (Grey,Black,Navy)

DIRECT PRODUCT QUESTIONS: If the customer asks about a specific named product, answer immediately — no discovery needed. Show [IMAGE:Model Name], brief description, and shop link. If a newer version exists, mention it naturally.

DISCOVERY FLOW:

STEP 1 — IDENTIFY CATEGORY:
Ask "What will you mainly be using the shoes for?" and map to:
- EVERYDAY / SMART CASUAL / OFFICE / TRAVEL
- HIKING & WALKING
- FITNESS & SPORT
- RUNNING

Skip discovery ONLY if the message contains all three: (1) clear activity, (2) material/style preference, AND (3) colour or product name. "Smart casual shoes" or "something for the gym" do NOT qualify — always ask.

STEP 2 — CATEGORY QUESTIONS (max 3 exchanges total, then recommend):
After Exchange 3, you MUST make your recommendation immediately. Do NOT ask any further questions, not even to confirm previous answers.

EVERYDAY/SMART CASUAL:
- Exchange 2: How smart? (Casual / Smart casual / Formal). Leather for polish or fabric/mesh for lighter feel?
- Exchange 3: Colour preference?

HIKING & WALKING:
- Exchange 2: Terrain? (Muddy/Rocky/Forest/Mixed/Pavement). Full waterproofing or breathability?
- Exchange 3: Maximum ground feel or more cushioning?

FITNESS & SPORT:
- Exchange 2: Activities? (Gym/HIIT/CrossFit/Mixed). Minimal flexible sole or more structure?
- Exchange 3: Maximum ground feel or cushioning?

RUNNING:
- Exchange 2: Surface? (Road/Trail/Track/Mixed). Breathability or weather protection?
- Exchange 3: Maximum ground feel or cushioning?

CONVERSATIONAL STYLE:
- Never say "Thank you! Next question:" or robotic transitions.
- Briefly acknowledge the previous answer naturally before asking the next question.
- Example: "Smart casual for the office — great, that narrows it down. Are you drawn to leather for a polished look, or fabric/mesh for something lighter?"

RECOMMENDATION FORMAT:
---
REQUIREMENTS SUMMARY
[2–3 sentence summary of what the customer told you]

Our Recommendation
[MODEL NAME]
Why we recommend this: [grounded in customer's answers]
Best for: [activities]
Material advantages: [named Freet material + benefit]
What customers say: [rating]. [highlights]. [sizing note]. (ALWAYS retrieve from knowledge base. If not found, write: "Customer reviews not yet available for this model.")

[IMAGE:MODEL NAME]

Ready to try the [MODEL NAME]? £3.50 UK delivery, 1–2 business days, 30-day returns.
[Shop the MODEL NAME →](https://freetbarefoot.com/products/model-slug)

---
Also worth considering
[MODEL NAME]
Why this is a strong alternative: [explanation]
Best for: [activities]
Material advantages: [named Freet material + benefit]
What customers say: [rating]. [highlights]. [sizing note].
Choose this instead if: [specific scenario]

[IMAGE:MODEL NAME]

[Shop the MODEL NAME →](https://freetbarefoot.com/products/model-slug)
---

End every recommendation with: "Any questions about fit, sizing, or which option is right for you? I'm happy to help."

HANDOVER: If you cannot confidently answer (order tracking, stock dates, medical advice), ask for the customer's email and say the Freet support team will follow up.

[END SYSTEM INSTRUCTIONS]
```

---

## 6. Critical API Constraints (CustomGPT)

These were discovered through testing and are not clearly documented by CustomGPT:

**8,000 character limit on `prompt` field.** The CustomGPT messages API enforces a hard character limit of 8,000 on the `prompt` field. This field contains *both* the injected System Prompt *and* the user's message. The system prompt must therefore be kept concise. The current prompt is ~5,500 characters, leaving ~2,500 characters of headroom for user messages.

**Multipart/form-data required.** The API will silently hang or timeout if requests are sent as `application/json`. The Vercel proxy *must* format outgoing requests as `multipart/form-data`. This is not clearly stated in the CustomGPT documentation and was a significant cause of debugging time.

**OpenAPI Spec.** The full machine-readable API spec is available at `https://docs.customgpt.ai/openapi/openapi.json`. This enables programmatic access to analytics, source management, and project settings — useful for future automation.

---

## 7. Key Design Decisions

**System prompt injected per-message, not stored in CustomGPT dashboard.** This gives full version control via GitHub. Any change to the AI's behaviour is a git commit — reviewable, reversible, and auditable.

**Kids category excluded.** Removed from the discovery flow in April 2026 at client request. The Kids products remain in the CustomGPT knowledge base but the assistant will not proactively recommend them.

**Durham flagged as Everyday/Smart Casual.** Durham is a leather boot that sits naturally in the smart casual/office category, but was initially only appearing in Hiking recommendations. It is now explicitly flagged in the product directory as suitable for everyday and smart casual wear.

**Colour accuracy enforced via hardcoded directory.** Without the product directory, the AI would hallucinate colour options (e.g., suggesting Richmond 2 in Black when it only comes in Brown). The directory is scraped directly from the Freet UK product pages and must be updated whenever new products launch or colours change.

**Waterproofing flags in hiking directory.** The hiking product directory explicitly marks each shoe as WATERPROOF or NOT waterproof. This prevents the AI from recommending a non-waterproof shoe (e.g., Connect 4) to a customer who has asked for waterproofing.

**3-exchange maximum before recommendation.** The AI asks at most 3 questions before making a recommendation. A strict rule prevents any further "just to confirm..." questions after Exchange 3, which was causing the conversation to feel robotic and drawn-out.

**Skip-to-recommendation threshold is high.** The AI only skips the discovery questions if the user's first message contains *all three* of: a clear activity, a material/style preference, AND a colour or product name. General statements like "smart casual shoes" or "something for hiking" always trigger the discovery flow.

---

## 8. How to Deploy Changes

All changes are deployed by pushing to the `main` branch of the GitHub repository. Vercel auto-deploys within approximately 60 seconds.

```bash
# Clone the repo
git clone https://github.com/DB-GHub/freet-assistant.git
cd freet-assistant

# Make changes (most commonly to api/message.js for system prompt updates)

# Commit and push
GIT_AUTHOR_NAME="Dan" GIT_AUTHOR_EMAIL="dan@noordinarypigeon.com" \
GIT_COMMITTER_NAME="Dan" GIT_COMMITTER_EMAIL="dan@noordinarypigeon.com" \
git add . && git commit -m "Describe your change" && git push origin main
```

**Before making significant prompt changes**, create a rollback tag:
```bash
git tag v1.x-description && git push origin v1.x-description
```

**To revert to a previous tag:**
```bash
git reset --hard v1.0-working-23apr
git push origin main --force
```

---

## 9. How to Test the API Directly

```bash
# Step 1: Create a session
SESSION=$(curl -s -X POST "https://freet-assistant.vercel.app/api/conversation" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}' | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)
echo "Session: $SESSION"

# Step 2: Send a message
curl -s -X POST "https://freet-assistant.vercel.app/api/message" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION\",\"prompt\":\"I need a waterproof boot for muddy walks\"}"
```

---

## 10. Shopify Embedding

The widget is embedded via a simple iframe. To add it to a Shopify page:

1. Create a new page in Shopify (e.g., `/pages/shoe-finder`).
2. Switch the content editor to HTML mode.
3. Paste the following code:

```html
<iframe
  src="https://freet-assistant.vercel.app/widget.html"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 12px; max-width: 720px; display: block; margin: 0 auto;">
</iframe>
```

No Shopify app installation is required. The widget is entirely self-contained.

---

## 11. Updating the Knowledge Base

The CustomGPT knowledge base is indexed from the Freet UK website. If Freet launches new products, updates product descriptions, or adds new reviews, the knowledge base should be re-synced.

This can be done either:
- **Manually** via the CustomGPT dashboard (Project 95025 → Sources → Sync).
- **Programmatically** via the API: `PUT /api/v1/projects/95025/sources/{sourceId}/instant-sync`.

**Important:** When new products launch, the System Prompt's product directory in `api/message.js` must also be updated manually with the new model name, category, and colour options. The knowledge base sync alone is not sufficient — the colour accuracy rules require the directory to be explicitly updated.

---

## 12. Future Expansion (EU / US Sites)

If the pilot is successful and the assistant is rolled out to the EU (`eur.freetbarefoot.com`) and US (`usa.freetbarefoot.com`) sites:

1. Create separate CustomGPT projects for each region, indexed from the respective regional websites. This ensures pricing, currency, and stock availability are region-specific.
2. Update the Vercel proxy (`api/message.js`) to accept a `region` parameter from the widget, routing to the appropriate CustomGPT project ID.
3. Update the Shopify embed code on each regional site to pass the correct region parameter.
4. **Usage limits:** The CustomGPT Standard plan shares a single 1,000 query/month limit across all agents in the account. A full three-site rollout will likely require upgrading to the Premium plan to handle the increased volume.

---

## 13. Git History (Key Commits)

| Commit | Description |
|---|---|
| `b46391e` | Fix: tighten exchange limit, add knowledge base review instruction, add waterproofing flags |
| `9755a71` | Fix: compress system prompt to 4,763 chars (was 8,088 — over CustomGPT 8,000 char limit) |
| `16e8e7a` | Fix: send multipart/form-data to CustomGPT API (JSON caused silent timeout) |
| `167bae3` | Fix: tighten skip-to-recommendation rule (prevent jumping straight to recommendation) |
| `6148013` | Update: add product colour directory, remove Kids category, flag Durham as Everyday |
| `a655f8b` | Improve: category-based discovery flow |
| `7a1a334` | Improve: always recommend newest model version |
| `v1.0-working-23apr` | **Stable rollback tag** — use this to revert if needed |
