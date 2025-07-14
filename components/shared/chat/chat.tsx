import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AIBotAnimation from "@/public/ai-bot.json";
import { useChat } from "@ai-sdk/react";
import Lottie from "lottie-react";
import { X } from "lucide-react";
import { FormEvent, useState } from "react";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    setInput,
  } = useChat({ api: "/api/chat" });

  // Clear chat on close
  const toggleChat = () => {
    if (isOpen) {
      setMessages([]); // Clear messages
      setInput(""); // Clear input
    }
    setIsOpen((prev) => !prev);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-4 right-4 z-50 rounded-full p-1 bg-popover shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
      >
        {isOpen ? (
          <Lottie animationData={AIBotAnimation} loop autoplay />
        ) : (
          <Lottie animationData={AIBotAnimation} loop autoplay />
        )}
      </Button>

      {isOpen && (
        <div className="fixed bottom-[5.5rem] sm:bottom-[6.5rem] lg:bottom-[7.5rem] right-4 z-50 w-[calc(100%-2rem)] max-w-md sm:w-96 border bg-white dark:bg-slate-900 dark:border-slate-700 shadow-xl rounded-lg">
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
          <div className="h-64 overflow-y-auto space-y-3 p-4 pr-2">
            {messages.map((m) => (
              <div
                key={m.id}
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

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-white text-sm px-4 py-2 rounded-xl rounded-bl-none shadow-sm animate-pulse">
                  AI is typing…
                </div>
              </div>
            )}
          </div>

          {/* Input form */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 px-4 pb-4"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              autoFocus
              disabled={isLoading}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              Send
            </Button>
          </form>

          {/* Error */}
          {error && (
            <div className="px-4 pb-3 text-xs text-red-500">
              Something went wrong: {error.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
