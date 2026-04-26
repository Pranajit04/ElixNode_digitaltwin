const OLLAMA_URL = "http://localhost:11434/api/generate";

export async function analyzeOffline(readings) {
  const prompt = `Analyze these industrial sensor readings and return JSON only.
Readings: ${JSON.stringify(readings)}
Format: {"riskLevel":"LOW|MEDIUM|HIGH|CRITICAL","summary":"...","recommendation":"...","anomalies":[...]}`;

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tinyllama",
      prompt,
      stream: false
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Ollama API error");
  }

  return {
    source: "ollama",
    ...JSON.parse((data.response || "{}").replace(/```json|```/g, "").trim())
  };
}
