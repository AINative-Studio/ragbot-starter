"use client";
import Link from "next/link";
import { forwardRef, JSXElementConstructor, RefObject, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Bubble: JSXElementConstructor<any> = forwardRef(function Bubble({ content }, ref) {
  const { role } = content;
  const isUser = role === "user";
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);

  // Parse content to extract sources
  const parseContentAndSources = (rawContent: string) => {
    if (!rawContent) return { content: '', sources: [] };

    const sourcesDelimiter = '___SOURCES___';
    const parts = rawContent.split(sourcesDelimiter);

    if (parts.length > 1) {
      try {
        const sources = JSON.parse(parts[1].trim());
        return { content: parts[0].trim(), sources };
      } catch (e) {
        console.error('Failed to parse sources:', e);
        return { content: rawContent, sources: [] };
      }
    }

    return { content: rawContent, sources: [] };
  };

  const { content: messageContent, sources } = parseContentAndSources(content?.content || '');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyMessageToClipboard = () => {
    navigator.clipboard.writeText(content?.content || '');
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleStarRating = async (stars: number) => {
    setRating(stars);
    setShowFeedbackToast(true);

    // Send feedback to ZeroDB RLHF API
    try {
      await fetch('/api/rlhf-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: stars,
          messageContent: content.content,
          messageId: content.id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send RLHF feedback:', error);
    }

    // Hide toast after 2 seconds
    setTimeout(() => setShowFeedbackToast(false), 2000);
  };

  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={`flex w-full mb-6 animate-fadeIn ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar with glass morphism */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-teal-500/30 ring-2 ring-teal-400/20">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/20 animate-pulse-subtle">
              <svg width="18" height="18" viewBox="0 0 24 25" fill="currentColor">
                <path d="M12 2.96057C10.34 2.96057 9 4.30057 9 5.96057H15C15 4.30057 13.66 2.96057 12 2.96057ZM20 9.96057V7.96057C20 6.86057 19.1 5.96057 18 5.96057H15C15 4.30057 13.66 2.96057 12 2.96057C10.34 2.96057 9 4.30057 9 5.96057H6C4.9 5.96057 4 6.86057 4 7.96057V9.96057C2.34 9.96057 1 11.3006 1 12.9606C1 14.6206 2.34 15.9606 4 15.9606V19.9606C4 21.0606 4.9 21.9606 6 21.9606H18C19.1 21.9606 20 21.0606 20 19.9606V15.9606C21.66 15.9606 23 14.6206 23 12.9606C23 11.3006 21.66 9.96057 20 9.96057Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Message Content with glass morphism */}
        <div className="flex flex-col gap-3 flex-1">
          <div
            className={`rounded-2xl px-5 py-4 transition-all duration-300 ${
              isUser
                ? 'backdrop-blur-xl bg-gradient-to-br from-[#F6A135] to-[#F6A135]/80 text-gray-900 shadow-lg shadow-[#F6A135]/30 border border-[#F6A135]/20'
                : 'bg-white border-2 border-emerald-200 shadow-xl text-gray-900'
            }`}
          >
            {content.processing ? (
              <div className="flex flex-col gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Seeking wisdom...</span>
                </div>
                {/* Shimmer effect */}
                <div className="space-y-2">
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded animate-shimmer w-3/4"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded animate-shimmer w-full"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded animate-shimmer w-2/3"></div>
                </div>
              </div>
            ) : (
              <div className={`prose prose-sm max-w-none ${isUser ? '' : 'chatbot-prose'}`}>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

                      return !inline && match ? (
                        <div className="relative group my-4 rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-700/50 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl">
                          {/* Language Label & Copy Button */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-xs text-gray-300 font-mono uppercase font-semibold tracking-wide">
                                {match[1]}
                              </span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(codeString, codeId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-emerald-600 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                              title="Copy code"
                            >
                              {copiedCode === codeId ? (
                                <>
                                  <svg className="w-4 h-4 animate-scaleIn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          {/* Code Block */}
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="!mt-0 !rounded-none"
                            showLineNumbers
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code
                          className={`${
                            isUser
                              ? 'bg-gray-800 text-gray-100'
                              : 'bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400'
                          } px-1.5 py-0.5 rounded text-sm font-mono`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="ml-2">{children}</li>;
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${
                            isUser
                              ? 'text-gray-800 hover:text-black underline font-semibold'
                              : 'text-blue-600 hover:text-blue-700 underline'
                          }`}
                        >
                          {children}
                        </a>
                      );
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className={`border-l-4 pl-4 my-2 italic ${
                          isUser ? 'border-gray-700' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>;
                    },
                  }}
                >
                  {messageContent}
                </Markdown>
              </div>
            )}
          </div>

          {/* Sources Section - Industry Standard */}
          {!isUser && !content.processing && sources.length > 0 && (
            <div className="backdrop-blur-sm bg-gradient-to-br from-[#00A3A1]/5 to-emerald-50/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl px-4 py-3 border border-[#00A3A1]/20 dark:border-slate-600/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#00A3A1] dark:text-emerald-400">
                    <path d="M12 2L3 7V17.5C3 21.08 8.84 23.86 12 24.5C15.16 23.86 21 21.08 21 17.5V7L12 2ZM12 11.99H19C18.47 15.11 15.72 17.78 12 18.4V12H5V8.3L12 4.19V11.99Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#00A3A1] dark:text-emerald-400 uppercase tracking-wider mb-2">
                    Knowledge Sources
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source: string, idx: number) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border border-[#00A3A1]/30 dark:border-emerald-500/30 text-xs text-gray-700 dark:text-gray-200 font-medium hover:bg-[#00A3A1]/10 dark:hover:bg-slate-600/80 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#00A3A1] dark:text-emerald-400 flex-shrink-0">
                          <path d="M21 5C19.89 4.65 18.67 4.5 17.5 4.5C15.55 4.5 13.45 4.9 12 6C10.55 4.9 8.45 4.5 6.5 4.5C4.55 4.5 2.45 4.9 1 6V20.65C1 20.9 1.25 21.15 1.5 21.15C1.6 21.15 1.65 21.1 1.75 21.1C3.1 20.45 5.05 20 6.5 20C8.45 20 10.55 20.4 12 21.5C13.35 20.65 15.8 20 17.5 20C19.15 20 20.85 20.3 22.25 21.05C22.35 21.1 22.4 21.1 22.5 21.1C22.75 21.1 23 20.85 23 20.6V6C22.4 5.55 21.75 5.25 21 5ZM21 18.5C19.9 18.15 18.7 18 17.5 18C15.8 18 13.35 18.65 12 19.5V8C13.35 7.15 15.8 6.5 17.5 6.5C18.7 6.5 19.9 6.65 21 7V18.5Z"/>
                        </svg>
                        <span className="truncate max-w-[200px]">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Star Rating for AI Responses */}
          {!isUser && !content.processing && (
            <div className="backdrop-blur-sm bg-[#F6A135]/5 rounded-xl px-4 py-3 border border-[#F6A135]/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rate this wisdom:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      className="group relative transition-all duration-200 hover:scale-125 active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#F6A135]/50 rounded-full p-1"
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        className={`transition-all duration-300 ${
                          (hoveredStar !== null && star <= hoveredStar) ||
                          (rating !== null && star <= rating)
                            ? 'drop-shadow-[0_0_8px_rgba(246,161,53,0.6)]'
                            : ''
                        }`}
                        fill={
                          (hoveredStar !== null && star <= hoveredStar) ||
                          (rating !== null && star <= rating)
                            ? '#F6A135'
                            : 'none'
                        }
                        stroke={
                          (hoveredStar !== null && star <= hoveredStar) ||
                          (rating !== null && star <= rating)
                            ? '#F6A135'
                            : '#F6A135'
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {/* Sparkle effect on hover */}
                      {hoveredStar === star && !rating && (
                        <span className="absolute inset-0 animate-ping-slow">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="#F6A135"
                            className="opacity-30"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {rating && (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 text-[#F6A135]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-[#F6A135]">
                      {rating} star{rating > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                </div>

                {/* Copy Message Button */}
                <button
                  onClick={copyMessageToClipboard}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm bg-[#F6A135]/10 hover:bg-[#F6A135]/20 transition-all duration-200 hover:scale-105 active:scale-95 border border-[#F6A135]/30"
                  title="Copy message"
                >
                  {copiedMessage ? (
                    <>
                      <svg className="w-4 h-4 text-[#F6A135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-[#F6A135]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-[#F6A135]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-[#F6A135]/70">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Feedback Toast */}
          {showFeedbackToast && (
            <div className="fixed bottom-6 right-6 bg-gradient-to-r from-[#F6A135] to-[#F6A135]/80 text-white px-6 py-4 rounded-xl shadow-2xl shadow-[#F6A135]/50 flex items-center gap-3 animate-slideInRight z-50 backdrop-blur-sm border border-[#F6A135]/20">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-scaleIn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base">Thank you!</span>
                <span className="text-sm opacity-90">Your feedback helps us improve</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Bubble;
