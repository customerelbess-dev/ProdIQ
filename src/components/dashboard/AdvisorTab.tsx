"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

type Analysis = {
  product_name?: string | null;
  score?: number | null;
  verdict?: string | null;
  angles?: unknown[] | null;
  competitors?: unknown[] | null;
};

type Props = {
  analyses: Analysis[];
  analysisReport: Record<string, unknown> | null;
  selectedProductName?: string;
};

export function AdvisorTab({ analyses, analysisReport, selectedProductName }: Props) {
  const [advisorSubTab, setAdvisorSubTab] = useState<"ai" | "human">("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [humanMessage, setHumanMessage] = useState("");
  const [humanSent, setHumanSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hey! I'm your ProdIQ AI Advisor 🧠

I have full access to all your analyzed products, market data, and our research APIs. Ask me anything about:

• Your uploaded products and their data
• New angle ideas for any product
• How to beat a specific competitor
• Whether a product idea is worth testing
• How to structure your ads
• Anything about dropshipping and ecom

What would you like to know?`,
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const userMsg = input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          analyses,
          currentReport: analysisReport,
          selectedProduct: selectedProductName,
        }),
      });
      const data = (await res.json()) as { response?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response ?? "Sorry, I ran into an issue." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes advisorPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setAdvisorSubTab("ai")}
          style={{
            background: advisorSubTab === "ai" ? "#6c47ff" : "#111",
            border: `1px solid ${advisorSubTab === "ai" ? "#6c47ff" : "#222"}`,
            borderRadius: 10,
            padding: "10px 20px",
            color: advisorSubTab === "ai" ? "white" : "#555",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🧠 AI Advisor
        </button>
        <button
          type="button"
          onClick={() => setAdvisorSubTab("human")}
          style={{
            background: advisorSubTab === "human" ? "#6c47ff" : "#111",
            border: `1px solid ${advisorSubTab === "human" ? "#6c47ff" : "#222"}`,
            borderRadius: 10,
            padding: "10px 20px",
            color: advisorSubTab === "human" ? "white" : "#555",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          👤 Talk to a Human
        </button>
      </div>

      {advisorSubTab === "human" ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {humanSent ? (
            <div style={{ textAlign: "center", animation: "fadeSlideUp 0.3s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
                Message sent!
              </div>
              <div
                style={{ color: "#555", fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}
              >
                We usually respond within 15-30 minutes during business hours. You will receive a
                reply directly here.
              </div>
            </div>
          ) : (
            <div style={{ width: "100%", maxWidth: 560 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <div
                  style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 6 }}
                >
                  Talk to a Real Person
                </div>
                <div style={{ color: "#555", fontSize: 14 }}>
                  We typically respond within 15-30 minutes
                </div>
              </div>
              <textarea
                value={humanMessage}
                onChange={(e) => setHumanMessage(e.target.value)}
                placeholder="Describe your question or issue in detail..."
                rows={5}
                style={{
                  width: "100%",
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: 12,
                  padding: "14px 16px",
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6c47ff")}
                onBlur={(e) => (e.target.style.borderColor = "#222")}
              />
              <button
                type="button"
                onClick={() => {
                  if (humanMessage.trim()) setHumanSent(true);
                }}
                disabled={!humanMessage.trim()}
                style={{
                  width: "100%",
                  background: humanMessage.trim() ? "#6c47ff" : "#333",
                  border: "none",
                  borderRadius: 10,
                  padding: 14,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: humanMessage.trim() ? "pointer" : "not-allowed",
                }}
              >
                Send Message →
              </button>
              <div
                style={{ textAlign: "center", color: "#444", fontSize: 12, marginTop: 12 }}
              >
                customer.prodiq@gmail.com · New York, NY
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingRight: 4,
              marginBottom: 16,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                }}
              >
                {msg.role === "assistant" ? (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    🧠
                  </div>
                ) : null}
                <div
                  style={{
                    maxWidth: "75%",
                    background: msg.role === "user" ? "#6c47ff" : "#0c0c14",
                    border:
                      msg.role === "assistant" ? "1px solid rgba(108,71,255,0.12)" : "none",
                    borderRadius:
                      msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding: "14px 16px",
                    color: "white",
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  🧠
                </div>
                <div
                  style={{
                    background: "#0c0c14",
                    border: "1px solid rgba(108,71,255,0.12)",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "14px 20px",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#6c47ff",
                        animation: `advisorPulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask me anything about your products, angles, competitors..."
              style={{
                flex: 1,
                background: "#0c0c14",
                border: "1px solid rgba(108,71,255,0.2)",
                borderRadius: 12,
                padding: "14px 18px",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6c47ff")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(108,71,255,0.2)")}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() ? "#6c47ff" : "#111",
                border: "none",
                borderRadius: 12,
                padding: "14px 20px",
                color: "white",
                fontSize: 20,
                cursor: input.trim() ? "pointer" : "not-allowed",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
