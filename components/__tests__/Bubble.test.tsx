import React from 'react';
import { render, screen } from '@testing-library/react';
import Bubble from '../Bubble';

describe('Bubble Component', () => {
  describe('User vs Assistant Message Styling', () => {
    it('should render user message with correct styling', () => {
      const content = {
        role: 'user',
        content: 'This is a user message',
      };

      const { container } = render(<Bubble content={content} />);

      const bubble = container.querySelector('.talk-bubble.user');
      expect(bubble).toBeInTheDocument();
    });

    it('should render assistant message without user class', () => {
      const content = {
        role: 'assistant',
        content: 'This is an assistant message',
      };

      const { container } = render(<Bubble content={content} />);

      const bubbleWithUser = container.querySelector('.talk-bubble.user');
      expect(bubbleWithUser).not.toBeInTheDocument();

      const bubble = container.querySelector('.talk-bubble');
      expect(bubble).toBeInTheDocument();
    });

    it('should float right for user messages', () => {
      const content = {
        role: 'user',
        content: 'User message',
      };

      const { container } = render(<Bubble content={content} />);

      const wrapper = container.querySelector('.float-right');
      expect(wrapper).toBeInTheDocument();
    });

    it('should float left for assistant messages', () => {
      const content = {
        role: 'assistant',
        content: 'Assistant message',
      };

      const { container } = render(<Bubble content={content} />);

      const wrapper = container.querySelector('.float-left');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('should render plain text content', () => {
      const content = {
        role: 'assistant',
        content: 'Simple text message',
      };

      render(<Bubble content={content} />);

      expect(screen.getByText('Simple text message')).toBeInTheDocument();
    });

    it('should render markdown bold text', () => {
      const content = {
        role: 'assistant',
        content: '**Bold text**',
      };

      const { container } = render(<Bubble content={content} />);

      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe('Bold text');
    });

    it('should render markdown italic text', () => {
      const content = {
        role: 'assistant',
        content: '*Italic text*',
      };

      const { container } = render(<Bubble content={content} />);

      const em = container.querySelector('em');
      expect(em).toBeInTheDocument();
      expect(em?.textContent).toBe('Italic text');
    });

    it('should render markdown code blocks', () => {
      const content = {
        role: 'assistant',
        content: '`inline code`',
      };

      const { container } = render(<Bubble content={content} />);

      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toBe('inline code');
    });

    it('should render markdown headings', () => {
      const content = {
        role: 'assistant',
        content: '# Heading',
      };

      const { container } = render(<Bubble content={content} />);

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });

    it('should render markdown lists', () => {
      const content = {
        role: 'assistant',
        content: '- Item 1\n- Item 2',
      };

      const { container } = render(<Bubble content={content} />);

      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
    });

    it('should use remark-gfm for GitHub Flavored Markdown', () => {
      const content = {
        role: 'assistant',
        content: '~~strikethrough~~',
      };

      const { container } = render(<Bubble content={content} />);

      const del = container.querySelector('del');
      expect(del).toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    it('should show loading indicator when processing', () => {
      const content = {
        role: 'assistant',
        content: '',
        processing: true,
      };

      const { container } = render(<Bubble content={content} />);

      const loadingIndicator = container.querySelector('.dot-flashing');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should not show content when processing', () => {
      const content = {
        role: 'assistant',
        content: 'Some content',
        processing: true,
      };

      render(<Bubble content={content} />);

      expect(screen.queryByText('Some content')).not.toBeInTheDocument();
    });

    it('should show content when not processing', () => {
      const content = {
        role: 'assistant',
        content: 'Visible content',
        processing: false,
      };

      render(<Bubble content={content} />);

      expect(screen.getByText('Visible content')).toBeInTheDocument();
    });

    it('should have proper loading indicator container', () => {
      const content = {
        role: 'assistant',
        content: '',
        processing: true,
      };

      const { container } = render(<Bubble content={content} />);

      const loadingContainer = container.querySelector('.w-6.h-6');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('ZeroDB Docs Link - NOT Astra DB', () => {
    it('should display "ZeroDB Docs" link when url is present', () => {
      const content = {
        role: 'assistant',
        content: 'Answer with source',
        url: 'https://docs.ainative.studio/zerodb',
      };

      render(<Bubble content={content} />);

      expect(screen.getByText('ZeroDB Docs')).toBeInTheDocument();
    });

    it('should NOT display "Astra DB FAQs" text', () => {
      const content = {
        role: 'assistant',
        content: 'Answer with source',
        url: 'https://example.com',
      };

      render(<Bubble content={content} />);

      expect(screen.queryByText(/Astra DB/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/FAQs/i)).not.toBeInTheDocument();
    });

    it('should link to the provided URL', () => {
      const content = {
        role: 'assistant',
        content: 'Answer',
        url: 'https://docs.ainative.studio/zerodb/vectors',
      };

      const { container } = render(<Bubble content={content} />);

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', 'https://docs.ainative.studio/zerodb/vectors');
    });

    it('should open link in new tab', () => {
      const content = {
        role: 'assistant',
        content: 'Answer',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should not show link when url is not present', () => {
      const content = {
        role: 'assistant',
        content: 'Answer without source',
      };

      render(<Bubble content={content} />);

      expect(screen.queryByText('ZeroDB Docs')).not.toBeInTheDocument();
      expect(screen.queryByText('Source:')).not.toBeInTheDocument();
    });

    it('should display "Source:" label with link', () => {
      const content = {
        role: 'assistant',
        content: 'Answer',
        url: 'https://example.com',
      };

      render(<Bubble content={content} />);

      expect(screen.getByText('Source:')).toBeInTheDocument();
    });

    it('should have link icon SVG', () => {
      const content = {
        role: 'assistant',
        content: 'Answer',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const svg = container.querySelector('.chatbot-faq-link svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('SVG Rendering', () => {
    it('should render bubble tail SVG', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const { container } = render(<Bubble content={content} />);

      const svgs = container.querySelectorAll('svg');
      // Should have at least one SVG (the tail)
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should render link icon when URL is present', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const linkSvg = container.querySelector('.chatbot-faq-link svg');
      expect(linkSvg).toBeInTheDocument();
      expect(linkSvg).toHaveAttribute('width', '14');
      expect(linkSvg).toHaveAttribute('height', '7');
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper margin top', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const { container } = render(<Bubble content={content} />);

      const wrapper = container.querySelector('.mt-4.md\\:mt-6');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have proper padding', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const { container } = render(<Bubble content={content} />);

      const bubble = container.querySelector('.p-2.md\\:p-4');
      expect(bubble).toBeInTheDocument();
    });

    it('should clear float', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const { container } = render(<Bubble content={content} />);

      const wrapper = container.querySelector('.clear-both');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have block display', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const { container } = render(<Bubble content={content} />);

      const wrapper = container.querySelector('.block');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('forwardRef Support', () => {
    it('should support ref forwarding', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const ref = React.createRef<HTMLDivElement>();
      render(<Bubble content={content} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should attach ref to outer wrapper', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
      };

      const ref = React.createRef<HTMLDivElement>();
      render(<Bubble content={content} ref={ref} />);

      expect(ref.current).toHaveClass('block');
      expect(ref.current).toHaveClass('mt-4');
    });
  });

  describe('Source Link Styling', () => {
    it('should style link with chatbot-faq-link class', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const link = container.querySelector('.chatbot-faq-link');
      expect(link).toBeInTheDocument();
    });

    it('should have proper spacing for source section', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const sourceWrapper = container.querySelector('.mt-3');
      expect(sourceWrapper).toBeInTheDocument();
    });

    it('should have flex layout for link', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const link = container.querySelector('.chatbot-faq-link');
      expect(link).toHaveClass('flex');
      expect(link).toHaveClass('items-center');
    });

    it('should have proper padding on link', () => {
      const content = {
        role: 'assistant',
        content: 'Message',
        url: 'https://example.com',
      };

      const { container } = render(<Bubble content={content} />);

      const link = container.querySelector('.chatbot-faq-link');
      expect(link).toHaveClass('px-2');
      expect(link).toHaveClass('py-0.5');
    });
  });

  describe('Content Edge Cases', () => {
    it('should handle empty content', () => {
      const content = {
        role: 'assistant',
        content: '',
      };

      const { container } = render(<Bubble content={content} />);

      const bubble = container.querySelector('.talk-bubble');
      expect(bubble).toBeInTheDocument();
    });

    it('should handle multiline content', () => {
      const content = {
        role: 'assistant',
        content: 'Line 1\nLine 2\nLine 3',
      };

      render(<Bubble content={content} />);

      const text = screen.getByText(/Line 1/);
      expect(text).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const content = {
        role: 'assistant',
        content: '< > & " \'',
      };

      render(<Bubble content={content} />);

      expect(screen.getByText(/</)).toBeInTheDocument();
    });
  });
});
