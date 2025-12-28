"use client";
import { useEffect, useState } from 'react';

interface LoadingBubbleProps {
  stages?: string[];
  stageDuration?: number;
}

export default function LoadingBubble({
  stages = [
    "Searching knowledge base...",
    "Processing spiritual teachings...",
    "Generating wisdom..."
  ],
  stageDuration = 2000
}: LoadingBubbleProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (stages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        // Cycle through stages
        return prev < stages.length - 1 ? prev + 1 : prev;
      });
    }, stageDuration);

    return () => clearInterval(interval);
  }, [stages.length, stageDuration]);

  return (
    <div className="flex w-full mb-6 animate-fadeIn justify-start">
      <div className="flex gap-4 max-w-[85%]">
        {/* AI Avatar with pulse effect */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/20 animate-pulse">
            <svg width="18" height="18" viewBox="0 0 24 25" fill="currentColor">
              <path d="M12 2.96057C10.34 2.96057 9 4.30057 9 5.96057H15C15 4.30057 13.66 2.96057 12 2.96057ZM20 9.96057V7.96057C20 6.86057 19.1 5.96057 18 5.96057H15C15 4.30057 13.66 2.96057 12 2.96057C10.34 2.96057 9 4.30057 9 5.96057H6C4.9 5.96057 4 6.86057 4 7.96057V9.96057C2.34 9.96057 1 11.3006 1 12.9606C1 14.6206 2.34 15.9606 4 15.9606V19.9606C4 21.0606 4.9 21.9606 6 21.9606H18C19.1 21.9606 20 21.0606 20 19.9606V15.9606C21.66 15.9606 23 14.6206 23 12.9606C23 11.3006 21.66 9.96057 20 9.96057Z" />
            </svg>
          </div>
        </div>

        {/* Loading Message Bubble */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="rounded-2xl px-5 py-4 bg-white border-2 border-[#00A3A1]/30 shadow-xl">
            {/* Spinner + Status Text */}
            <div className="flex items-center gap-3 mb-3">
              {/* Circular Spinner with orange/teal gradient */}
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-3 border-[#00A3A1]/20"></div>
                <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#F6A135] border-r-[#00A3A1] animate-spin"></div>
              </div>
              {/* Dynamic status text with fade transition */}
              <span className="text-sm font-medium text-[#00A3A1] animate-pulse">
                {stages[currentStageIndex]}
              </span>
            </div>

            {/* Shimmer skeleton lines */}
            <div className="space-y-2">
              <div className="h-3 bg-gradient-to-r from-gray-200 via-[#00A3A1]/10 to-gray-200 dark:from-slate-700 dark:via-[#00A3A1]/20 dark:to-slate-700 rounded animate-shimmer w-3/4"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 via-[#00A3A1]/10 to-gray-200 dark:from-slate-700 dark:via-[#00A3A1]/20 dark:to-slate-700 rounded animate-shimmer w-full"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 via-[#00A3A1]/10 to-gray-200 dark:from-slate-700 dark:via-[#00A3A1]/20 dark:to-slate-700 rounded animate-shimmer w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
