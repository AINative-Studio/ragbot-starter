import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  describe('Branding - AINative Studio + ZeroDB + Meta Llama', () => {
    it('should render the footer', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('should display "Powered by" text', () => {
      render(<Footer />);

      expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    });

    it('should display "AINative Studio" brand', () => {
      render(<Footer />);

      const brand = screen.getByText('AINative Studio');
      expect(brand).toBeInTheDocument();
      expect(brand).toHaveClass('font-semibold');
    });

    it('should display "ZeroDB" brand', () => {
      render(<Footer />);

      const brand = screen.getByText('ZeroDB');
      expect(brand).toBeInTheDocument();
      expect(brand).toHaveClass('font-semibold');
    });

    it('should display "Meta Llama" brand', () => {
      render(<Footer />);

      const brand = screen.getByText('Meta Llama');
      expect(brand).toBeInTheDocument();
      expect(brand).toHaveClass('font-semibold');
    });

    it('should NOT display Vercel branding', () => {
      render(<Footer />);

      expect(screen.queryByText(/Vercel/i)).not.toBeInTheDocument();
    });

    it('should NOT display OpenAI branding', () => {
      render(<Footer />);

      expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
    });

    it('should NOT have Vercel deploy button', () => {
      const { container } = render(<Footer />);

      // Check for common Vercel deploy button patterns
      expect(screen.queryByText(/Deploy/i)).not.toBeInTheDocument();
      expect(screen.queryByAltText(/Vercel/i)).not.toBeInTheDocument();
      expect(container.querySelector('a[href*="vercel.com"]')).not.toBeInTheDocument();
    });

    it('should display brands in correct order: AINative Studio + ZeroDB + Meta Llama', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      const text = footer?.textContent;

      expect(text).toMatch(/AINative Studio.*\+.*ZeroDB.*\+.*Meta Llama/);
    });
  });

  describe('Styling', () => {
    it('should have correct text size', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('text-sm');
    });

    it('should have correct margin', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('mt-6');
    });

    it('should be right-aligned', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('justify-end');
    });

    it('should use chatbot-text-tertiary class', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('chatbot-text-tertiary');
    });

    it('should have flex layout', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('flex');
    });

    it('should have flex-row for inner container', () => {
      const { container } = render(<Footer />);

      const innerDiv = container.querySelector('footer > div');
      expect(innerDiv).toHaveClass('flex-row');
    });

    it('should have items-center alignment', () => {
      const { container } = render(<Footer />);

      const innerDiv = container.querySelector('footer > div');
      expect(innerDiv).toHaveClass('items-center');
    });
  });

  describe('Brand Styling', () => {
    it('should style AINative Studio as semibold', () => {
      render(<Footer />);

      const brand = screen.getByText('AINative Studio');
      expect(brand).toHaveClass('font-semibold');
      expect(brand).toHaveClass('text-base');
    });

    it('should style ZeroDB as semibold', () => {
      render(<Footer />);

      const brand = screen.getByText('ZeroDB');
      expect(brand).toHaveClass('font-semibold');
      expect(brand).toHaveClass('text-base');
    });

    it('should style Meta Llama as semibold', () => {
      render(<Footer />);

      const brand = screen.getByText('Meta Llama');
      expect(brand).toHaveClass('font-semibold');
      expect(brand).toHaveClass('text-base');
    });

    it('should have proper spacing between brands', () => {
      const { container } = render(<Footer />);

      const separators = container.querySelectorAll('.mx-1');
      // Should have separators between brands
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Separator Elements', () => {
    it('should have plus signs between brands', () => {
      render(<Footer />);

      const plusSigns = screen.getAllByText('+');
      expect(plusSigns).toHaveLength(2); // Two separators for three brands
    });

    it('should style separators with mx-1', () => {
      const { container } = render(<Footer />);

      const separators = container.querySelectorAll('.mx-1');
      separators.forEach(separator => {
        expect(separator).toHaveClass('mx-1');
      });
    });
  });

  describe('Semantic HTML', () => {
    it('should use footer semantic element', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should use span elements for text', () => {
      const { container } = render(<Footer />);

      const spans = container.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });
  });

  describe('Content Verification', () => {
    it('should have all three brands visible', () => {
      render(<Footer />);

      expect(screen.getByText('AINative Studio')).toBeVisible();
      expect(screen.getByText('ZeroDB')).toBeVisible();
      expect(screen.getByText('Meta Llama')).toBeVisible();
    });

    it('should not contain any links', () => {
      const { container } = render(<Footer />);

      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(0);
    });

    it('should not contain any images', () => {
      const { container } = render(<Footer />);

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(0);
    });

    it('should have complete branding text', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      const text = footer?.textContent;

      expect(text).toContain('Powered by');
      expect(text).toContain('AINative Studio');
      expect(text).toContain('ZeroDB');
      expect(text).toContain('Meta Llama');
    });
  });
});
