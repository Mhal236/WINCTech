/**
 * Subscription Status API for Vercel deployment
 * 
 * This API fetches the subscription status for a user
 * Designed to work as a Vercel serverless function
 */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  try {
    // Initialize Supabase
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    
    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !key) {
      console.error('❌ Missing SUPABASE configuration');
      return res.status(500).json({
        success: false,
        error: 'Database configuration missing'
      });
    }

    const supabase = createClient(SUPABASE_URL, key, { 
      auth: { persistSession: false }
    });

    console.log(`Fetching subscription status for user: ${userId}`);

    // Get user's subscription from database
    const { data: userData, error: userError } = await supabase
      .from('technicians')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If user has no subscription info, return default free tier
    if (!userData.stripe_subscription_id) {
      return res.status(200).json({
        success: true,
        status: 'none',
        tier: 'free',
        data: userData
      });
    }

    // Initialize Stripe if we need to check subscription status
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20',
      });

      // Fetch fresh subscription status from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);
        
        console.log(`✅ Subscription status from Stripe: ${subscription.status}`);

        return res.status(200).json({
          success: true,
          status: subscription.status,
          tier: userData.subscription_tier || 'free',
          data: {
            ...userData,
            stripe_subscription: {
              id: subscription.id,
              status: subscription.status,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end
            }
          }
        });
      } catch (stripeError) {
        console.error('❌ Error fetching from Stripe:', stripeError);
        // Fall back to database status
      }
    }

    // Return database status if Stripe check fails or is not configured
    return res.status(200).json({
      success: true,
      status: userData.subscription_status || 'none',
      tier: userData.subscription_tier || 'free',
      data: userData
    });

  } catch (error) {
    console.error('❌ Error in subscription status:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscription status'
    });
  }
}

