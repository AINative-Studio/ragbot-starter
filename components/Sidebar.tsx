"use client";

interface Conversation {
  id: string;
  title: string;
  messages: any[];
  timestamp: string;
  lastUpdated: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  loadingConversation?: boolean;
}

const Sidebar = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onNewConversation,
  onLoadConversation,
  onDeleteConversation,
  loadingConversation = false,
}: SidebarProps) => {
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 h-screen z-50 lg:z-auto
          w-[280px] lg:w-[320px]
          transform transition-transform duration-300 ease-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Glass morphism background */}
        <div className="h-full bg-gradient-to-br from-[#EAE6DF]/90 to-white/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border-r border-[#00A3A1]/30 dark:border-slate-700/50 shadow-xl">
          <div className="flex flex-col h-full p-4">
            {/* Header */}
            <div className="flex items-center justify-end mb-6">
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg backdrop-blur-sm bg-[#F6A135]/10 hover:bg-[#F6A135]/20 border border-[#F6A135]/20 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-[#F6A135]">
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={onNewConversation}
              className="w-full mb-6 px-4 py-3 rounded-xl backdrop-blur-xl bg-[#F6A135]/90 hover:bg-[#F6A135] text-white font-medium shadow-lg shadow-[#F6A135]/30 hover:shadow-xl hover:shadow-[#F6A135]/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 border border-[#F6A135]/20"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Conversation
            </button>

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto">
              <div className="mb-3 px-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Conversations</h3>
              </div>
              <div className="space-y-2">
                {loadingConversation && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F6A135]"></div>
                  </div>
                )}
                {conversations.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onLoadConversation(conv.id)}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group backdrop-blur-sm border cursor-pointer ${
                        currentConversationId === conv.id
                          ? 'bg-gradient-to-r from-[#F6A135]/20 to-[#00A3A1]/20 border-[#F6A135]/50 dark:border-[#F6A135]/50'
                          : 'hover:bg-white/80 dark:hover:bg-slate-700/60 border-transparent hover:border-[#00A3A1]/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate transition-colors ${
                            currentConversationId === conv.id
                              ? 'text-[#F6A135] dark:text-[#F6A135]'
                              : 'text-gray-800 dark:text-gray-100 group-hover:text-[#F6A135] dark:group-hover:text-[#F6A135]'
                          }`}>
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getRelativeTime(conv.lastUpdated)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent div click
                            onDeleteConversation(conv.id, e);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded backdrop-blur-sm hover:bg-[#F6A135]/20 border border-[#F6A135]/20"
                          title="Delete conversation"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[#F6A135]">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
