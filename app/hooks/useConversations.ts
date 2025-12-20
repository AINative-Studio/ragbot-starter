import { useState, useEffect } from 'react';
import { Message } from 'ai/react';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
  lastUpdated: number;
}

const STORAGE_KEY = 'transmutes_conversations';
const CURRENT_CONVERSATION_KEY = 'transmutes_current_conversation_id';

export default function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
      } catch (e) {
        console.error('Failed to parse conversations:', e);
      }
    }

    if (currentId) {
      setCurrentConversationId(currentId);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save current conversation ID
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId);
    }
  }, [currentConversationId]);

  const createNewConversation = (): string => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      timestamp: new Date().toLocaleString(),
      lastUpdated: Date.now(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);

    return newId;
  };

  const updateConversation = async (id: string, messages: Message[]) => {
    // Store messages in ZeroDB
    try {
      console.log('Updating conversation in ZeroDB:', id, 'with', messages.length, 'messages');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'store',
          conversationId: id,
          messages,
        }),
      });
      const result = await response.json();
      console.log('ZeroDB store result:', result);
    } catch (error) {
      console.error('Failed to store conversation in ZeroDB:', error);
    }

    // Update conversation metadata in localStorage
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === id) {
          // Generate title from first user message
          const firstUserMessage = messages.find(m => m.role === 'user');
          const title = firstUserMessage
            ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
            : 'New Conversation';

          return {
            ...conv,
            messages: [], // Don't store messages in localStorage anymore
            title,
            lastUpdated: Date.now(),
            timestamp: new Date().toLocaleString(),
          };
        }
        return conv;
      });

      // Sort by last updated
      return updated.sort((a, b) => b.lastUpdated - a.lastUpdated);
    });
  };

  const loadConversation = async (id: string): Promise<Message[] | null> => {
    // Load messages from ZeroDB
    try {
      const response = await fetch(`/api/conversations?conversationId=${id}`);
      const data = await response.json();

      if (data.messages) {
        setCurrentConversationId(id);
        return data.messages;
      }
    } catch (error) {
      console.error('Failed to load conversation from ZeroDB:', error);
    }

    return null;
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const getCurrentConversation = (): Conversation | null => {
    if (!currentConversationId) return null;
    return conversations.find(c => c.id === currentConversationId) || null;
  };

  const getRecentConversations = (limit: number = 10): Conversation[] => {
    return conversations
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, limit);
  };

  return {
    conversations,
    currentConversationId,
    createNewConversation,
    updateConversation,
    loadConversation,
    deleteConversation,
    getCurrentConversation,
    getRecentConversations,
    setCurrentConversationId,
  };
}
