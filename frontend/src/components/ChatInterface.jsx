import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeContext";

const ChatInterface = ({ filters }) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content:
        "Hello! I'm your crime analysis assistant. I can help you analyze crime patterns, trends, and provide insights based on your data. What would you like to know?",
      timestamp: new Date(),
      thinking: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage.content,
          filters: filters || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content:
          data.response ||
          "I apologize, but I couldn't generate a response. Please try again.",
        thinking: data.thinking,
        timestamp: new Date(),
        error: data.error,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content:
          "I'm sorry, I encountered an error while processing your request. Please check your connection and try again.",
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex flex-col h-full ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Crime Analysis Assistant
        </h2>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Ask questions about your crime data and get AI-powered insights
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === "user"
                  ? "bg-blue-600 text-white"
                  : message.error
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : isDark
                  ? "bg-gray-700 text-gray-100"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              {message.thinking && (
                <div className="mb-2">
                  <button
                    onClick={() =>
                      setExpandedThinking((prev) => ({
                        ...prev,
                        [message.id]: !prev[message.id],
                      }))
                    }
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      isDark
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>🧠</span>
                    <span>Thinking Process</span>
                    <span>{expandedThinking[message.id] ? "▲" : "▼"}</span>
                  </button>
                  {expandedThinking[message.id] && (
                    <div
                      className={`mt-1 p-2 rounded text-xs whitespace-pre-wrap ${
                        isDark
                          ? "bg-gray-600 text-gray-200"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {message.thinking}
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.type === "user"
                    ? "text-blue-200"
                    : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isDark
                  ? "bg-gray-700 text-gray-100"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">
                  Analyzing your data...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={`p-4 border-t ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about crime trends, patterns, or analysis..."
            className={`flex-1 px-3 py-2 border rounded-md resize-none ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              !inputMessage.trim() || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        <div
          className={`mt-2 text-xs ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <p>
            💡 Try asking: "What's the trend in crime rates?" or "When do most
            crimes happen?"
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
