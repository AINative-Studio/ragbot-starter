const PromptSuggestionButton = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative text-sm px-4 py-2.5 rounded-xl overflow-hidden whitespace-nowrap backdrop-blur-xl bg-[#F6A135]/10 hover:bg-[#F6A135]/20 border border-[#F6A135]/30 hover:border-[#F6A135]/50 text-[#F6A135] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#F6A135]/20 focus:outline-none focus:ring-2 focus:ring-[#F6A135]/50 active:scale-95"
    >
      {/* Gradient overlay on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-[#F6A135]/10 to-[#F6A135]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

      {/* Text */}
      <span className="relative flex items-center gap-2">
        <svg className="w-4 h-4 text-[#F6A135] opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {text}
      </span>
    </button>
  );
};

export default PromptSuggestionButton;
