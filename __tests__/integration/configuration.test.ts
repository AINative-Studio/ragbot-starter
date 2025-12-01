/**
 * Integration Test: Configuration & State Management
 *
 * Tests configuration flow and state persistence:
 * - Opening and closing Configure modal
 * - Changing LLM models
 * - Changing similarity metrics
 * - Saving configuration
 * - localStorage persistence
 * - Configuration propagation to API calls
 * - Model migration (e.g., GPT to Llama)
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Configuration & State Management Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set initial defaults
    localStorage.setItem('useRag', 'true');
    localStorage.setItem('llm', 'Llama-4-Maverick-17B-128E-Instruct-FP8');
    localStorage.setItem('similarityMetric', 'cosine');
  });

  describe('Configure Modal Interaction', () => {
    it('should open Configure modal when settings button is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Find and click settings button (SVG path for settings icon)
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );

      expect(settingsButton).toBeInTheDocument();
      await user.click(settingsButton!);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/llm/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/similarity metric/i)).toBeInTheDocument();
      });
    });

    it('should close Configure modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Open modal
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText(/configure/i)).not.toBeInTheDocument();
      });
    });

    it('should close Configure modal when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Open modal
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Click X button
      const closeButton = screen.getByRole('button', { name: '' }).closest('button');
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find((btn) => btn.textContent === '×');

      await user.click(xButton!);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText(/configure/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('LLM Model Configuration', () => {
    it('should change LLM model and persist to localStorage', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Open modal
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Change LLM model
      const llmSelect = screen.getByLabelText(/llm/i);
      await user.selectOptions(llmSelect, 'Llama3.3-70B-Instruct');

      // Save configuration
      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      // Verify localStorage updated
      await waitFor(() => {
        expect(localStorage.getItem('llm')).toBe('Llama3.3-70B-Instruct');
      });
    });

    it('should send new LLM model to Meta Llama API', async () => {
      let capturedRequest: any = null;

      server.use(
        http.post('https://api.llama.com/compat/v1/chat/completions', async ({ request }) => {
          capturedRequest = await request.json();
          return HttpResponse.json({
            id: 'test',
            object: 'chat.completion',
            created: Date.now(),
            model: capturedRequest.model,
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Test response' },
                finish_reason: 'stop',
              },
            ],
          });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      // Change model
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const llmSelect = screen.getByLabelText(/llm/i);
      await user.selectOptions(llmSelect, 'Llama3.1-405B-Instruct');

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      // Send a message
      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test with new model');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Verify API received correct model
      await waitFor(() => {
        expect(capturedRequest).toBeTruthy();
        expect(capturedRequest.model).toBe('Llama3.1-405B-Instruct');
      });
    });

    it('should migrate from invalid model to default Llama model', async () => {
      // Set an old/invalid model (like GPT)
      localStorage.setItem('llm', 'gpt-3.5-turbo');

      render(<Home />);

      // useConfiguration hook should auto-migrate
      await waitFor(() => {
        const migratedModel = localStorage.getItem('llm');
        expect(migratedModel).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
      });
    });

    it('should display all available Llama models in dropdown', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const llmSelect = screen.getByLabelText(/llm/i);
      const options = within(llmSelect).getAllByRole('option');

      expect(options.length).toBe(3);
      expect(options[0]).toHaveValue('Llama-4-Maverick-17B-128E-Instruct-FP8');
      expect(options[1]).toHaveValue('Llama3.3-70B-Instruct');
      expect(options[2]).toHaveValue('Llama3.1-405B-Instruct');
    });
  });

  describe('Similarity Metric Configuration', () => {
    it('should change similarity metric and persist to localStorage', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Change similarity metric
      const metricSelect = screen.getByLabelText(/similarity metric/i);
      await user.selectOptions(metricSelect, 'euclidean');

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(localStorage.getItem('similarityMetric')).toBe('euclidean');
      });
    });

    it('should send correct similarity metric to ZeroDB', async () => {
      let capturedSearchRequest: any = null;

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async ({ request }) => {
          capturedSearchRequest = await request.json();
          return HttpResponse.json({
            results: [],
            total: 0,
            processing_time_ms: 20,
          });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      // Change to dot_product
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const metricSelect = screen.getByLabelText(/similarity metric/i);
      await user.selectOptions(metricSelect, 'dot_product');

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      // Send query
      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test metric');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(capturedSearchRequest).toBeTruthy();
        expect(capturedSearchRequest.filter_metadata.similarity_metric).toBe('dot_product');
      });
    });

    it('should display all similarity metric options', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const metricSelect = screen.getByLabelText(/similarity metric/i);
      const options = within(metricSelect).getAllByRole('option');

      expect(options.length).toBe(3);
      expect(options[0]).toHaveValue('cosine');
      expect(options[1]).toHaveValue('euclidean');
      expect(options[2]).toHaveValue('dot_product');
    });
  });

  describe('RAG Toggle Configuration', () => {
    it('should toggle RAG on/off and persist to localStorage', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Find RAG toggle
      const ragToggle = screen.getByLabelText(/enable vector content/i);
      expect(ragToggle).toBeChecked(); // Default is true

      // Toggle off
      await user.click(ragToggle);
      expect(ragToggle).not.toBeChecked();

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(localStorage.getItem('useRag')).toBe('false');
      });
    });

    it('should not call ZeroDB when RAG is disabled', async () => {
      let zerodbCalled = false;

      server.use(
        http.post('https://api.ainative.studio/v1/public/:projectId/embeddings/search', async () => {
          zerodbCalled = true;
          return HttpResponse.json({ results: [], total: 0, processing_time_ms: 0 });
        })
      );

      const user = userEvent.setup();
      render(<Home />);

      // Disable RAG
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const ragToggle = screen.getByLabelText(/enable vector content/i);
      await user.click(ragToggle);

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      // Send message
      const input = screen.getByPlaceholderText(/send a message/i);
      await user.type(input, 'Test without RAG');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(zerodbCalled).toBe(false);
    });
  });

  describe('Configuration Persistence', () => {
    it('should load configuration from localStorage on mount', async () => {
      localStorage.setItem('useRag', 'false');
      localStorage.setItem('llm', 'Llama3.3-70B-Instruct');
      localStorage.setItem('similarityMetric', 'euclidean');

      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Verify loaded values
      const ragToggle = screen.getByLabelText(/enable vector content/i);
      expect(ragToggle).not.toBeChecked();

      const llmSelect = screen.getByLabelText(/llm/i);
      expect(llmSelect).toHaveValue('Llama3.3-70B-Instruct');

      const metricSelect = screen.getByLabelText(/similarity metric/i);
      expect(metricSelect).toHaveValue('euclidean');
    });

    it('should persist configuration across page renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Home />);

      // Change configuration
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const llmSelect = screen.getByLabelText(/llm/i);
      await user.selectOptions(llmSelect, 'Llama3.1-405B-Instruct');

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      // Re-render component (simulates navigation)
      rerender(<Home />);

      // Open modal again
      const settingsButton2 = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton2!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Verify persisted value
      const llmSelect2 = screen.getByLabelText(/llm/i);
      expect(llmSelect2).toHaveValue('Llama3.1-405B-Instruct');
    });

    it('should handle concurrent configuration changes', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Change multiple settings rapidly
      const llmSelect = screen.getByLabelText(/llm/i);
      const metricSelect = screen.getByLabelText(/similarity metric/i);
      const ragToggle = screen.getByLabelText(/enable vector content/i);

      await user.selectOptions(llmSelect, 'Llama3.3-70B-Instruct');
      await user.selectOptions(metricSelect, 'euclidean');
      await user.click(ragToggle);

      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(localStorage.getItem('llm')).toBe('Llama3.3-70B-Instruct');
        expect(localStorage.getItem('similarityMetric')).toBe('euclidean');
        expect(localStorage.getItem('useRag')).toBe('false');
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should prevent invalid LLM model selection', async () => {
      // Try to set invalid model directly
      localStorage.setItem('llm', 'invalid-model-name');

      render(<Home />);

      // Should auto-correct to default
      await waitFor(() => {
        expect(localStorage.getItem('llm')).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
      });
    });

    it('should handle malformed useRag values', async () => {
      localStorage.setItem('useRag', 'maybe'); // Invalid boolean

      render(<Home />);

      // Should default to true
      const user = userEvent.setup();
      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const ragToggle = screen.getByLabelText(/enable vector content/i);
      // Should handle gracefully (either true or false, not crash)
      expect(ragToggle).toBeInTheDocument();
    });
  });

  describe('Configuration UI/UX', () => {
    it('should show current configuration values in modal', async () => {
      localStorage.setItem('llm', 'Llama3.3-70B-Instruct');
      localStorage.setItem('similarityMetric', 'dot_product');
      localStorage.setItem('useRag', 'true');

      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      // Verify UI reflects current state
      expect(screen.getByLabelText(/llm/i)).toHaveValue('Llama3.3-70B-Instruct');
      expect(screen.getByLabelText(/similarity metric/i)).toHaveValue('dot_product');
      expect(screen.getByLabelText(/enable vector content/i)).toBeChecked();
    });

    it('should not persist changes if Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const settingsButton = screen.getAllByRole('button').find((btn) =>
        btn.innerHTML.includes('M19.14')
      );
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText(/configure/i)).toBeInTheDocument();
      });

      const originalLlm = localStorage.getItem('llm');

      // Change LLM
      const llmSelect = screen.getByLabelText(/llm/i);
      await user.selectOptions(llmSelect, 'Llama3.1-405B-Instruct');

      // Click Cancel instead of Save
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // localStorage should not change
      expect(localStorage.getItem('llm')).toBe(originalLlm);
    });
  });
});
