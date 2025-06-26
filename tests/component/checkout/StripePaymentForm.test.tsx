import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StripePaymentForm from '@/components/checkout/stripe-payment-form';
import { useCartStore } from '@/lib/cart-store';
import { toast } from '@/hooks/use-toast';
import { medusaClient } from '@/lib/medusa';

// Mock Stripe
const mockStripe = {
  confirmPayment: jest.fn(),
};

const mockElements = {
  getElement: jest.fn(),
};

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: ({ options }: any) => (
    <div data-testid="payment-element" data-options={JSON.stringify(options)}>
      Payment Element
    </div>
  ),
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

jest.mock('@/lib/stripe', () => ({
  stripePromise: Promise.resolve(mockStripe),
  stripeAppearance: { theme: 'stripe' },
}));

jest.mock('@/lib/cart-store', () => ({
  useCartStore: jest.fn(),
}));

jest.mock('@/lib/medusa', () => ({
  medusaClient: {
    store: {
      cart: {
        complete: jest.fn(),
      },
    },
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      data-testid="submit-button"
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('StripePaymentForm', () => {
  const mockOnSuccess = jest.fn();
  const mockClearCart = jest.fn();
  const mockCartId = 'cart-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useCartStore as jest.Mock).mockReturnValue({
      clearCart: mockClearCart,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ client_secret: 'pi_test_secret_123' }),
    });
  });

  describe('Initialization', () => {
    it('shows loading state initially', async () => {
      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Initializing payment...')).toBeInTheDocument();
    });

    it('creates payment intent on mount', async () => {
      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cartId: mockCartId }),
        });
      });
    });

    it('renders payment form after loading', async () => {
      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
      });
    });

    it('shows error when payment intent creation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize payment. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows error when client secret is not received', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize payment. Please refresh and try again.')).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize payment. Please try again.')).toBeInTheDocument();
      });
    });

    it('does not create payment intent when cartId is not provided', async () => {
      render(<StripePaymentForm cartId="" onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Payment Form', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);
      });
    });

    it('configures PaymentElement with correct options', async () => {
      await waitFor(() => {
        const paymentElement = screen.getByTestId('payment-element');
        const options = JSON.parse(paymentElement.getAttribute('data-options') || '{}');
        
        expect(options).toEqual({
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        });
      });
    });

    it('displays security badges', async () => {
      await waitFor(() => {
        expect(screen.getByText('Secure Payment')).toBeInTheDocument();
        expect(screen.getByText('SSL Encrypted')).toBeInTheDocument();
      });
    });

    it('displays Stripe branding', async () => {
      await waitFor(() => {
        expect(screen.getByText('Powered by')).toBeInTheDocument();
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      mockStripe.confirmPayment.mockClear();
      medusaClient.store.cart.complete.mockClear();
      
      await act(async () => {
        render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);
      });
    });

    it('handles successful payment and order completion', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      medusaClient.store.cart.complete.mockResolvedValueOnce({
        type: 'order',
        order: {
          id: 'order-123',
          display_id: 'ORD-123',
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
          elements: mockElements,
          confirmParams: {
            return_url: `${window.location.origin}/order-confirmation`,
          },
          redirect: 'if_required',
        });

        expect(medusaClient.store.cart.complete).toHaveBeenCalledWith(mockCartId);
        
        expect(mockClearCart).toHaveBeenCalled();
        
        expect(toast).toHaveBeenCalledWith({
          title: 'Order confirmed!',
          description: 'Your order #ORD-123 has been placed successfully.',
        });

        expect(mockOnSuccess).toHaveBeenCalledWith({
          id: 'order-123',
          display_id: 'ORD-123',
        });
      });
    });

    it('handles cart response when order type is not returned', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      medusaClient.store.cart.complete.mockResolvedValueOnce({
        type: 'cart',
        cart: {
          id: 'cart-123',
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        // Should not call success callback or clear cart for cart response
        expect(mockOnSuccess).not.toHaveBeenCalled();
        expect(mockClearCart).not.toHaveBeenCalled();
      });
    });

    it('handles card errors', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        error: {
          type: 'card_error',
          message: 'Your card was declined',
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Your card was declined')).toBeInTheDocument();
      });
    });

    it('handles validation errors', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        error: {
          type: 'validation_error',
          message: 'Please enter a valid card number',
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid card number')).toBeInTheDocument();
      });
    });

    it('handles unexpected Stripe errors', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        error: {
          type: 'api_error',
          message: null,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('handles order completion failure after successful payment', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      medusaClient.store.cart.complete.mockRejectedValueOnce(new Error('Order completion failed'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Payment successful but order completion failed. Please contact support.')).toBeInTheDocument();
      });
    });

    it('handles general payment processing errors', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockRejectedValueOnce(new Error('Network error'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Payment processing failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('prevents submission when Stripe is not loaded', async () => {
      const user = userEvent.setup();
      
      // Mock useStripe to return null
      jest.mocked(require('@stripe/react-stripe-js').useStripe).mockReturnValueOnce(null);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      
      await user.click(submitButton);
      
      expect(mockStripe.confirmPayment).not.toHaveBeenCalled();
    });

    it('shows processing state during payment', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Processing payment...')).toBeInTheDocument();
    });

    it('clears error state when retrying payment', async () => {
      const user = userEvent.setup();
      
      // First attempt - fail
      mockStripe.confirmPayment.mockResolvedValueOnce({
        error: {
          type: 'card_error',
          message: 'Card declined',
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Card declined')).toBeInTheDocument();
      });

      // Second attempt - success
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      medusaClient.store.cart.complete.mockResolvedValueOnce({
        type: 'order',
        order: { id: 'order-123', display_id: 'ORD-123' },
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Card declined')).not.toBeInTheDocument();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing Stripe configuration', async () => {
      jest.mocked(require('@/lib/stripe').stripePromise).mockReturnValueOnce(null);

      render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe is not configured. Please contact support.')).toBeInTheDocument();
      });
    });

    it('handles order without display_id', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      medusaClient.store.cart.complete.mockResolvedValueOnce({
        type: 'order',
        order: {
          id: 'order-123',
          // No display_id
        },
      });

      await act(async () => {
        render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Order confirmed!',
          description: 'Your order #order-123 has been placed successfully.',
        });
      });
    });

    it('handles order without any id', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      medusaClient.store.cart.complete.mockResolvedValueOnce({
        type: 'order',
        order: {},
      });

      await act(async () => {
        render(<StripePaymentForm cartId={mockCartId} onSuccess={mockOnSuccess} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Order confirmed!',
          description: 'Your order #N/A has been placed successfully.',
        });
      });
    });
  });
});