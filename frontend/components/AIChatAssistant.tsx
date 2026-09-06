"use client";

import { FormEvent, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles } from "lucide-react";
import Modal from "./Modal";
import { Alert } from "./UI";
import { api, errorMessage } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = [
  "What did the team work on last week?",
  "Summarize this week's completed work.",
  "What blockers were reported most often?",
  "Which projects had the most activity?",
  "Are there any workload imbalances?",
];

export default function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(message = input) {
    const question = message.trim();
    if (!question || busy) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setBusy(true);
    try {
      const result = await api<{ answer: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: question }),
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.answer },
      ]);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(true)}
        aria-label="Open Team AI Assistant"
      >
        <Sparkles size={16} />
        AI Assistant
      </button>
      {open && (
        <Modal
          title="Team AI Assistant"
          description="Ask questions about team reports and activity."
          onClose={() => setOpen(false)}
          busy={busy}
        >
          <div className="flex min-h-[420px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
              {!messages.length && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm leading-6 text-slate-600">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-indigo-800">
                    <Bot size={17} />
                    Ask about submitted team activity
                  </div>
                  Answers are based only on the report data available to managers.
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[92%] rounded-xl px-3.5 py-3 text-sm leading-6 whitespace-pre-wrap ${
                    message.role === "user"
                      ? "ml-auto bg-indigo-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
                  <LoaderCircle size={16} className="animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
            {error && (
              <div className="mt-3">
                <Alert>{error}</Alert>
              </div>
            )}
            {!messages.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => void send(suggestion)}
                  >
                    <MessageCircle size={13} className="mr-1.5 inline" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={submit} className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4">
              <label className="sr-only" htmlFor="ai-question">Ask the team assistant</label>
              <textarea
                id="ai-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about team activity..."
                maxLength={1000}
                rows={2}
                disabled={busy}
                className="mt-0 min-h-0 resize-none"
              />
              <button
                type="submit"
                className="btn h-[62px] w-12 shrink-0 px-0"
                disabled={busy || !input.trim()}
                aria-label="Send question"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
