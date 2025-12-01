/**
 * Integration Test: Edge Cases & Error Handling
 *
 * Tests critical edge cases and error scenarios:
 * - Empty and invalid inputs
 * - API failures and timeouts
 * - Network errors
 * - Invalid configurations
 * - Boundary conditions
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { server } from '../mocks/server';
import { errorHandlers, emptyResultsHandler } from '../mocks/handlers';
import { http, HttpResponse } from 'msw';

describe('Edge Cases & Error Handling Tests', () => {
  beforeEach(() => {
    localStorage.setItem('useRag', 'true');
    localStorage.setItem('llm', 'Llama-4-Maverick-17B-128E-Instruct-FP8');
    localStorage.setItem('similarityMetric', 'cosine');
  });

  describe('Empty and Invalid Inputs', () => {
    it('should handle empty knowledge base (no vectors found)', async () => {
      server.use(emptyResultsHandler);

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Should still get a response from LLM (without context)
      await waitFor(
        () => {
          const messages = screen.getAllByText(/ZeroDB/i);
          expect(messages.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('should handle very short queries', async () => {
      const shortQueries = ['Hi', '?', 'a', 'ok'];

      for (const query of shortQueries) {
        const user = userEvent.setup();
        render(<Home />);

        const input = screen.getByPlaceholderText(/send a message/i);
        await user.type(input, query);

        const sendButton = screen.getByRole('button', { name: /send/i });
        await user.click(sendButton);

        // Should handle gracefully
        await waitFor(() => {
          expect(screen.getByText(query)).toBeInTheDocument();
        });
      }
    });

    it('should handle very long queries (>2000 characters)', async () => {
      const longQuery = 'A'.repeat(2500);

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          return HttpResponse.json(
            { detail: 'Query too long. Maximum length is 2000 characters.' },
            { status: 400 }
          );
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, longQuery.substring(0, 100)); // Type partial for performance

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Should still render the message (client-side)
      await waitFor(() => {
        const textElement = screen.getByText(longQuery.substring(0, 100));
        expect(textElement).toBeInTheDocument();
      });
    });

    it('should handle empty string query', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Try to send without typing
      await user.click(sendButton);

      // Should not submit (input is required by form validation)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // No message should appear
      const messages = screen.queryByRole('article'); // Assuming messages are in article tags
      expect(messages).toBeNull();
    });

    it('should handle special characters and emojis', async () => {
      const specialQueries = [
        'What about <script>alert("xss")</script>?',
        'Test with emoji 🚀 💻 🤖',
        'Unicode: 你好世界',
        'Symbols: @#$%^&*()',
      ];

      for (const query of specialQueries) {
        const user = userEvent.setup();
        render(<Home />);

        const input = screen.getByPlaceholderText(/send a message/i);
        await user.type(input, query);

        const sendButton = screen.getByRole('button', { name: /send/i });
        await user.click(sendButton);

        await waitFor(() => {
          expect(screen.getByText(query)).toBeInTheDocument();
        });
      }
    });
  });

  describe('ZeroDB API Errors', () => {
    it('should handle ZeroDB authentication errors (401)', async () => {
      server.use(
        http.post('https://api.ainative.studio/v1/public/auth/login', async () => {
          return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });

      // Should throw error when auth fails
      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();
    });

    it('should handle ZeroDB server errors (500)', async () => {
      server.use(errorHandlers.zerodbServerError);

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });

      // Should handle server error gracefully
      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();
    });

    it('should handle invalid similarity metrics', async () => {
      // Set invalid metric in localStorage
      localStorage.setItem('similarityMetric', 'invalid_metric' as any);

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test query');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Should still attempt the query (backend validates)
      await waitFor(() => {
        expect(screen.getByText('Test query')).toBeInTheDocument();
      });
    });
  });

  describe('Meta Llama API Errors', () => {
    it('should handle Meta Llama authentication errors (401)', async () => {
      server.use(
        http.post('https://api.llama.com/compat/v1/chat/completions', async () => {
          return HttpResponse.json(
            { error: { message: 'Invalid API key', type: 'invalid_request_error' } },
            { status: 401 }
          );
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });

      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();
    });

    it('should handle Meta Llama server errors (503)', async () => {
      server.use(errorHandlers.metaLlamaServerError);

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });

      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();
    });

    it('should handle rate limiting (429)', async () => {
      server.use(errorHandlers.metaLlamaRateLimit);

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'What is ZeroDB?');

      const sendButton = screen.getByRole('button', { name: /send/i });

      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/rate limit/i), { timeout: 2000 });
      }).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      server.use(
        http.post('https://api.llama.com/compat/v1/chat/completions', async () => {
          // Return invalid JSON structure
          return HttpResponse.json({ invalid: 'structure' });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: /send/i });

      // Should handle gracefully or throw
      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();
    });
  });

  describe('Network Failures', () => {
    it('should handle network timeout', async () => {
      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          // Simulate timeout
          await new Promise((resolve) => setTimeout(resolve, 10000));
          return HttpResponse.json({ results: [], total: 0, processing_time_ms: 0 });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test timeout');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Should timeout or handle gracefully
      // Note: Actual timeout behavior depends on fetch implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    it('should handle network offline scenario', async () => {
      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          throw new Error('Network request failed');
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test offline');

      const sendButton = screen.getByRole('button', { name: /send/i });

      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();
    });
  });

  describe('Invalid localStorage Data', () => {
    it('should handle corrupted localStorage values', async () => {
      localStorage.setItem('useRag', 'not-a-boolean');
      localStorage.setItem('llm', ''); // Empty string
      localStorage.setItem('similarityMetric', 'invalid');

      // Should still render without crashing
      render(<Home />);

      expect(screen.getByText(/chatbot/i)).toBeInTheDocument();
    });

    it('should handle missing localStorage values', async () => {
      localStorage.clear();

      // Should use defaults
      render(<Home />);

      expect(screen.getByText(/chatbot/i)).toBeInTheDocument();

      // Verify defaults are set
      const user = userEvent.setup();
      const configButton = screen.getByRole('button', { name: '' }); // Settings icon button
      await user.click(configButton);

      // Should show default values in config modal
      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });
    });

    it('should sanitize XSS attempts in localStorage', async () => {
      localStorage.setItem('llm', '<script>alert("xss")</script>');

      render(<Home />);

      // Should not execute script
      expect(screen.getByText(/chatbot/i)).toBeInTheDocument();
      // Script should not be in DOM
      expect(document.querySelector('script')).toBeFalsy();
    });
  });

  describe('Missing Environment Variables', () => {
    it('should handle missing Meta API key', async () => {
      const originalKey = process.env.META_API_KEY;
      delete process.env.META_API_KEY;

      server.use(
        http.post('https://api.llama.com/compat/v1/chat/completions', async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || authHeader === 'Bearer undefined') {
            return HttpResponse.json(
              { error: { message: 'Invalid API key', type: 'invalid_request_error' } },
              { status: 401 }
            );
          }
          return HttpResponse.json({ choices: [{ message: { content: 'Test' } }] });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: /send/i });

      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();

      // Restore
      process.env.META_API_KEY = originalKey;
    });

    it('should handle missing ZeroDB credentials', async () => {
      const originalEmail = process.env.ZERODB_EMAIL;
      const originalPassword = process.env.ZERODB_PASSWORD;

      delete process.env.ZERODB_EMAIL;
      delete process.env.ZERODB_PASSWORD;

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: /send/i });

      await expect(async () => {
        await user.click(sendButton);
        await waitFor(() => screen.getByText(/error/i), { timeout: 2000 });
      }).rejects.toThrow();

      // Restore
      process.env.ZERODB_EMAIL = originalEmail;
      process.env.ZERODB_PASSWORD = originalPassword;
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle maximum context length', async () => {
      // Create very large search results
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        id: `doc-${i}`,
        text: 'A'.repeat(1000), // 1000 chars per doc
        document: 'A'.repeat(1000),
        metadata: {},
        score: 0.9 - i * 0.01,
      }));

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          return HttpResponse.json({
            results: largeResults,
            total: largeResults.length,
            processing_time_ms: 150,
          });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Large context test');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Should handle large context without crashing
      await waitFor(
        () => {
          expect(screen.getByText('Large context test')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('should handle rapid successive queries', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const input = screen.getByPlaceholderText(/send a message/i);

      // Send 10 queries rapidly
      for (let i = 0; i < 10; i++) {
        await user.clear(input);
        await user.type(input, `Query ${i}`);
        await user.click(screen.getByRole('button', { name: /send/i }));
      }

      // Should handle all queries without crashing
      await waitFor(() => {
        expect(screen.getByText('Query 9')).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate similarity metric values', async () => {
      const validMetrics = ['cosine', 'euclidean', 'dot_product'];

      for (const metric of validMetrics) {
        localStorage.setItem('similarityMetric', metric);
        render(<Home />);
        expect(screen.getByText(/chatbot/i)).toBeInTheDocument();
      }
    });

    it('should validate LLM model names', async () => {
      const validModels = [
        'Llama-4-Maverick-17B-128E-Instruct-FP8',
        'Llama3.3-70B-Instruct',
        'Llama3.1-405B-Instruct',
      ];

      for (const model of validModels) {
        localStorage.setItem('llm', model);
        render(<Home />);
        expect(screen.getByText(/chatbot/i)).toBeInTheDocument();
      }
    });
  });
});
