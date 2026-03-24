"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Send } from "lucide-react";

interface Message {
  role: "ai" | "user";
  text: string;
}

interface Step {
  aiMessage: string;
  quickReplies: string[];
}

const CONVERSATION_STEPS: Step[] = [
  {
    aiMessage:
      "\u4f60\u597d\uff01\u6211\u662f TradeX AI \u5efa\u7ad9\u52a9\u624b \ud83d\udc4b \u544a\u8bc9\u6211\u4f60\u7684\u516c\u53f8\u540d\u79f0\u548c\u4e3b\u8425\u4ea7\u54c1\uff0c\u6211\u6765\u5e2e\u4f60\u5feb\u901f\u751f\u6210\u4e13\u4e1a\u5916\u8d38\u7f51\u7ad9\u3002",
    quickReplies: [
      "\u5b81\u6ce2\u7cbe\u5bc6\u6ce8\u5851\u673a\u68b0\u6709\u9650\u516c\u53f8\uff0c\u505a\u6ce8\u5851\u673a\u51fa\u53e3",
      "\u6211\u60f3\u5148\u4e86\u89e3\u4e00\u4e0b",
    ],
  },
  {
    aiMessage:
      "\u6536\u5230\uff01\u5df2\u8bc6\u522b\u884c\u4e1a\uff1a\u6ce8\u5851\u673a\u5236\u9020 \ud83c\udfed\n\n\u6b63\u5728\u5206\u6790\u4f60\u7684\u4e1a\u52a1\u4fe1\u606f...\n\u2705 \u516c\u53f8\u540d\u79f0\uff1a\u5b81\u6ce2\u7cbe\u5bc6\u6ce8\u5851\u673a\u68b0\u6709\u9650\u516c\u53f8\n\u2705 English: Ningbo Precision Injection Machinery Co., Ltd.\n\n\u4f60\u4eec\u6709\u54ea\u4e9b\u6838\u5fc3\u7ade\u4e89\u4f18\u52bf\uff1f\u6bd4\u5982\u51fa\u53e3\u5e74\u9650\u3001\u8ba4\u8bc1\u7b49",
    quickReplies: [
      "20\u5e74\u51fa\u53e3\u7ecf\u9a8c\uff0cCE/ISO\u8ba4\u8bc1\uff0c\u5168\u74033000+\u5ba2\u6237",
      "\u6211\u6765\u8be6\u7ec6\u8bf4\u660e",
    ],
  },
  {
    aiMessage:
      "\u4f18\u52bf\u4fe1\u606f\u5df2\u8bb0\u5f55 \u2705\n\n\u63a5\u4e0b\u6765\u544a\u8bc9\u6211\u4f60\u4eec\u7684\u4e3b\u8981\u4ea7\u54c1\u7ebf\uff1f",
    quickReplies: [
      "\u4f3a\u670d\u6db2\u538b\u6ce8\u5851\u673a\u3001\u5168\u7535\u52a8\u6ce8\u5851\u673a\u3001\u4e8c\u677f\u5f0f\u6ce8\u5851\u673a",
      "\u8f93\u5165\u4ea7\u54c1\u5217\u8868",
    ],
  },
  {
    aiMessage:
      "\u5df2\u5f55\u5165 3 \u6761\u4ea7\u54c1\u7ebf \u2705\n\n\u6700\u540e\u4e00\u6b65\uff1a\u4f60\u7684\u8054\u7cfb\u90ae\u7bb1\u548c WhatsApp\uff1f",
    quickReplies: [
      "sales@nb-precision.com, +86 138 0000 0000",
      "\u586b\u5199\u8054\u7cfb\u65b9\u5f0f",
    ],
  },
  {
    aiMessage:
      "\ud83c\udf89 \u4fe1\u606f\u6536\u96c6\u5b8c\u6210\uff01\n\n\u6211\u5c06\u4e3a\u4f60\u751f\u6210\uff1a\n\u2022 \u4e13\u4e1a\u9996\u9875 + Hero \u6587\u6848\n\u2022 3\u4e2a\u4ea7\u54c1\u5c55\u793a\u9875\n\u2022 \u516c\u53f8\u4ecb\u7ecd\u9875\n\u2022 SEO \u4f18\u5316\u914d\u7f6e\n\u2022 \u8be2\u76d8\u8868\u5355\u7cfb\u7edf\n\n\u9884\u8ba1\u7528\u65f6\u7ea6 15-20 \u5206\u949f",
    quickReplies: [],
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Show initial AI greeting after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{ role: "ai", text: CONVERSATION_STEPS[0].aiMessage }]);
      setIsTyping(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Track visible messages for animation
  useEffect(() => {
    if (messages.length > 0) {
      const lastIndex = messages.length - 1;
      if (!visibleMessages.includes(lastIndex)) {
        // Small delay so the element exists in DOM before animating
        requestAnimationFrame(() => {
          setVisibleMessages((prev) => [...prev, lastIndex]);
        });
      }
    }
  }, [messages, visibleMessages]);

  // Scroll on new messages or typing state change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(
    (text: string) => {
      if (isTyping || currentStep >= CONVERSATION_STEPS.length - 1) return;

      const userMessage: Message = { role: "user", text };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);

      const nextStep = currentStep + 1;

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: CONVERSATION_STEPS[nextStep].aiMessage },
        ]);
        setCurrentStep(nextStep);
        setIsTyping(false);
      }, 800);
    },
    [isTyping, currentStep]
  );

  const handleInputSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    handleSend(trimmed);
  }, [inputValue, handleSend]);

  const isFinalStep =
    currentStep === CONVERSATION_STEPS.length - 1 && !isTyping;
  const quickReplies = CONVERSATION_STEPS[currentStep]?.quickReplies ?? [];

  return (
    <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-lg">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-gray-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-gray-300" />
        <span className="h-3 w-3 rounded-full bg-gray-300" />
        <span className="h-3 w-3 rounded-full bg-gray-300" />
        <div className="ml-3 flex-1 rounded-md bg-gray-200 px-3 py-1 text-xs text-gray-400">
          tradex.site/ai-builder
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col" style={{ height: 480 }}>
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
        >
          {messages.map((msg, idx) => {
            const isVisible = visibleMessages.includes(idx);
            return msg.role === "ai" ? (
              <div
                key={idx}
                className="flex items-end gap-2 transition-all duration-300 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? "translateY(0)"
                    : "translateY(8px)",
                }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                  AI
                </div>
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-800">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div
                key={idx}
                className="flex justify-end transition-all duration-300 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? "translateY(0)"
                    : "translateY(8px)",
                }}
              >
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white">
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isTyping && <TypingIndicator />}

          {/* CTA button on final step */}
          {isFinalStep && (
            <div className="flex justify-center pt-2">
              <Link
                href="/dashboard/workflow"
                className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                {"\u5f00\u59cb\u751f\u6210\u7f51\u7ad9 \u2192"}
              </Link>
            </div>
          )}
        </div>

        {/* Quick replies */}
        {!isTyping && !isFinalStep && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-black/[0.06] bg-gray-50/50 px-4 py-3 sm:px-6">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleSend(reply)}
                className="rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-sm text-indigo-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-black/[0.06] bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInputSubmit();
              }}
              placeholder={
                isFinalStep
                  ? "\u5df2\u5b8c\u6210\u4fe1\u606f\u6536\u96c6"
                  : "\u8f93\u5165\u4f60\u7684\u56de\u590d..."
              }
              disabled={isTyping || isFinalStep}
              className="flex-1 rounded-lg border border-black/[0.06] bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-50"
            />
            <button
              onClick={handleInputSubmit}
              disabled={isTyping || isFinalStep || !inputValue.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
