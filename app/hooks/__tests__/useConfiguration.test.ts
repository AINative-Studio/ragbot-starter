import { renderHook, act } from '@testing-library/react';
import useConfiguration from '../useConfiguration';

describe('useConfiguration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('VALID_LLAMA_MODELS', () => {
    it('should initialize with default Llama model when localStorage is empty', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.llm).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
    });

    it('should accept valid Meta Llama models', () => {
      const validModels = [
        'Llama-4-Maverick-17B-128E-Instruct-FP8',
        'Llama3.3-70B-Instruct',
        'Llama3.1-405B-Instruct'
      ];

      validModels.forEach(model => {
        localStorage.getItem.mockReturnValue(model);
        const { result } = renderHook(() => useConfiguration());
        expect(result.current.llm).toBe(model);
      });
    });
  });

  describe('getValidatedLlm', () => {
    it('should migrate invalid model to default Llama model', () => {
      // Simulate old OpenAI model in localStorage
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'llm') return 'gpt-3.5-turbo';
        if (key === 'useRag') return 'true';
        if (key === 'similarityMetric') return 'cosine';
        return null;
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.llm).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid model "gpt-3.5-turbo"')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'llm',
        'Llama-4-Maverick-17B-128E-Instruct-FP8'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should migrate gpt-4 to default Llama model', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'llm') return 'gpt-4';
        if (key === 'useRag') return 'true';
        if (key === 'similarityMetric') return 'cosine';
        return null;
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.llm).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'llm',
        'Llama-4-Maverick-17B-128E-Instruct-FP8'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not migrate valid Llama model', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'llm') return 'Llama3.3-70B-Instruct';
        if (key === 'useRag') return 'true';
        if (key === 'similarityMetric') return 'cosine';
        return null;
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.llm).toBe('Llama3.3-70B-Instruct');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('setConfiguration', () => {
    it('should update all configuration values', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          false,
          'Llama3.1-405B-Instruct',
          'euclidean'
        );
      });

      expect(result.current.useRag).toBe(false);
      expect(result.current.llm).toBe('Llama3.1-405B-Instruct');
      expect(result.current.similarityMetric).toBe('euclidean');
    });

    it('should update only LLM model', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama3.3-70B-Instruct',
          'cosine'
        );
      });

      expect(result.current.llm).toBe('Llama3.3-70B-Instruct');
    });

    it('should update only similarity metric', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'dot_product'
        );
      });

      expect(result.current.similarityMetric).toBe('dot_product');
    });

    it('should update only RAG setting', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          false,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'cosine'
        );
      });

      expect(result.current.useRag).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist useRag to localStorage', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          false,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'cosine'
        );
      });

      // Wait for useEffect to run
      expect(localStorage.setItem).toHaveBeenCalledWith('useRag', 'false');
    });

    it('should persist llm to localStorage', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama3.3-70B-Instruct',
          'cosine'
        );
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('llm', 'Llama3.3-70B-Instruct');
    });

    it('should persist similarityMetric to localStorage', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'euclidean'
        );
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('similarityMetric', 'euclidean');
    });

    it('should load saved configuration from localStorage', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'useRag') return 'false';
        if (key === 'llm') return 'Llama3.1-405B-Instruct';
        if (key === 'similarityMetric') return 'dot_product';
        return null;
      });

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.useRag).toBe(false);
      expect(result.current.llm).toBe('Llama3.1-405B-Instruct');
      expect(result.current.similarityMetric).toBe('dot_product');
    });
  });

  describe('default values', () => {
    it('should use default values when localStorage is empty', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.useRag).toBe(true);
      expect(result.current.llm).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
      expect(result.current.similarityMetric).toBe('cosine');
    });

    it('should default to cosine similarity metric', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'useRag') return 'true';
        if (key === 'llm') return 'Llama-4-Maverick-17B-128E-Instruct-FP8';
        return null;
      });

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.similarityMetric).toBe('cosine');
    });

    it('should default to RAG enabled', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'llm') return 'Llama-4-Maverick-17B-128E-Instruct-FP8';
        if (key === 'similarityMetric') return 'cosine';
        return null;
      });

      const { result } = renderHook(() => useConfiguration());

      expect(result.current.useRag).toBe(true);
    });
  });

  describe('similarity metric types', () => {
    it('should accept cosine similarity metric', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'cosine'
        );
      });

      expect(result.current.similarityMetric).toBe('cosine');
    });

    it('should accept euclidean similarity metric', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'euclidean'
        );
      });

      expect(result.current.similarityMetric).toBe('euclidean');
    });

    it('should accept dot_product similarity metric', () => {
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setConfiguration(
          true,
          'Llama-4-Maverick-17B-128E-Instruct-FP8',
          'dot_product'
        );
      });

      expect(result.current.similarityMetric).toBe('dot_product');
    });
  });
});
