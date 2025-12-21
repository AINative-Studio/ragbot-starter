"use client";
import { useState, useEffect } from "react";
import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({ onPromptClick }) => {
  // Comprehensive pool organized by progression: Foundation → Practice → Deepening
  const allPrompts = [
    // === FOUNDATION: Understanding Core Concepts ===

    // Michael Singer - Core Teachings
    'What did Michael Singer mean by "pain is the price of freedom"?',
    'Explain the cage metaphor - what are the edges of my comfort zone?',
    'What does it mean to "get out of your own way"?',
    'How do I go beyond my psychological limits?',

    // Ramana Maharshi - Self-Inquiry Basics
    'What is self-inquiry and how do I practice it?',
    'What did Ramana Maharshi teach about the I-thought?',
    'How do I find the source of the ego?',
    'What is the difference between the ego and the Self?',

    // Jiddu Krishnamurti - Attention & Awareness
    'What is the difference between attention and inattention?',
    'Why did Krishnamurti say "love is attention"?',
    'How does seeking solutions prevent understanding problems?',
    'What does it mean to live without naming or judging?',

    // Taoist Wisdom - The Way
    'What is the Tao and how do I recognize it?',
    'How do I walk the path of balance and center?',
    'What does it mean to feel for the edges instead of the center?',

    // === PRACTICE: Applying the Teachings ===

    // Letting Go & Surrender
    'How do I practice letting go when facing fear?',
    'What is true surrender versus giving up?',
    'How can I stop trying to control outcomes?',
    'How do I let events flow through me without resistance?',

    // Working with Pain & Discomfort
    'How do I become comfortable with pain passing through me?',
    'What happens when I stop pulling back from discomfort?',
    'How do I face the barrier areas of my thoughts and emotions?',
    'Why is going beyond always at the edge of my comfort zone?',

    // Ego Dissolution
    'How does the ego dissolve in its source?',
    'What did Ramana mean by the ego being like a burnt rope?',
    'How do I keep my aim on the source while thoughts arise?',
    'What is the relationship between the ego and prarabdha?',

    // Living Consciously
    'How do I remain aware of the Self while engaging in activities?',
    'What does it mean to do work without being the doer?',
    'How can I be in the world but not of it?',

    // === DEEPENING: Advanced Understanding ===

    // Cross-Teacher Synthesis
    'How do Ramana and Krishnamurti explain the same truth differently?',
    'What do all teachers say about attachment and desire?',
    'How is self-inquiry related to attention and presence?',
    'What is the connection between surrender and self-inquiry?',

    // Michael Singer - Advanced Concepts
    'How do I reach the other side of inner turmoil?',
    'What happens when I stop building false solidity?',
    'How does the inner force sustain and guide me?',
    'What is the relationship between letting go and spiritual growth?',

    // Ramana Maharshi - Deep Practice
    'What is the difference between sushupti and samadhi?',
    'How does a jnani experience the world differently?',
    'What did Ramana mean by "Be Still and know that I am God"?',
    'How is meditation just my natural state?',

    // Krishnamurti - Liberation
    'How do I break free from psychological dependency?',
    'What is communion and why is fear preventing it?',
    'How do I live without authority and comparison?',
    'Why is the house on fire within, not outside?',

    // Taoist - Living the Way
    'How do I avoid the extremes and stay centered?',
    'What does it mean to be blind in the Tao?',
    'How do I feel the edges without walking into them?',

    // === SPECIFIC INSIGHTS & QUOTES ===

    // Practical Wisdom
    'Why should I "die myself and lose myself, becoming one with love"?',
    'What does "nothing in life is to be feared, only understood" mean?',
    'How can I live as if this were my last week?',
    'What is the relationship between fear, desire, and complications?',

    // Gary Weber & Stillness
    'What does Gary Weber teach about the mind and thoughts?',
    'How do I achieve the state beyond thinking?',

    // Ram Dass & Presence
    'What are Ram Dass\'s teachings on being here now?',
    'How do I stay present with what is happening?',

    // Existential Questions
    'What is consciousness and how do I experience it directly?',
    'How do different teachers describe enlightenment?',
    'What is the nature of the Self that all teachers point to?',
    'How is love related to awareness and attention?',
  ];

  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);

  // Function to get 4 random prompts
  const shufflePrompts = () => {
    const shuffled = [...allPrompts].sort(() => Math.random() - 0.5);
    setDisplayedPrompts(shuffled.slice(0, 4));
  };

  // Initialize with random prompts on mount
  useEffect(() => {
    shufflePrompts();
  }, []);

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-row flex-wrap justify-start items-center gap-2">
        {displayedPrompts.map((prompt, index) => (
          <PromptSuggestionButton
            key={`suggestion-${index}-${prompt.slice(0, 10)}`}
            text={prompt}
            onClick={() => onPromptClick(prompt)}
          />
        ))}
        {/* Enhanced Shuffle Button */}
        <button
          onClick={shufflePrompts}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md bg-gradient-to-r from-[#28A36A] to-[#00A3A1] text-white text-sm font-medium shadow-lg shadow-[#28A36A]/30 hover:shadow-xl hover:shadow-[#28A36A]/40 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#28A36A]/50"
          title="Get new suggestions"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="group-hover:rotate-180 transition-transform duration-500"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span className="font-semibold">More</span>
        </button>
      </div>
    </div>
  );
};

export default PromptSuggestionRow;
