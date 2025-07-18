import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AIBotAnimation from "@/public/ai-bot.json";
import Lottie from "lottie-react";
import { X } from "lucide-react";
import { FormEvent, useEffect, useState, useRef } from "react";

interface Message {
  role: string;
  content: string;
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to auto-scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Unified function to handle sending messages to the API
  const sendMessage = async (newMessages: Message[]) => {
    setIsLoading(true);
    setError(null);
    setMessages(newMessages); // Optimistically update UI

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.body) throw new Error("No response body");
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = "";

      // Add a placeholder for the assistant's response
      const assistantMessagePlaceholder = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMessagePlaceholder]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Update the content of the assistant's message placeholder
        setMessages([
          ...newMessages,
          { role: "assistant", content: fullResponse },
        ]);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        // Remove the assistant placeholder on error
        setMessages(newMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // handleSubmit now uses the unified sendMessage function
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    sendMessage([...messages, userMessage]);
    setInput("");
  };

  // append (for prompts) now also uses the unified sendMessage function
  const handlePromptClick = (prompt: string) => {
    const userMessage = { role: "user", content: prompt };
    sendMessage([...messages, userMessage]);
  };

  // Clear chat on close
  const toggleChat = () => {
    if (isOpen) {
      setMessages([]);
      setInput("");
      setError(null);
    }
    setIsOpen((prev) => !prev);
  };

  // Fetch prompts when the chat opens
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error("Failed to fetch prompts");
        const data = await res.json();
        setPrompts(data.prompts);
      } catch (err) {
        if (err instanceof Error) setError(err);
        console.error("Failed to fetch prompts", err);
      }
    };
    if (isOpen) {
      fetchPrompts();
    }
  }, [isOpen]);

  return (
    <div>
      {/* Chat toggle button */}
      <Button
        variant="outline"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-4 right-4 z-50 rounded-full p-1 bg-popover shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
      >
        <Lottie animationData={AIBotAnimation} loop autoplay />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-[5.5rem] sm:bottom-[6.5rem] lg:bottom-[7.5rem] right-4 z-50 w-[calc(100%-2rem)] max-w-md sm:w-96 border bg-white dark:bg-slate-900 dark:border-slate-700 shadow-xl rounded-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700">
            <h3 className="text-lg font-semibold">Chat with bot assistant</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-grow h-64 overflow-y-auto space-y-3 p-4 pr-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm shadow-md transition-all duration-200 ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-white rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-white text-sm px-4 py-2 rounded-xl rounded-bl-none shadow-sm animate-pulse">
                  AI is typing…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts and Input form */}
          <div className="border-t dark:border-slate-700 p-4 pt-2">
            {/* Suggested prompts - This will now always be visible */}
            <div className="pb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Suggested prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePromptClick(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                autoFocus
                disabled={isLoading}
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                Send
              </Button>
            </form>
            {error && (
              <div className="pt-2 text-xs text-red-500">
                Something went wrong: {error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
