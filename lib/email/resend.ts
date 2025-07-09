import { Resend } from 'resend';
import type { ShopifyOrder } from '@/lib/shopify/orders';

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email configuration
const FROM_EMAIL = 'Strike Shop <orders@strike-shop.com>';
const REPLY_TO = 'support@strike-shop.com';

export interface OrderEmailData {
  order: ShopifyOrder | any; // Allow partial order for failed orders
  customerEmail: string;
  customerName: string;
  paymentIntentId?: string;
  subject?: string; // Custom subject for admin alerts
  isAdminAlert?: boolean; // Flag for admin notifications
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<EmailResult> {
  try {
    const { order, customerEmail, customerName, subject, isAdminAlert } = data;

    // For now, use a simple HTML template
    // TODO: Create React Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - Strike Shop</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">
              Order Confirmation
            </h1>
            
            <p>Hi ${customerName},</p>
            
            <p>Thank you for your order! We've received your payment and your order is being processed.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> #${order.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Total:</strong> $${order.total_price}</p>
            </div>
            
            <h3>Items Ordered:</h3>
            <ul>
              ${order.line_items.map((item: any) => 
                `<li>${item.title} - Quantity: ${item.quantity} - $${item.price}</li>`
              ).join('')}
            </ul>
            
            <div style="margin-top: 30px;">
              <h3>Shipping Address:</h3>
              <p>
                ${order.shipping_address.first_name} ${order.shipping_address.last_name}<br>
                ${order.shipping_address.address1}<br>
                ${order.shipping_address.address2 ? order.shipping_address.address2 + '<br>' : ''}
                ${order.shipping_address.city}, ${order.shipping_address.province} ${order.shipping_address.zip}<br>
                ${order.shipping_address.country}
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              You can track your order status by logging into your account at Strike Shop.
            </p>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Strike Shop Team</p>
            
            <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      throw new Error('Email service not configured - missing RESEND_API_KEY');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      replyTo: REPLY_TO,
      subject: subject || `Order Confirmation - Order #${order.order_number}`,
      html: emailHtml,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(
  order: ShopifyOrder,
  trackingInfo: {
    trackingNumber: string;
    trackingCompany: string;
    trackingUrl?: string;
  }
): Promise<EmailResult> {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Order Has Shipped - Strike Shop</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">
              Your Order Has Shipped!
            </h1>
            
            <p>Great news! Your order #${order.order_number} has been shipped.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Tracking Information</h2>
              <p><strong>Carrier:</strong> ${trackingInfo.trackingCompany}</p>
              <p><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber}</p>
              ${trackingInfo.trackingUrl ? 
                `<p><a href="${trackingInfo.trackingUrl}" style="color: #0066cc;">Track Your Package</a></p>` 
                : ''
              }
            </div>
            
            <p>Your package should arrive within 3-5 business days.</p>
            
            <p>Best regards,<br>The Strike Shop Team</p>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      throw new Error('Email service not configured - missing RESEND_API_KEY');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: REPLY_TO,
      subject: `Your Order Has Shipped - Order #${order.order_number}`,
      html: emailHtml,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send shipping notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send refund notification email
 */
export async function sendRefundNotification(
  order: ShopifyOrder,
  refundAmount: string
): Promise<EmailResult> {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Refund Processed - Strike Shop</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">
              Refund Processed
            </h1>
            
            <p>We've processed your refund for order #${order.order_number}.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Refund Details</h2>
              <p><strong>Order Number:</strong> #${order.order_number}</p>
              <p><strong>Refund Amount:</strong> $${refundAmount}</p>
              <p><strong>Processing Time:</strong> 5-10 business days</p>
            </div>
            
            <p>The refund will be credited to your original payment method within 5-10 business days.</p>
            
            <p>If you have any questions about your refund, please contact our support team.</p>
            
            <p>Best regards,<br>The Strike Shop Team</p>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      throw new Error('Email service not configured - missing RESEND_API_KEY');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: REPLY_TO,
      subject: `Refund Processed - Order #${order.order_number}`,
      html: emailHtml,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send refund notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<EmailResult> {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - Strike Shop</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">
              Reset Your Password
            </h1>
            
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #000; color: #fff; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The Strike Shop Team</p>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      throw new Error('Email service not configured - missing RESEND_API_KEY');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO,
      subject: 'Reset Your Password - Strike Shop',
      html: emailHtml,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send payment failure notification
 */
export async function sendPaymentFailureNotification(data: {
  customerEmail: string;
  customerName: string;
  paymentIntentId: string;
  failureReason: string;
  amount: number;
  currency: string;
}): Promise<EmailResult> {
  try {
    const { customerEmail, customerName, paymentIntentId, failureReason, amount, currency } = data;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed - Strike Shop</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff0000; border-bottom: 2px solid #ff0000; padding-bottom: 10px;">
              Payment Failed
            </h1>
            
            <p>Hi ${customerName},</p>
            
            <p>We were unable to process your payment. Please see the details below:</p>
            
            <div style="background: #fff0f0; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffcccc;">
              <h2 style="margin-top: 0; color: #cc0000;">Payment Details</h2>
              <p><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
              <p><strong>Reason:</strong> ${failureReason}</p>
              <p><strong>Reference:</strong> ${paymentIntentId}</p>
            </div>
            
            <h3>What to do next?</h3>
            <ul>
              <li>Check that your card details are correct</li>
              <li>Ensure you have sufficient funds</li>
              <li>Contact your bank if the problem persists</li>
              <li>Try a different payment method</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://strike-shop.com/cart" 
                 style="background: #000; color: #fff; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Return to Cart
              </a>
            </div>
            
            <p>If you continue to experience issues, please contact our support team with the reference number above.</p>
            
            <p>Best regards,<br>The Strike Shop Team</p>
            
            <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              This is an automated email regarding your recent payment attempt at Strike Shop.
            </p>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      console.log('Email service not configured - skipping payment failure notification');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      replyTo: REPLY_TO,
      subject: 'Payment Failed - Strike Shop',
      html: emailHtml,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send payment failure notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}