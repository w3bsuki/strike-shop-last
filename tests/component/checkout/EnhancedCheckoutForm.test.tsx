import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedCheckoutForm } from '@/components/checkout/enhanced-checkout-form';
import { useCart } from '@/hooks/use-cart';
import { useUser } from '@/lib/clerk-mock';
import { toast } from '@/hooks/use-toast';
import * as stripeClient from '@/lib/stripe-client';

// Mock Stripe
const mockStripe = {
  confirmPayment: jest.fn(),
};

const mockElements = {
  getElement: jest.fn(),
};

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  AddressElement: () => <div data-testid="address-element">Address Element</div>,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

jest.mock('@/lib/stripe-client', () => ({
  getStripe: jest.fn(() => Promise.resolve(mockStripe)),
  stripeConfig: {
    appearance: { theme: 'stripe' },
    loader: 'auto',
  },
}));

jest.mock('@/hooks/use-cart', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/lib/clerk-mock', () => ({
  useUser: jest.fn(),
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

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

// Mock fetch
global.fetch = jest.fn();

const mockCart = {
  items: [
    {
      id: 'item-1',
      name: 'Test Product',
      price: 29.99,
      quantity: 2,
      size: 'M',
    },
    {
      id: 'item-2',
      name: 'Another Product',
      price: 19.99,
      quantity: 1,
      size: 'L',
    },
  ],
};

const mockUser = {
  id: 'user-123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
};

describe('EnhancedCheckoutForm', () => {
  const mockOnPaymentSuccess = jest.fn();
  const mockOnPaymentError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCart as jest.Mock).mockReturnValue({
      cart: mockCart,
      totalPrice: 79.97,
    });
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: 'pi_test_secret_123' }),
    });
  });

  describe('Initialization', () => {
    it('shows loading state initially', async () => {
      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      expect(screen.getByText('Initializing payment...')).toBeInTheDocument();
    });

    it('creates payment intent on mount', async () => {
      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 79.97,
            currency: 'gbp',
            items: [
              {
                id: 'item-1',
                name: 'Test Product',
                price: 29.99,
                quantity: 2,
                size: 'M',
              },
              {
                id: 'item-2',
                name: 'Another Product',
                price: 19.99,
                quantity: 1,
                size: 'L',
              },
            ],
          }),
        });
      });
    });

    it('renders checkout form after loading', async () => {
      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
        expect(screen.getByTestId('address-element')).toBeInTheDocument();
      });
    });

    it('shows error when payment intent creation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
    });

    it('shows error message when client secret is not received', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize payment. Please refresh and try again.')).toBeInTheDocument();
      });
    });

    it('does not create payment intent when cart is empty', async () => {
      (useCart as jest.Mock).mockReturnValue({
        cart: { items: [] },
        totalPrice: 0,
      });

      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('does not create payment intent when user is not logged in', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
      });

      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Payment Method Selection', () => {
    beforeEach(async () => {
      await act(async () => {
        render(
          <EnhancedCheckoutForm
            onPaymentSuccess={mockOnPaymentSuccess}
            onPaymentError={mockOnPaymentError}
          />
        );
      });
    });

    it('displays payment method options', async () => {
      await waitFor(() => {
        expect(screen.getByText('All Methods')).toBeInTheDocument();
        expect(screen.getByText('Card Only')).toBeInTheDocument();
        expect(screen.getByText('Buy Now, Pay Later')).toBeInTheDocument();
      });
    });

    it('selects "All Methods" by default', async () => {
      await waitFor(() => {
        const allMethodsButton = screen.getByText('All Methods').closest('button');
        expect(allMethodsButton).toHaveClass('border-black bg-gray-50');
      });
    });

    it('changes payment method when clicked', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Card Only')).toBeInTheDocument();
      });

      const cardOnlyButton = screen.getByText('Card Only').closest('button');
      await user.click(cardOnlyButton!);

      expect(cardOnlyButton).toHaveClass('border-black bg-gray-50');
    });
  });

  describe('Order Summary', () => {
    beforeEach(async () => {
      await act(async () => {
        render(
          <EnhancedCheckoutForm
            onPaymentSuccess={mockOnPaymentSuccess}
            onPaymentError={mockOnPaymentError}
          />
        );
      });
    });

    it('displays order summary with correct totals', async () => {
      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
        expect(screen.getByText('Subtotal (2 items)')).toBeInTheDocument();
        expect(screen.getByText('£79.97')).toBeInTheDocument();
        expect(screen.getByText('Shipping')).toBeInTheDocument();
        expect(screen.getByText('FREE')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      mockStripe.confirmPayment.mockClear();
      
      await act(async () => {
        render(
          <EnhancedCheckoutForm
            onPaymentSuccess={mockOnPaymentSuccess}
            onPaymentError={mockOnPaymentError}
          />
        );
      });
    });

    it('handles successful payment', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
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
            receipt_email: 'test@example.com',
          },
          redirect: 'if_required',
        });

        expect(mockOnPaymentSuccess).toHaveBeenCalledWith({
          id: 'pi_test_123',
          status: 'succeeded',
        });

        expect(toast).toHaveBeenCalledWith({
          title: "Payment Successful",
          description: "Your order has been confirmed!",
        });
      });
    });

    it('handles payment error', async () => {
      const user = userEvent.setup();
      
      const paymentError = {
        type: 'card_error',
        message: 'Card was declined',
      };

      mockStripe.confirmPayment.mockResolvedValueOnce({
        error: paymentError,
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith(paymentError);
        expect(toast).toHaveBeenCalledWith({
          title: "Payment Failed",
          description: "Card was declined",
          variant: "destructive",
        });
      });
    });

    it('handles unexpected errors', async () => {
      const user = userEvent.setup();
      
      mockStripe.confirmPayment.mockRejectedValueOnce(new Error('Network error'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith({
          title: "Payment Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      });
    });

    it('shows error when Stripe is not loaded', async () => {
      const user = userEvent.setup();
      
      // Mock useStripe to return null
      jest.mocked(require('@stripe/react-stripe-js').useStripe).mockReturnValueOnce(null);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Payment Error",
          description: "Payment system is not ready. Please try again.",
          variant: "destructive",
        });
      });
    });

    it('disables submit button while processing', async () => {
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
      expect(screen.getByText('PROCESSING...')).toBeInTheDocument();
    });

    it('shows correct button text with total', async () => {
      await waitFor(() => {
        const submitButton = screen.getByTestId('submit-button');
        expect(submitButton).toHaveTextContent('COMPLETE ORDER - £79.97');
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await act(async () => {
        render(
          <EnhancedCheckoutForm
            onPaymentSuccess={mockOnPaymentSuccess}
            onPaymentError={mockOnPaymentError}
          />
        );
      });
    });

    it('has proper form structure', async () => {
      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });
    });

    it('has proper heading hierarchy', async () => {
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      });
    });

    it('shows security notice', async () => {
      await waitFor(() => {
        expect(screen.getByText('🔒 Your payment information is secure and encrypted')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total price', async () => {
      (useCart as jest.Mock).mockReturnValue({
        cart: mockCart,
        totalPrice: 0,
      });

      await act(async () => {
        render(
          <EnhancedCheckoutForm
            onPaymentSuccess={mockOnPaymentSuccess}
            onPaymentError={mockOnPaymentError}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('£0.00')).toBeInTheDocument();
        expect(screen.getByText('COMPLETE ORDER - £0.00')).toBeInTheDocument();
      });
    });

    it('handles network errors during initialization', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <EnhancedCheckoutForm
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      );

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
    });

    it('handles empty user email', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          emailAddresses: [],
        },
      });

      mockStripe.confirmPayment.mockResolvedValueOnce({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      await act(async () => {
        render(
          <EnhancedCheckoutForm
            onPaymentSuccess={mockOnPaymentSuccess}
            onPaymentError={mockOnPaymentError}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStripe.confirmPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            confirmParams: expect.objectContaining({
              receipt_email: undefined,
            }),
          })
        );
      });
    });
  });
});