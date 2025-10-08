import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import HourlyChart from "./charts/HourlyChart";
import MonthlyChart from "./charts/MonthlyChart";
import CrimeTypesChart from "./charts/CrimeTypesChart";
import YearOverYearChart from "./charts/YearOverYearChart";
import CityInfoChart from "./charts/CityInfoChart";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ChatInterface = ({ filters }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content: t("chat_greeting"),
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

      // Parse chart suggestions from response
      const chartSuggestion = parseChartSuggestion(data.response);

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: data.response || t("chat_error_generic"),
        thinking: data.thinking,
        timestamp: new Date(),
        error: data.error,
        chartSuggestion: chartSuggestion,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: t("chat_error_processing"),
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseChartSuggestion = (responseText) => {
    const chartMatch = responseText?.match(/\[CHART:(\w+)\]/);
    return chartMatch ? chartMatch[1] : null;
  };

  const renderChart = (chartType) => {
    if (!chartType) return null;

    const commonProps = {
      className: "mt-4 max-w-full",
      height: 300,
    };

    switch (chartType) {
      case "hourly_chart":
        return <HourlyChart {...commonProps} />;
      case "monthly_chart":
        return <MonthlyChart {...commonProps} />;
      case "crime_types_chart":
        return <CrimeTypesChart {...commonProps} />;
      case "year_over_year_chart":
        return <YearOverYearChart {...commonProps} />;
      case "city_chart":
        return <CityInfoChart {...commonProps} />;
      default:
        return null;
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
          {t("ai_assistant")}
        </h2>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {t("chat_tagline")}
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
                    <span>{t("thinking_process")}</span>
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
              <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content?.replace(/\[CHART:\w+\]/, "") ||
                    message.content}
                </ReactMarkdown>
              </div>

              {/* Render chart if suggested */}
              {message.chartSuggestion && message.type === "assistant" && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <p className="text-xs mb-2 text-gray-600 dark:text-gray-300">
                    📊 {t("suggested_visualization")}:
                  </p>
                  {renderChart(message.chartSuggestion)}
                </div>
              )}

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
                  {t("analyzing_your_data")}...
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
            placeholder={t("chat_placeholder")}
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
            {isLoading ? "..." : t("send")}
          </button>
        </div>

        <div
          className={`mt-2 text-xs ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <p>💡 {t("chat_tip")}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
