import { loadStripe } from '@stripe/stripe-js';

// Get Stripe instance
const getStripe = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('Stripe publishable key is missing from environment variables');
    return Promise.resolve(null);
  }
  
  return loadStripe(publishableKey);
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  role: string; // 'pro-1' | 'pro-2'
  monthlyPriceId: string;
  annualPriceId: string;
  monthlyPrice: number;
  annualPrice: number;
  credits: number;
  features: string[];
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string;
  customerId: string;
}

export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodEnd: string;
  role: string;
  planName: string;
}

export class SubscriptionService {
  
  /**
   * Create a new subscription for a user
   */
  static async createSubscription(data: {
    priceId: string;
    userId: string;
    email: string;
    name: string;
  }): Promise<CreateSubscriptionResponse> {
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription status
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
      const response = await fetch(`/api/stripe/subscription-status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No subscription found
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }

  /**
   * Cancel user's subscription
   */
  static async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update user's subscription plan
   */
  static async updateSubscription(data: {
    userId: string;
    newPriceId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process subscription payment using Stripe
   */
  static async processSubscriptionPayment(
    stripe: any,
    elements: any,
    clientSecret: string,
    customerInfo: {
      email?: string;
      name?: string;
    }
  ) {
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/?subscription=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Subscription setup failed:', error);
        return { success: false, error: error.message };
      }

      if (setupIntent && setupIntent.status === 'succeeded') {
        return { success: true, setupIntent };
      }

      return { success: false, error: 'Subscription setup was not completed successfully' };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Confirm subscription and assign role
   */
  static async confirmSubscription(subscriptionId: string, userId: string): Promise<{ success: boolean; role?: string; planName?: string; error?: string }> {
    try {
      const response = await fetch('/api/stripe/confirm-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get Stripe instance
   */
  static getStripe = getStripe;
}

// Subscription plans configuration with server-side price ID fetching
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    role: 'pro-1',
    monthlyPriceId: 'STRIPE_STARTER_MONTHLY_PRICE', // Will be resolved server-side
    annualPriceId: 'STRIPE_STARTER_ANNUAL_PRICE',
    monthlyPrice: 118.00,
    annualPrice: 1298.00,
    credits: 100,
    features: [
      "20% company commission",
      "100 credits included",
      "4 credits per standard search (25 searches)",
      "VRN searching",
      "Job leads",
      "Calendar integration"
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    role: 'pro-2',
    monthlyPriceId: 'STRIPE_PROFESSIONAL_MONTHLY_PRICE', // Will be resolved server-side
    annualPriceId: 'STRIPE_PROFESSIONAL_ANNUAL_PRICE',
    monthlyPrice: 198.00,
    annualPrice: 2178.00,
    credits: 350,
    features: [
      "15% company commission",
      "350 credits included",
      "4 credits per standard search (87 searches)",
      "VRN searching",
      "Job leads",
      "Calendar integration",
      "Priority email & phone support"
    ]
  }
];

export default SubscriptionService;
