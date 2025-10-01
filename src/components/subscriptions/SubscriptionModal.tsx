import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle, AlertCircle, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SubscriptionService from "@/services/subscriptionService";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string;
  planName: string;
  price: number;
  isAnnual: boolean;
  credits: number;
  role: string;
  onSuccess: (role: string, planName: string) => void;
}

// Subscription form component that uses Stripe hooks
function SubscriptionForm({ 
  priceId,
  planName,
  price,
  isAnnual,
  credits,
  role,
  onClose, 
  onSuccess,
  clientSecret 
}: Omit<SubscriptionModalProps, 'isOpen'> & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user?.id) {
      setPaymentError('Payment system not ready or user not authenticated');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?subscription=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Subscription payment failed:', error);
        setPaymentError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSubscriptionSuccess(true);
        
        // For subscriptions, we need to get the subscription ID differently
        // Let's use the metadata or check the invoice
        console.log('Payment succeeded, checking for subscription...', paymentIntent);
        
        let subscriptionId = null;
        
        // Try to get subscription ID from the payment intent
        if (paymentIntent.invoice && typeof paymentIntent.invoice === 'object') {
          subscriptionId = paymentIntent.invoice.subscription;
        } else if (paymentIntent.invoice && typeof paymentIntent.invoice === 'string') {
          // If invoice is just an ID, we need to retrieve it
          try {
            const stripe = await SubscriptionService.getStripe();
            if (stripe) {
              // For now, let's try a different approach - check if the user has any new subscriptions
              console.log('Attempting to confirm subscription via backend...');
              
              // Call backend to find and confirm the latest subscription for this user
              const result = await fetch('/api/stripe/find-and-confirm-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  userId: user.id,
                  paymentIntentId: paymentIntent.id 
                })
              });
              
              if (result.ok) {
                const confirmResult = await result.json();
                if (confirmResult.success) {
                  toast({
                    title: "Subscription Activated!",
                    description: `Welcome to ${planName}! Your role has been updated to ${confirmResult.role}.`,
                  });
                  onSuccess(confirmResult.role, confirmResult.planName);
                  setTimeout(onClose, 2000);
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error retrieving subscription details:', error);
          }
        }
        
        if (subscriptionId) {
          // Confirm with our backend to assign role
          const result = await SubscriptionService.confirmSubscription(subscriptionId, user.id);
          
          if (result.success) {
            toast({
              title: "Subscription Activated!",
              description: `Welcome to ${planName}! Your role has been updated to ${result.role}.`,
            });
            onSuccess(result.role, result.planName);
            setTimeout(onClose, 2000);
          } else {
            setPaymentError(result.error || 'Failed to activate subscription');
          }
        } else {
          // Fallback: Payment succeeded but we couldn't get subscription ID
          toast({
            title: "Payment Successful!",
            description: "Your subscription is being activated. Please check your settings in a moment.",
          });
          setTimeout(() => {
            onSuccess(role, planName);
            onClose();
          }, 2000);
        }
      } else {
        setPaymentError('Payment was not completed successfully');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setPaymentError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (subscriptionSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Subscription Activated!</h3>
          <p className="text-gray-600 mt-1">
            Welcome to {planName}! Your account has been upgraded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Subscription Summary */}
      <div className="bg-amber-50 border border-[#FFC107] rounded-lg p-4">
        <h4 className="font-semibold text-[#1D1D1F] mb-2 flex items-center gap-2">
          <Crown className="h-4 w-4 text-[#FFC107]" />
          Subscription Summary
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-[#1D1D1F]/80">Plan:</span>
            <span className="font-medium text-[#1D1D1F]">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1D1D1F]/80">Billing:</span>
            <span className="font-medium text-[#1D1D1F]">{isAnnual ? 'Annual' : 'Monthly'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1D1D1F]/80">Credits included:</span>
            <span className="font-medium text-[#1D1D1F]">{credits} credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1D1D1F]/80">Access level:</span>
            <span className="font-medium text-[#1D1D1F] uppercase">{role}</span>
          </div>
          <div className="flex justify-between border-t border-[#FFC107] pt-1 mt-2">
            <span className="font-semibold text-[#1D1D1F]">
              {isAnnual ? 'Annual Total:' : 'Monthly Price:'}
            </span>
            <span className="font-semibold text-[#1D1D1F]">£{price.toFixed(2)}</span>
          </div>
          {isAnnual && (
            <div className="text-xs text-gray-600 text-center">
              £{(price / 12).toFixed(2)} per month
            </div>
          )}
        </div>
      </div>

      {/* Payment Element */}
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: "tabs",
              paymentMethodOrder: ['card'],
              wallets: {
                applePay: 'never',
                googlePay: 'never'
              },
              paymentMethodTypes: ['card'], // Explicitly only allow cards
              defaultValues: {
                billingDetails: {
                  name: user?.name || '',
                  email: user?.email || '',
                }
              }
            }}
          />
        </div>
      </div>

      {/* Error Display */}
      {paymentError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {paymentError}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-[#135084] hover:bg-[#135084]/90 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe - £{price.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function SubscriptionModal({ 
  isOpen, 
  onClose, 
  priceId,
  planName,
  price,
  isAnnual,
  credits,
  role,
  onSuccess 
}: SubscriptionModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Create subscription when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      createSubscription();
    }
  }, [isOpen, priceId, user?.id]);

  const createSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await SubscriptionService.createSubscription({
        priceId,
        userId: user!.id,
        email: user!.email,
        name: user!.name
      });

      setClientSecret(result.clientSecret);
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  const stripePromise = SubscriptionService.getStripe();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#135084]" />
            Subscribe to {planName}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#135084]" />
            <p className="text-gray-600 mt-2">Setting up subscription...</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {clientSecret && !isLoading && !error && (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#135084',
                  colorBackground: '#ffffff',
                  colorText: '#1D1D1F',
                  colorDanger: '#dc2626',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '8px',
                }
              }
            }}
          >
            <SubscriptionForm
              priceId={priceId}
              planName={planName}
              price={price}
              isAnnual={isAnnual}
              credits={credits}
              role={role}
              onClose={handleClose}
              onSuccess={onSuccess}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
