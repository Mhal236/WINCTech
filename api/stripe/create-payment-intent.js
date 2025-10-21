/**
 * Create Payment Intent API for Vercel deployment
 * 
 * This API creates a Stripe payment intent for credit purchases
 * Designed to work as a Vercel serverless function
 */
import Stripe from 'stripe';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Stripe secret key not configured' 
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    const { amount, credits, currency = 'gbp', description } = req.body;

    // Validate input
    if (!amount || !credits || amount < 100) { // Minimum £1.00
      return res.status(400).json({ 
        error: 'Invalid amount or credits. Minimum amount is £1.00' 
      });
    }

    console.log(`Creating payment intent for ${credits} credits, amount: ${amount} ${currency}`);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in pence
      currency,
      description: description || `Purchase ${credits} credits`,
      payment_method_types: ['card'], // Only allow card payments
      metadata: {
        credits: credits.toString(),
        type: 'credit_purchase'
      }
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent'
    });
  }
}

