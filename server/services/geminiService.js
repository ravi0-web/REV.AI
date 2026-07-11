/**
 * AI Service — Rev.AI
 *
 * Uses OpenRouter API to access Google Gemini models seamlessly.
 *
 * Exports:
 *   analyzeReview(text)         — used by reviewController
 *   chat(message)               — used by aiController
 *   summarize(text)             — used by aiController
 *   recommend(reviewText)       — used by aiController
 */

// ── OpenRouter Setup ──────────────────────────────────────
const OPENROUTER_API_KEY = process.env.GEMINI_API_KEY; // Re-using this env variable for the OpenRouter key
const MODEL = 'google/gemini-2.5-flash';

async function fetchOpenRouter(prompt, systemInstruction = null) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('your_gemini')) {
    throw new Error('API key not configured.');
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      // Optional: Add HTTP referer and title for OpenRouter analytics
      'HTTP-Referer': 'http://localhost:5173', 
      'X-Title': 'Rev.AI'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      max_tokens: 1000 // IMPORTANT: limits token cost and prevents credit errors
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ──────────────────────────────────────────────
//  Exported: analyzeReview (used by reviewController)
// ──────────────────────────────────────────────

async function analyzeReview(text) {
  try {
    const prompt = `
You are a hospitality review analyzer. Analyze the following guest review and respond ONLY with a valid JSON object (no markdown, no explanation).

Review: "${text}"

Return this exact JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "theme": "food" | "host" | "location" | "cleanliness" | "value" | "experience",
  "response": "<a professional 1-2 sentence management response>"
}`;

    const raw = await fetchOpenRouter(prompt);
    
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed  = JSON.parse(cleaned);

    const validSentiments = ['positive', 'neutral', 'negative'];
    const validThemes     = ['food', 'host', 'location', 'cleanliness', 'value', 'experience'];

    return {
      sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
      theme:     validThemes.includes(parsed.theme)         ? parsed.theme     : 'experience',
      response:  typeof parsed.response === 'string'        ? parsed.response  : 'Thank you for your feedback.',
    };
  } catch (err) {
    console.error('⚠️ AI Analysis failed:', err.message);
    // Offline fallback for failure
    return {
      sentiment: 'neutral',
      theme: 'experience',
      response: 'Thank you for your feedback. We appreciate your review.',
    };
  }
}

// ──────────────────────────────────────────────
//  Exported: AI Endpoints
// ──────────────────────────────────────────────

async function chat(message) {
  try {
    return await fetchOpenRouter(
      message, 
      "You are a helpful AI assistant for Rev.AI, a hospitality review analysis platform. Answer concisely and helpfully."
    );
  } catch (err) {
    console.error('AI chat error:', err.message);
    throw new Error('AI chat service is temporarily unavailable.');
  }
}

async function summarize(text) {
  try {
    const prompt = `Summarize the following guest review in 2-3 concise sentences, focusing on the key points:\n\n"${text}"\n\nProvide only the summary, no introduction or labels.`;
    return await fetchOpenRouter(prompt);
  } catch (err) {
    console.error('AI summarize error:', err.message);
    throw new Error('AI summarization is temporarily unavailable.');
  }
}

async function recommend(reviewText) {
  try {
    const prompt = `Based on the following guest review, provide 3 specific, actionable improvement recommendations for the property manager.\n\nReview: "${reviewText}"\n\nFormat your response as a numbered list (1. 2. 3.) with each recommendation being 1-2 sentences. Be specific and practical.`;
    return await fetchOpenRouter(prompt, "You are a hospitality consultant.");
  } catch (err) {
    console.error('AI recommend error:', err.message);
    throw new Error('AI recommendation service is temporarily unavailable.');
  }
}

module.exports = { analyzeReview, chat, summarize, recommend };
