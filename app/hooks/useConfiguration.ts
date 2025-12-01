"use client"

import { useState, useEffect } from 'react';

export type SimilarityMetric = "cosine" | "euclidean" | "dot_product";

// Valid Meta Llama models
const VALID_LLAMA_MODELS = [
  'Llama-4-Maverick-17B-128E-Instruct-FP8',
  'Llama3.3-70B-Instruct',
  'Llama3.1-405B-Instruct'
];

const DEFAULT_LLAMA_MODEL = 'Llama-4-Maverick-17B-128E-Instruct-FP8';

const useConfiguration = () => {
  // Safely get values from localStorage
  const getLocalStorageValue = (key: string, defaultValue: any) => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return storedValue;
      }
    }
    return defaultValue;
  };

  // Validate and migrate LLM model selection
  const getValidatedLlm = () => {
    const storedLlm = getLocalStorageValue('llm', DEFAULT_LLAMA_MODEL);

    // If stored model is not a valid Meta Llama model, migrate to default
    if (!VALID_LLAMA_MODELS.includes(storedLlm)) {
      console.warn(`Invalid model "${storedLlm}" found in localStorage. Migrating to ${DEFAULT_LLAMA_MODEL}`);
      // Update localStorage immediately to prevent repeated warnings
      if (typeof window !== 'undefined') {
        localStorage.setItem('llm', DEFAULT_LLAMA_MODEL);
      }
      return DEFAULT_LLAMA_MODEL;
    }

    return storedLlm;
  };

  const [useRag, setUseRag] = useState<boolean>(() => getLocalStorageValue('useRag', 'true') === 'true');
  const [llm, setLlm] = useState<string>(() => getValidatedLlm());
  const [similarityMetric, setSimilarityMetric] = useState<SimilarityMetric>(
    () => getLocalStorageValue('similarityMetric', 'cosine') as SimilarityMetric
  );

  const setConfiguration = (rag: boolean, llm: string, similarityMetric: SimilarityMetric) => {
    setUseRag(rag);
    setLlm(llm);
    setSimilarityMetric(similarityMetric);
  }

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useRag', JSON.stringify(useRag));
      localStorage.setItem('llm', llm);
      localStorage.setItem('similarityMetric', similarityMetric);
    }
  }, [useRag, llm, similarityMetric]);

  return {
    useRag,
    llm,
    similarityMetric,
    setConfiguration,
  };
}

export default useConfiguration;
