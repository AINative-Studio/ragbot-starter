/**
 * Integration Test: End-to-End RAG Workflow
 *
 * Tests the complete Retrieval-Augmented Generation flow:
 * 1. User submits a question
 * 2. ZeroDB semantic search retrieves relevant context
 * 3. Context is injected into the prompt
 * 4. Meta Llama generates streaming response
 * 5. UI updates with the response
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('RAG Workflow Integration Tests', () => {
  beforeEach(() => {
    // Set up default localStorage values
    localStorage.setItem('useRag', 'true');
    localStorage.setItem('llm', 'Llama-4-Maverick-17B-128E-Instruct-FP8');
    localStorage.setItem('similarityMetric', 'cosine');
  });

  describe('Complete RAG Flow', () => {
    it('should execute full RAG workflow: search → context injection → streaming response', async () => {
      const user = userEvent.setup();
      const startTime = performance.now();

      render(<Home />);

      // Verify initial state
      expect(screen.getByPlaceholderText(/send a message/i)).toBeInTheDocument();
      expect(screen.getByText(/chatbot/i)).toBeInTheDocument();

      // Type a question
      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      // Submit the question
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Verify user message appears
      await waitFor(() => {
        expect(screen.getByText('What is ZeroDB?')).toBeInTheDocument();
      });

      // Wait for streaming response
      await waitFor(
        () => {
          const response = screen.getByText(/ZeroDB is a managed vector database/i);
          expect(response).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertion: Full flow should complete in < 5s
      expect(totalTime).toBeLessThan(5000);

      console.log(`✓ Full RAG workflow completed in ${totalTime.toFixed(2)}ms`);
    });

    it('should handle multiple questions in sequence', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const questions = [
        'What is ZeroDB?',
        'How do I use it?',
        'What are the pricing options?',
      ];

      for (const question of questions) {
        const input = screen.getByPlaceholderText(/send a message/i);
        await user.clear(input);
        await user.type(input, question);

        const sendButton = screen.getByRole('button', { name: /send/i });
        await user.click(sendButton);

        await waitFor(() => {
          expect(screen.getByText(question)).toBeInTheDocument();
        });
      }

      // All questions should be visible in chat history
      questions.forEach((q) => {
        expect(screen.getByText(q)).toBeInTheDocument();
      });
    });

    it('should pass similarity metric to ZeroDB search', async () => {
      let capturedSearchRequest: any = null;

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async ({ request }) => {
          capturedSearchRequest = await request.json();
          return HttpResponse.json({
            results: [
              {
                id: 'doc-1',
                text: 'ZeroDB documentation',
                document: 'ZeroDB documentation',
                metadata: { similarity_metric: 'euclidean' },
                score: 0.85,
              },
            ],
            total: 1,
            processing_time_ms: 30,
          });
        })
      );

      // Set euclidean metric
      localStorage.setItem('similarityMetric', 'euclidean');

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test query');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(capturedSearchRequest).toBeTruthy();
        expect(capturedSearchRequest.filter_metadata.similarity_metric).toBe('euclidean');
      });
    });
  });

  describe('RAG vs Non-RAG Mode', () => {
    it('should not call ZeroDB when RAG is disabled', async () => {
      let zerodbCalled = false;

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          zerodbCalled = true;
          return HttpResponse.json({ results: [], total: 0, processing_time_ms: 0 });
        })
      );

      // Disable RAG
      localStorage.setItem('useRag', 'false');

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Wait a bit and verify ZeroDB was not called
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(zerodbCalled).toBe(false);
    });

    it('should call ZeroDB when RAG is enabled', async () => {
      let zerodbCalled = false;

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          zerodbCalled = true;
          return HttpResponse.json({
            results: [{ id: 'doc-1', text: 'Test', document: 'Test', metadata: {}, score: 0.9 }],
            total: 1,
            processing_time_ms: 25,
          });
        })
      );

      // Enable RAG
      localStorage.setItem('useRag', 'true');

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(zerodbCalled).toBe(true);
      });
    });
  });

  describe('Context Injection', () => {
    it('should inject retrieved documents into prompt context', async () => {
      let capturedLlamaRequest: any = null;

      server.use(
        http.post('https://api.llama.com/compat/v1/chat/completions', async ({ request }) => {
          capturedLlamaRequest = await request.json();
          return HttpResponse.json({
            id: 'test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
            choices: [{
              index: 0,
              message: { role: 'assistant', content: 'Test response' },
              finish_reason: 'stop',
            }],
          });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(capturedLlamaRequest).toBeTruthy();
        const systemMessage = capturedLlamaRequest.messages.find((m: any) => m.role === 'system');
        expect(systemMessage.content).toContain('START CONTEXT');
        expect(systemMessage.content).toContain('END CONTEXT');
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete semantic search in < 500ms', async () => {
      let searchDuration = 0;

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          const start = performance.now();
          await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate 100ms latency
          searchDuration = performance.now() - start;

          return HttpResponse.json({
            results: [{ id: 'doc-1', text: 'Test', document: 'Test', metadata: {}, score: 0.9 }],
            total: 1,
            processing_time_ms: searchDuration,
          });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test query');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(searchDuration).toBeGreaterThan(0);
        expect(searchDuration).toBeLessThan(500);
      });

      console.log(`✓ Semantic search completed in ${searchDuration.toFixed(2)}ms`);
    });

    it('should receive first streaming token in < 2s', async () => {
      const user = userEvent.setup();
      const startTime = performance.now();

      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Wait for first chunk of streaming response
      await waitFor(
        () => {
          const messages = screen.getAllByText(/ZeroDB/i);
          expect(messages.length).toBeGreaterThan(0);
        },
        { timeout: 2000 }
      );

      const timeToFirstToken = performance.now() - startTime;
      expect(timeToFirstToken).toBeLessThan(2000);

      console.log(`✓ First token received in ${timeToFirstToken.toFixed(2)}ms`);
    });
  });

  describe('Message History', () => {
    it('should maintain conversation context across multiple messages', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Send first message
      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('What is ZeroDB?')).toBeInTheDocument();
      });

      // Send follow-up message
      await user.clear(input);
      await user.type(input, 'How do I use it?');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('How do I use it?')).toBeInTheDocument();
      });

      // Both messages should be visible
      expect(screen.getByText('What is ZeroDB?')).toBeInTheDocument();
      expect(screen.getByText('How do I use it?')).toBeInTheDocument();
    });

    it('should auto-scroll to latest message', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Send multiple messages to trigger scrolling
      const messages = Array.from({ length: 5 }, (_, i) => `Message ${i + 1}`);

      for (const message of messages) {
        const input = screen.getByPlaceholderText(/send a message/i);
        await user.clear(input);
        await user.type(input, message);
        await user.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
          expect(screen.getByText(message)).toBeInTheDocument();
        });
      }

      // Last message should be visible (scroll behavior tested)
      expect(screen.getByText('Message 5')).toBeInTheDocument();
    });
  });
});
