import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import StripeService from "@/services/stripeService";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // Amount in pounds
  credits: number;
  packageName?: string;
  onSuccess: (credits: number) => void;
}

// Payment form component that uses Stripe hooks
function PaymentForm({ 
  amount, 
  credits, 
  packageName, 
  onClose, 
  onSuccess,
  clientSecret 
}: Omit<PaymentModalProps, 'isOpen'> & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
          return_url: `${window.location.origin}/top-up?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        setPaymentError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        
        // Confirm with our backend
        const result = await StripeService.confirmPayment(paymentIntent.id, user.id);
        
        if (result.success) {
          toast({
            title: "Payment Successful!",
            description: `${credits} credits have been added to your account.`,
          });
          onSuccess(result.credits || credits);
          setTimeout(onClose, 2000);
        } else {
          setPaymentError(result.error || 'Failed to process payment');
        }
      } else {
        setPaymentError('Payment was not completed successfully');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
          <p className="text-gray-600 mt-1">
            {credits} credits have been added to your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-amber-50 border border-[#FFC107] rounded-lg p-4">
        <h4 className="font-semibold text-[#1D1D1F] mb-2">Payment Summary</h4>
        <div className="space-y-1 text-sm">
          {packageName && (
            <div className="flex justify-between">
              <span className="text-[#1D1D1F]/80">Package:</span>
              <span className="font-medium text-[#1D1D1F]">{packageName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#1D1D1F]/80">Credits:</span>
            <span className="font-medium text-[#1D1D1F]">{credits} credits</span>
          </div>
          <div className="flex justify-between border-t border-[#FFC107] pt-1 mt-2">
            <span className="font-semibold text-[#1D1D1F]">Total:</span>
            <span className="font-semibold text-[#1D1D1F]">£{amount.toFixed(2)}</span>
          </div>
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
              Pay £{amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  credits, 
  packageName, 
  onSuccess 
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && amount > 0) {
      createPaymentIntent();
    }
  }, [isOpen, amount, credits]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await StripeService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert pounds to pence
        credits,
        description: packageName ? `${packageName} - ${credits} credits` : `${credits} credits`
      });

      setClientSecret(result.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  const stripePromise = StripeService.getStripe();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#135084]" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#135084]" />
            <p className="text-gray-600 mt-2">Initializing payment...</p>
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
            <PaymentForm
              amount={amount}
              credits={credits}
              packageName={packageName}
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
