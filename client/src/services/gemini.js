const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
const KEY = import.meta.env.VITE_GEMINI_KEY;
let lastCallTime = 0;
const MIN_INTERVAL_MS = 10000;

const SYSTEM_PROMPT =
  'You are an industrial safety AI for ElixNode. Given HAI SCADA sensor readings in JSON, detect anomalies, rate overall risk as LOW/MEDIUM/HIGH/CRITICAL, explain in plain English what is happening in the plant, and give operator actions. Respond ONLY in JSON: {"riskLevel":"LOW|MEDIUM|HIGH|CRITICAL","summary":"...","recommendation":"...","anomalies":[{"sensorId":"...","issue":"..."}]}';

export async function analyzeReadings(sensors) {
  const now = Date.now();
  if (now - lastCallTime < MIN_INTERVAL_MS) {
    console.log("Rate limit guard: skipping AI call");
    return null;
  }
  lastCallTime = now;

  const response = await fetch(`${GEMINI_URL}?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nHAI sensor payload:\n${JSON.stringify(sensors, null, 2)}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 400
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini API error");
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
