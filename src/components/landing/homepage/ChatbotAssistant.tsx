import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  unknown?: boolean;
};

const quickQuestions = [
  "What is AgriSmart?",
  "Is AgriSmart free for farmers?",
  "How much does the cooperative plan cost?",
  "How can NGOs work with AgriSmart?",
  "Where is AgriSmart located?",
  "How do I contact the team?",
];

const greeting =
  "Hello! ðŸ‘‹\nI'm the AgriSmart Assistant.\nI can help answer questions about our platform, pricing, partnerships, and how farmers use AgriSmart.";

type Answer = { text: string; unknown?: boolean };

function getAnswer(question: string): Answer {
  const q = question.toLowerCase();

  const includesAny = (terms: string[]) => terms.some((term) => q.includes(term));

  if (includesAny(["what is agrismart", "about agrismart", "platform"])) {
    return {
      text:
        "AgriSmart is a smart agriculture platform that uses data, AI, and environmental insights to help farmers improve productivity, reduce losses, and make better decisions.",
    };
  }

  if (includesAny(["how does", "how it works", "ai", "artificial intelligence", "machine learning"])) {
    return {
      text:
        "AgriSmart applies AI and machine learning to climate, crop, and market data to generate practical insights for farmers and organizations.",
    };
  }

  if (includesAny(["free", "farmers", "cost for farmers"])) {
    return {
      text:
        "AgriSmart is free for individual farmers. The platform is funded by cooperatives, NGOs, and government programs supporting farmers at scale.",
    };
  }

  if (includesAny(["cooperative", "co-op", "cooperative plan"])) {
    return {
      text:
        "The Cooperative Plan is KSh 30,000 per month, includes a 60-day free trial, and has a yearly plan of KSh 288,000 with KSh 72,000 savings.",
    };
  }

  if (includesAny(["ngo", "government", "gov", "institution", "program"])) {
    return {
      text:
        "The Government/NGO Plan starts at KSh 100,000 per month, with a yearly plan of KSh 900,000 and KSh 300,000 savings.",
    };
  }

  if (includesAny(["location", "where", "based", "kisumu", "nairobi"])) {
    return {
      text:
        "AgriSmart is headquartered in Kisumu, Kenya, with plans to expand to Nairobi and other regions.",
    };
  }

  if (includesAny(["contact", "email", "phone", "reach", "linkedin"])) {
    return {
      text:
        "You can reach us at agrismartk@gmail.com, call +254 113 245 740, or connect via LinkedIn: AgriSmart Kenya Inc.",
    };
  }

  if (includesAny(["partners", "ecosystem", "plogging", "aws", "azure", "google cloud", "openai", "somo", "eldohub"])) {
    return {
      text:
        "AgriSmart partners include Plogging Kenya, AWS, Microsoft Azure, Google Cloud, OpenAI, Somo Africa, and Eldohub.",
    };
  }

  if (includesAny(["weather", "climate", "alerts", "crop", "soil", "market", "pricing", "recommendations"])) {
    return {
      text:
        "AgriSmart provides AI-powered crop recommendations, weather and climate alerts, crop disease insights, market price intelligence, and soil/environmental guidance.",
    };
  }

  if (includesAny(["technology", "tech", "stack", "openstreetmap", "mapping"])) {
    return {
      text:
        "AgriSmart uses AI and machine learning, cloud infrastructure, environmental and weather data systems, and OpenStreetMap for mapping.",
    };
  }

  return {
    text: "I'm not sure about that yet, but our team can help.",
    unknown: true,
  };
}

export function ChatbotAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const lastMessage = messages[messages.length - 1];
  const showEscalation = lastMessage?.role === "assistant" && lastMessage?.unknown;

  const greetingMessage = useMemo<Message>(
    () => ({ id: "greeting", role: "assistant", text: greeting }),
    []
  );

  const displayedMessages = open
    ? messages.length === 0
      ? [greetingMessage]
      : messages
    : messages;

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const answer = getAnswer(trimmed);
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: answer.text,
      unknown: answer.unknown,
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={open ? "Close AgriSmart Assistant" : "Open AgriSmart Assistant"}
      >
        <MessageCircle className="h-6 w-6 animate-pulse" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-[70] flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px]"
          >
            <div className="flex items-center justify-between border-b border-white/60 bg-white/80 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">AgriSmart Assistant</p>
                <p className="text-xs text-muted-foreground">Helping you learn about smart agriculture</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {displayedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-foreground"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Suggested questions</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => handleSend(question)}
                        className="rounded-full border border-primary/20 bg-white px-3 py-1 text-xs text-foreground transition hover:border-primary/40"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {showEscalation ? (
                <div className="flex flex-wrap gap-2">
                  <a href="#contact" className="agri-btn-primary">
                    Contact Team
                  </a>
                  <a href="mailto:agrismartk@gmail.com" className="agri-btn-secondary">
                    Send Email
                  </a>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2 border-t border-white/60 bg-white/80 px-4 py-3"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask AgriSmart Assistant..."
                className="flex-1 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:scale-105"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

