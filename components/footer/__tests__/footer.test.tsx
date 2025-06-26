import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from '../footer';
import { footerConfig } from '@/config/footer';

describe('Footer Component', () => {
  const mockOnNewsletterSubmit = jest.fn();

  beforeEach(() => {
    mockOnNewsletterSubmit.mockClear();
  });

  it('renders default footer with all sections', () => {
    render(
      <Footer 
        config={footerConfig} 
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    // Check if main sections are rendered
    expect(screen.getByText('JOIN THE STRIKE™ COMMUNITY')).toBeInTheDocument();
    expect(screen.getByText('HELP')).toBeInTheDocument();
    expect(screen.getByText('LEGAL AREA')).toBeInTheDocument();
    expect(screen.getByText('COMPANY')).toBeInTheDocument();
  });

  it('renders minimal footer variant', () => {
    const minimalConfig = {
      ...footerConfig,
      sections: footerConfig.sections.slice(0, 1),
    };

    render(
      <Footer 
        config={minimalConfig} 
        variant="minimal"
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    // Should render with minimal layout
    expect(screen.getByText('HELP')).toBeInTheDocument();
  });

  it('renders compact footer variant', () => {
    render(
      <Footer 
        config={footerConfig} 
        variant="compact"
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    // Should not render sections in compact mode
    expect(screen.queryByText('HELP')).not.toBeInTheDocument();
    expect(screen.queryByText('JOIN THE STRIKE™ COMMUNITY')).not.toBeInTheDocument();
  });

  it('handles newsletter submission', () => {
    render(
      <Footer 
        config={footerConfig} 
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    const emailInput = screen.getByPlaceholderText('Your Email');
    const submitButton = screen.getByText('→');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(mockOnNewsletterSubmit).toHaveBeenCalledWith('test@example.com', []);
  });

  it('handles newsletter preferences', () => {
    render(
      <Footer 
        config={footerConfig} 
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    const womenswearCheckbox = screen.getByLabelText('Womenswear');
    const menswearCheckbox = screen.getByLabelText('Menswear');
    const emailInput = screen.getByPlaceholderText('Your Email');
    const submitButton = screen.getByText('→');

    fireEvent.click(womenswearCheckbox);
    fireEvent.click(menswearCheckbox);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(mockOnNewsletterSubmit).toHaveBeenCalledWith('test@example.com', ['Womenswear', 'Menswear']);
  });

  it('renders social links with proper attributes', () => {
    render(
      <Footer 
        config={footerConfig} 
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    const socialLinks = screen.getAllByLabelText(/Facebook|Instagram|Twitter|Youtube/);
    
    socialLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('displays copyright and localization info', () => {
    render(
      <Footer 
        config={footerConfig} 
        onNewsletterSubmit={mockOnNewsletterSubmit}
      />
    );

    expect(screen.getByText(/Copyright © \d{4} Strike™ LLC/)).toBeInTheDocument();
    expect(screen.getByText('Country: United States')).toBeInTheDocument();
    expect(screen.getByText('Language: EN')).toBeInTheDocument();
  });
});