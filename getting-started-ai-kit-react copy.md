# Getting Started with AI Kit for React

A quick guide to install and start building AI-powered React components.

---

## Installation

```bash
npm install @ainative/ai-kit
```

or with pnpm/yarn:

```bash
pnpm add @ainative/ai-kit
# or
yarn add @ainative/ai-kit
```

---

## Basic Usage

```tsx
import { useChat, useStreamingText } from '@ainative/ai-kit'

function ChatComponent() {
  const { messages, sendMessage, isStreaming } = useChat({
    endpoint: '/api/chat'
  })

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

---

## Claude Code Seed Prompt

Copy and paste this prompt when starting a new Claude Code session to get AI Kit integration help:

```
I'm building a React application and want to integrate AI Kit (@ainative/ai-kit) for AI-powered UI components.

**Project Context:**
- Using React 18+
- Want to add chat/AI features using AI Kit
- Package already installed: @ainative/ai-kit

**AI Kit Package Info:**
- npm: @ainative/ai-kit
- GitHub: https://github.com/AINative-Studio/ai-kit
- Source code location: packages/react/src

**What AI Kit provides:**
- useChat hook for chat interfaces
- useStreamingText for streaming responses
- useAgent for agent interactions
- ChatMessage component for rendering messages
- Markdown rendering with syntax highlighting (react-markdown, react-syntax-highlighter)

**Please help me:**
1. Explore the AI Kit React package source code to understand available hooks and components
2. Implement [DESCRIBE YOUR FEATURE] using AI Kit
3. Follow the patterns used in the demo-app at examples/demo-app

Start by reading the AI Kit React package source at packages/react/src to understand the available exports and their usage patterns.
```

---

## Quick Examples

### Chat Interface
```tsx
import { useChat } from '@ainative/ai-kit'

function Chat() {
  const { messages, sendMessage, isStreaming, error } = useChat({
    endpoint: '/api/chat',
    onError: (err) => console.error(err)
  })

  const handleSubmit = (text: string) => {
    sendMessage({ content: text, role: 'user' })
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
        {isStreaming && <div className="typing-indicator">AI is typing...</div>}
      </div>
      <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
    </div>
  )
}
```

### Streaming Text
```tsx
import { useStreamingText } from '@ainative/ai-kit'

function StreamingDemo() {
  const { text, isStreaming, start, stop } = useStreamingText()

  return (
    <div>
      <button onClick={() => start('/api/generate')}>Generate</button>
      <button onClick={stop} disabled={!isStreaming}>Stop</button>
      <p>{text}</p>
    </div>
  )
}
```

---

## Project Structure Reference

```
your-app/
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Chat interface using useChat
│   │   ├── AgentPanel.tsx    # Agent UI using useAgent
│   │   └── AIInput.tsx       # Input component
│   ├── hooks/
│   │   └── useAIFeatures.ts  # Custom hooks wrapping AI Kit
│   └── App.tsx
├── package.json
└── vite.config.ts
```

---

## Links

- **npm:** https://www.npmjs.com/package/@ainative/ai-kit
- **GitHub:** https://github.com/AINative-Studio/ai-kit
- **Demo App:** See `examples/demo-app` in the repo

---

## Need Help?

When using Claude Code, point it to the source:

```
Read the AI Kit React source at packages/react/src to help me implement [your feature]
```

Claude Code will explore the actual implementation and help you build with the correct patterns.
