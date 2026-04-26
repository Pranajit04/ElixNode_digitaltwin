import { analyzeReadings } from "./gemini";
import { analyzeOffline } from "./ollama";

export async function runAIAnalysis(readings) {
  try {
    return await analyzeReadings(readings);
  } catch (error) {
    console.warn("Gemini unavailable, falling back to Ollama.", error);
    try {
      return await analyzeOffline(readings);
    } catch {
      return {
        source: "system",
        riskLevel: "UNKNOWN",
        summary: "AI unavailable",
        recommendation: "Manual review needed.",
        anomalies: []
      };
    }
  }
}
