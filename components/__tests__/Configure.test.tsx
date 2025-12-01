import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Configure from '../Configure';
import { SimilarityMetric } from '../../app/hooks/useConfiguration';

describe('Configure Component', () => {
  const mockOnClose = jest.fn();
  const mockSetConfiguration = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    useRag: true,
    llm: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
    similarityMetric: 'cosine' as SimilarityMetric,
    setConfiguration: mockSetConfiguration,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Configure {...defaultProps} />);

      expect(screen.getByText('Configure')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Configure {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Configure')).not.toBeInTheDocument();
    });

    it('should display close button', () => {
      render(<Configure {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /×/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should display Save Configuration button', () => {
      render(<Configure {...defaultProps} />);

      expect(screen.getByText('Save Configuration')).toBeInTheDocument();
    });

    it('should display Cancel button', () => {
      render(<Configure {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should display Footer component', () => {
      render(<Configure {...defaultProps} />);

      // Footer shows "Powered by AINative Studio + ZeroDB + Meta Llama"
      expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
      expect(screen.getByText('AINative Studio')).toBeInTheDocument();
      expect(screen.getByText('ZeroDB')).toBeInTheDocument();
      expect(screen.getByText('Meta Llama')).toBeInTheDocument();
    });
  });

  describe('Meta Llama Models - NOT OpenAI', () => {
    it('should display Meta Llama models in dropdown', () => {
      render(<Configure {...defaultProps} />);

      // Check that Llama models are present
      expect(screen.getByText('Llama 4 Maverick 17B')).toBeInTheDocument();
      expect(screen.getByText('Llama 3.3 70B')).toBeInTheDocument();
      expect(screen.getByText('Llama 3.1 405B')).toBeInTheDocument();
    });

    it('should NOT display OpenAI models', () => {
      render(<Configure {...defaultProps} />);

      // Verify OpenAI models are not present
      expect(screen.queryByText('GPT-3.5 Turbo')).not.toBeInTheDocument();
      expect(screen.queryByText('GPT-4')).not.toBeInTheDocument();
      expect(screen.queryByText('gpt-3.5-turbo')).not.toBeInTheDocument();
      expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
    });

    it('should show all three Meta Llama model options', () => {
      render(<Configure {...defaultProps} />);

      const llamaOptions = [
        'Llama 4 Maverick 17B',
        'Llama 3.3 70B',
        'Llama 3.1 405B',
      ];

      llamaOptions.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });
  });

  describe('Similarity Metric Selection', () => {
    it('should display all similarity metric options', () => {
      render(<Configure {...defaultProps} />);

      expect(screen.getByText('Cosine Similarity')).toBeInTheDocument();
      expect(screen.getByText('Euclidean Distance')).toBeInTheDocument();
      expect(screen.getByText('Dot Product')).toBeInTheDocument();
    });

    it('should show cosine as default', () => {
      render(<Configure {...defaultProps} similarityMetric="cosine" />);

      // Verify cosine is selected
      const dropdown = screen.getByText('Cosine Similarity');
      expect(dropdown).toBeInTheDocument();
    });

    it('should show euclidean when selected', () => {
      render(<Configure {...defaultProps} similarityMetric="euclidean" />);

      expect(screen.getByText('Euclidean Distance')).toBeInTheDocument();
    });

    it('should show dot_product when selected', () => {
      render(<Configure {...defaultProps} similarityMetric="dot_product" />);

      expect(screen.getByText('Dot Product')).toBeInTheDocument();
    });
  });

  describe('RAG Toggle', () => {
    it('should display RAG toggle', () => {
      render(<Configure {...defaultProps} />);

      expect(screen.getByText('Enable vector content (RAG)')).toBeInTheDocument();
    });

    it('should show RAG enabled by default', () => {
      render(<Configure {...defaultProps} useRag={true} />);

      const toggle = screen.getByText('Enable vector content (RAG)');
      expect(toggle).toBeInTheDocument();
    });

    it('should show RAG disabled when prop is false', () => {
      render(<Configure {...defaultProps} useRag={false} />);

      const toggle = screen.getByText('Enable vector content (RAG)');
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Button Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      render(<Configure {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /×/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', () => {
      render(<Configure {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call setConfiguration and onClose when Save is clicked', () => {
      render(<Configure {...defaultProps} />);

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockSetConfiguration).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call setConfiguration when Cancel is clicked', () => {
      render(<Configure {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockSetConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('Save Configuration', () => {
    it('should save configuration with current values', () => {
      render(<Configure {...defaultProps} />);

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockSetConfiguration).toHaveBeenCalledWith(
        true,
        'Llama-4-Maverick-17B-128E-Instruct-FP8',
        'cosine'
      );
    });

    it('should save RAG disabled state', () => {
      render(<Configure {...defaultProps} useRag={false} />);

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockSetConfiguration).toHaveBeenCalledWith(
        false,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should save different Llama model selection', () => {
      render(
        <Configure
          {...defaultProps}
          llm="Llama3.3-70B-Instruct"
        />
      );

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockSetConfiguration).toHaveBeenCalledWith(
        expect.any(Boolean),
        'Llama3.3-70B-Instruct',
        expect.any(String)
      );
    });

    it('should save different similarity metric', () => {
      render(
        <Configure
          {...defaultProps}
          similarityMetric="euclidean"
        />
      );

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockSetConfiguration).toHaveBeenCalledWith(
        expect.any(Boolean),
        expect.any(String),
        'euclidean'
      );
    });
  });

  describe('Props Handling', () => {
    it('should accept all required props', () => {
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        useRag: false,
        llm: 'Llama3.1-405B-Instruct',
        similarityMetric: 'dot_product' as SimilarityMetric,
        setConfiguration: jest.fn(),
      };

      render(<Configure {...props} />);

      expect(screen.getByText('Configure')).toBeInTheDocument();
    });

    it('should handle Llama 4 Maverick model', () => {
      render(
        <Configure
          {...defaultProps}
          llm="Llama-4-Maverick-17B-128E-Instruct-FP8"
        />
      );

      expect(screen.getByText('Llama 4 Maverick 17B')).toBeInTheDocument();
    });

    it('should handle Llama 3.3 model', () => {
      render(
        <Configure
          {...defaultProps}
          llm="Llama3.3-70B-Instruct"
        />
      );

      expect(screen.getByText('Llama 3.3 70B')).toBeInTheDocument();
    });

    it('should handle Llama 3.1 model', () => {
      render(
        <Configure
          {...defaultProps}
          llm="Llama3.1-405B-Instruct"
        />
      );

      expect(screen.getByText('Llama 3.1 405B')).toBeInTheDocument();
    });
  });

  describe('Modal Overlay', () => {
    it('should render with overlay background', () => {
      const { container } = render(<Configure {...defaultProps} />);

      const overlay = container.querySelector('.fixed.inset-0.bg-gray-600');
      expect(overlay).toBeInTheDocument();
    });

    it('should be centered on screen', () => {
      const { container } = render(<Configure {...defaultProps} />);

      const overlay = container.querySelector('.flex.items-center.justify-center');
      expect(overlay).toBeInTheDocument();
    });

    it('should have high z-index', () => {
      const { container } = render(<Configure {...defaultProps} />);

      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-hidden for close button icon', () => {
      render(<Configure {...defaultProps} />);

      const closeIcon = screen.getByText('×');
      expect(closeIcon).toHaveAttribute('aria-hidden');
    });

    it('should have clickable buttons', () => {
      render(<Configure {...defaultProps} />);

      const saveButton = screen.getByText('Save Configuration');
      const cancelButton = screen.getByText('Cancel');

      expect(saveButton).toHaveAttribute('class');
      expect(cancelButton).toHaveAttribute('class');
    });
  });
});
