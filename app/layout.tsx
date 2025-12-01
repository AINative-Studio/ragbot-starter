import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = {
  title: "RAGBot - AINative Studio",
  description: "RAG Chatbot powered by AINative Studio, ZeroDB Embeddings API, and Meta Llama",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
