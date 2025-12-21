"use client";
import {useEffect, useRef, useState} from 'react';
import Bubble from '../components/Bubble'
import { useChat, Message } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import Sidebar from '../components/Sidebar';
import useConfiguration from './hooks/useConfiguration';
import useConversations from './hooks/useConversations';


export default function Home() {
  const { append, messages, input, handleInputChange, handleSubmit, setMessages } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();
  const {
    currentConversationId,
    createNewConversation,
    updateConversation,
    loadConversation,
    deleteConversation,
    getRecentConversations,
  } = useConversations();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      updateConversation(currentConversationId, messages);
    }
  }, [messages, currentConversationId]);

  // Create initial conversation if none exists
  useEffect(() => {
    if (!currentConversationId) {
      createNewConversation();
    }
  }, []);

  const handleNewConversation = () => {
    createNewConversation();
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleLoadConversation = async (conversationId: string) => {
    try {
      setLoadingConversation(true);
      console.log('Loading conversation:', conversationId);
      const conversationMessages = await loadConversation(conversationId);
      console.log('Loaded messages:', conversationMessages);

      if (conversationMessages && conversationMessages.length > 0) {
        setMessages(conversationMessages);
        setSidebarOpen(false);
      } else {
        console.warn('No messages found for conversation:', conversationId);
        // Just close sidebar silently - conversation might be new/empty
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setSidebarOpen(false);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(conversationId);
  };

  const handleSend = (e) => {
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric}}});
  }

  const handlePrompt = (promptText) => {
    const msg: Message = { id: crypto.randomUUID(),  content: promptText, role: 'user' };
    append(msg, { options: { body: { useRag, llm, similarityMetric}}});
  };

  return (
    <>
    <main className="flex h-screen overflow-hidden bg-gradient-to-br from-[#EAE6DF] via-white to-[#00A3A1]/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={getRecentConversations()}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        loadingConversation={loadingConversation}
      />

      {/* Main Chat Area */}
      <section className='flex-1 flex flex-col h-screen overflow-hidden'>
        {/* Header with glass morphism */}
        <div className='backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-[#00A3A1]/30 dark:border-slate-700/50 px-4 md:px-6 py-4 shadow-sm'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-3'>
              {/* Menu button for mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className='lg:hidden p-2 rounded-lg backdrop-blur-sm bg-[#F6A135]/10 hover:bg-[#F6A135]/20 border border-[#F6A135]/20 transition-colors'
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" className="text-[#F6A135]">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Transmutes Logo */}
              <div className='flex items-center gap-3'>
                <h1 className="text-2xl font-bold text-[#F6A135]" style={{ fontFamily: 'Bank Gothic, sans-serif', letterSpacing: '0.05em' }}>TRANSMUTES</h1>
              </div>
            </div>
            <div className='flex gap-2'>
              <ThemeButton />
              <button
                onClick={() => setConfigureOpen(true)}
                className='p-2 rounded-lg backdrop-blur-sm bg-[#F6A135]/10 hover:bg-[#F6A135]/20 border border-[#F6A135]/20 transition-all duration-200'
              >
                <svg width="20" height="20" viewBox="0 0 24 25" fill="currentColor" className="text-[#F6A135]">
                  <path d="M19.14 13.4006C19.18 13.1006 19.2 12.7906 19.2 12.4606C19.2 12.1406 19.18 11.8206 19.13 11.5206L21.16 9.94057C21.34 9.80057 21.39 9.53057 21.28 9.33057L19.36 6.01057C19.24 5.79057 18.99 5.72057 18.77 5.79057L16.38 6.75057C15.88 6.37057 15.35 6.05057 14.76 5.81057L14.4 3.27057C14.36 3.03057 14.16 2.86057 13.92 2.86057H10.08C9.83999 2.86057 9.64999 3.03057 9.60999 3.27057L9.24999 5.81057C8.65999 6.05057 8.11999 6.38057 7.62999 6.75057L5.23999 5.79057C5.01999 5.71057 4.76999 5.79057 4.64999 6.01057L2.73999 9.33057C2.61999 9.54057 2.65999 9.80057 2.85999 9.94057L4.88999 11.5206C4.83999 11.8206 4.79999 12.1506 4.79999 12.4606C4.79999 12.7706 4.81999 13.1006 4.86999 13.4006L2.83999 14.9806C2.65999 15.1206 2.60999 15.3906 2.71999 15.5906L4.63999 18.9106C4.75999 19.1306 5.00999 19.2006 5.22999 19.1306L7.61999 18.1706C8.11999 18.5506 8.64999 18.8706 9.23999 19.1106L9.59999 21.6506C9.64999 21.8906 9.83999 22.0606 10.08 22.0606H13.92C14.16 22.0606 14.36 21.8906 14.39 21.6506L14.75 19.1106C15.34 18.8706 15.88 18.5506 16.37 18.1706L18.76 19.1306C18.98 19.2106 19.23 19.1306 19.35 18.9106L21.27 15.5906C21.39 15.3706 21.34 15.1206 21.15 14.9806L19.14 13.4006ZM12 16.0606C10.02 16.0606 8.39999 14.4406 8.39999 12.4606C8.39999 10.4806 10.02 8.86057 12 8.86057C13.98 8.86057 15.6 10.4806 15.6 12.4606C15.6 14.4406 13.98 16.0606 12 16.0606Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Messages Area with improved spacing */}
        <div className='flex-1 overflow-y-auto px-4 md:px-6 py-6'>
          <div className='max-w-4xl mx-auto space-y-6'>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full py-12'>
                <h2 className='text-3xl font-semibold text-[#F6A135] dark:text-[#F6A135] mb-3'>Welcome to Transmutes Wisdom</h2>
                <p className='text-gray-700 dark:text-gray-400 text-center max-w-md'>Explore ancient teachings from enlightened masters. Ask about consciousness, meditation, self-inquiry, and the nature of reality.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} />
              ))
            )}
          </div>
        </div>

        {/* Input Area with glass morphism */}
        <div className='backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-t border-[#00A3A1]/30 dark:border-slate-700/50 px-4 md:px-6 py-4 shadow-inner'>
          <div className='max-w-4xl mx-auto'>
            {/* Prompt Suggestions */}
            <PromptSuggestionRow onPromptClick={handlePrompt} />

            {/* Input Form */}
            <form className='flex gap-3 mt-3' onSubmit={handleSend}>
              <div className='flex-1 relative'>
                <input
                  onChange={handleInputChange}
                  value={input}
                  className='w-full px-4 py-3 rounded-xl backdrop-blur-sm bg-white dark:bg-slate-800 border-2 border-[#F6A135]/30 dark:border-[#F6A135]/30 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#F6A135] dark:focus:ring-[#F6A135] focus:border-[#F6A135] dark:focus:border-[#F6A135] shadow-lg transition-all duration-200'
                  placeholder='Ask about consciousness, meditation, or wisdom teachings...'
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className='px-5 py-3 rounded-xl backdrop-blur-xl bg-[#F6A135]/90 hover:bg-[#F6A135] text-white font-medium shadow-lg shadow-[#F6A135]/30 hover:shadow-xl hover:shadow-[#F6A135]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 border border-[#F6A135]/20'
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
                </svg>
                <span className='hidden sm:block'>Send</span>
              </button>
            </form>
            <Footer />
          </div>
        </div>
      </section>
    </main>
    <Configure
      isOpen={configureOpen}
      onClose={() => setConfigureOpen(false)}
      useRag={useRag}
      llm={llm}
      similarityMetric={similarityMetric}
      setConfiguration={setConfiguration}
    />
    </>
  )
}