# Jonathan AI Chat

An open-source AI chat grounded in the recorded teachings of Jonathan (adampants). Every response draws exclusively from the transcript corpus — no hallucinated quotes, no invented wisdom.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/jonathan-ai-chat&env=OPENROUTER_API_KEY&envDescription=OpenRouter%20API%20key%20for%20model%20access&envLink=https://openrouter.ai/keys)

---

## Privacy

**No messages are stored.** Your input goes directly to the AI model (OpenRouter or your local Ollama instance). There is no database, no server-side logging, and no analytics. The operator of a hosted instance never sees your messages.

---

## Deploy to Vercel (2 minutes)

1. Click the **Deploy** button above (or fork this repo and import it in the Vercel dashboard)
2. When prompted, add one environment variable:
   - `OPENROUTER_API_KEY` — get a free key at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Click **Deploy** — done

That's it. Your API key lives in Vercel's encrypted environment, never in the browser.

**Optional: add rate limiting** so you don't burn through your credits. See the [Rate Limiting](#rate-limiting) section below.

---

## Run locally with OpenRouter

```bash
git clone https://github.com/YOUR_USERNAME/jonathan-ai-chat.git
cd jonathan-ai-chat
npm install
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Run locally with Ollama (free, fully private)

No API key. Your messages never leave your machine.

1. Install Ollama: [ollama.com](https://ollama.com)
2. Pull a model:
   ```bash
   ollama pull llama3.2
   # or: ollama pull mistral, ollama pull phi3, etc.
   ```
3. Configure `.env`:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

When `OLLAMA_BASE_URL` is set it takes priority over OpenRouter entirely.

> **Note:** Local models work best with 7B+ parameter models. Smaller models may not follow the system prompt as reliably.

---

## Rate Limiting

For public deployments, set a per-IP limit (default: 10 messages/day) using a free [Upstash Redis](https://upstash.com) database:

1. Sign up at [upstash.com](https://upstash.com) → create a Redis database (free tier is plenty)
2. Copy the REST URL and token
3. Add to your environment:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

Without these variables the app runs without rate limiting — fine for local use or private deployments.

---

## Change the AI model

Set `OPENROUTER_MODEL` to any model available on [openrouter.ai/models](https://openrouter.ai/models):

```env
OPENROUTER_MODEL=anthropic/claude-3.5-haiku
OPENROUTER_MODEL=google/gemini-flash-1.5
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

The default is `deepseek/deepseek-v4-flash` — fast, cheap, and handles large context well.

---

## Use your own corpus

1. Place your transcript `.txt` files in a folder
2. Run the build script to regenerate the corpus:
   ```bash
   node corpus/build-corpus.js /path/to/your/index.json
   ```
   Or replace `corpus/corpus-text.json` directly — it's plain JSON:
   ```json
   [{ "file": "teaching-name.txt", "chunk_idx": 0, "text": "..." }, ...]
   ```
3. Update the system prompt in `lib/corpus.ts` to match your source material

---

## Project structure

```
app/
  page.tsx              ← chat UI
  api/chat/route.ts     ← server-side API (key never hits the browser)
  layout.tsx
  globals.css
lib/
  corpus.ts             ← loads corpus, exports system prompt
corpus/
  corpus-text.json      ← transcript text (no embeddings, ~550KB)
  build-corpus.js       ← regenerate corpus-text.json from a full index
middleware.ts           ← optional IP rate limiting
.env.example            ← copy to .env and fill in your keys
```

---

## License

MIT
