import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    // Debug log all available environment variables
    console.log('🔍 All available env vars:', Object.keys(import.meta.env));
    
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
                          import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
                          import.meta.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    console.log('🔍 Stripe key check:', {
      VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'found' : 'missing',
      VITE_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'found' : 'missing',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: import.meta.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'found' : 'missing',
      finalKey: publishableKey ? 'found' : 'missing'
    });
    
    if (!publishableKey) {
      console.error('❌ Stripe publishable key is missing from environment variables');
      console.error('💡 Make sure you have VITE_STRIPE_PUBLISHABLE_KEY in your .env file');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export interface PaymentIntentData {
  amount: number; // Amount in pence (e.g., 1000 = £10.00)
  credits: number;
  currency?: string;
  description?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export class StripeService {
  
  /**
   * Create a payment intent on the server
   */
  static async createPaymentIntent(data: PaymentIntentData): Promise<CreatePaymentIntentResponse> {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          credits: data.credits,
          currency: data.currency || 'gbp',
          description: data.description || `Purchase ${data.credits} credits`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and process credit purchase
   */
  static async confirmPayment(paymentIntentId: string, technicianId: string): Promise<{ success: boolean; credits?: number; error?: string }> {
    try {
      const response = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          technicianId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process a payment using Stripe Elements
   */
  static async processPayment(
    stripe: Stripe,
    elements: any,
    clientSecret: string,
    customerInfo: {
      email?: string;
      name?: string;
    }
  ) {
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/top-up?payment=success`,
          receipt_email: customerInfo.email,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        return { success: false, error: error.message };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return { success: true, paymentIntent };
      }

      return { success: false, error: 'Payment was not completed successfully' };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get Stripe instance
   */
  static getStripe = getStripe;
}

export default StripeService;
