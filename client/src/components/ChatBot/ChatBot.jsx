import { useEffect, useMemo, useRef, useState } from "react";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT =
  "You are ElixNode AI Assistant, an expert in industrial safety and SCADA systems. You help plant operators understand sensor data, anomalies, and safety risks. You have knowledge of the HAI dataset which monitors water treatment systems with sensors: P1_FT_321 (flow), P1_LT_301 (level), P1_PIT_01 (pressure), P2_FCV01D (valve), P3_LIT_01 (tank level). Keep answers concise, practical, and safety-focused. If asked about current readings, say you can see live data is being monitored and suggest checking the dashboard panels.";

const WELCOME_MESSAGE =
  "👋 Hello! I'm your ElixNode AI Assistant powered by Gemini. I can help you understand sensor readings, explain anomalies, and guide you through safety procedures. What would you like to know?";

const QUICK_REPLIES = [
  "What is ATT_FLAGS?",
  "Explain current risk level",
  "What should I do in a CRITICAL alert?"
];

function toGeminiHistory(messages) {
  return messages
    .filter((message) => message.role === "user" || message.role === "model")
    .map((message) => ({
      role: message.role,
      parts: [{ text: message.text }]
    }));
}

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasUserMessage = useMemo(() => messages.some((message) => message.role === "user"), [messages]);

  useEffect(() => {
    if (open && !welcomed) {
      setMessages([{ id: crypto.randomUUID(), role: "model", text: WELCOME_MESSAGE }]);
      setWelcomed(true);
    }

    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 160);
    }
  }, [open, welcomed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function askGemini(text, nextMessages) {
    const API_KEY = import.meta.env.VITE_GEMINI_KEY;
    console.log("ChatBot key loaded:", API_KEY ? "YES ✅" : "NO ❌");
    if (!API_KEY) {
      throw new Error("Missing Gemini API key");
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
      },
      ...toGeminiHistory(nextMessages)
    ];

    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 500
        }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API request failed");
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "I could not generate a response.";
  }

  async function sendMessage(value = input) {
    const text = value.trim();
    if (!text || loading) {
      return;
    }

    const userMessage = { id: crypto.randomUUID(), role: "user", text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await askGemini(text, nextMessages);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "model", text: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "model",
          text: "Sorry, AI is temporarily unavailable. Check your Gemini API key in .env"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chatbot-root">
      {open ? (
        <section className="chatbot-panel" aria-label="ElixNode AI Assistant">
          <header className="chatbot-header">
            <div>
              <div className="chatbot-title">ElixNode AI Assistant</div>
              <div className="chatbot-subtitle">Gemini · Ask about your plant, sensors, or anomalies</div>
            </div>
            <button className="chatbot-close" type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              X
            </button>
          </header>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message-row ${message.role === "user" ? "user" : "model"}`}>
                {message.role === "model" ? <span className="chatbot-avatar">🤖</span> : null}
                <div className={`chatbot-bubble ${message.role}`}>{message.text}</div>
              </div>
            ))}

            {!hasUserMessage ? (
              <div className="chatbot-quick-replies">
                {QUICK_REPLIES.map((reply) => (
                  <button key={reply} type="button" onClick={() => sendMessage(reply)}>
                    {reply}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? (
              <div className="chatbot-message-row model">
                <span className="chatbot-avatar">🤖</span>
                <div className="chatbot-bubble model typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-row">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini about ElixNode..."
              disabled={loading}
            />
            <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </section>
      ) : null}

      <button
        className="chatbot-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? "X" : "🤖"}
      </button>
    </div>
  );
}

export default ChatBot;
