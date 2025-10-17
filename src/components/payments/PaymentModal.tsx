import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle, AlertCircle, Tag, Check, X } from "lucide-react";
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
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [finalAmount, setFinalAmount] = useState(amount);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Coupon Code Required",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setApplyingCoupon(true);

    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          couponCode: couponCode.trim(),
          amount: amount,
        })
      });

      const result = await response.json();
      
      if (result.success && result.valid) {
        setCouponApplied(true);
        
        // Calculate discount
        let discount = 0;
        if (result.coupon.percent_off) {
          discount = (amount * result.coupon.percent_off) / 100;
        } else if (result.coupon.amount_off) {
          discount = result.coupon.amount_off / 100; // Convert from pence
        }
        
        setCouponDiscount(discount);
        setFinalAmount(amount - discount);
        
        toast({
          title: "Coupon Applied!",
          description: result.coupon.percent_off 
            ? `${result.coupon.percent_off}% discount applied`
            : `£${discount.toFixed(2)} discount applied`,
        });
      } else {
        throw new Error(result.error || 'Invalid coupon code');
      }
    } catch (error: any) {
      toast({
        title: "Invalid Coupon",
        description: error.message || "This coupon code is not valid",
        variant: "destructive",
      });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setCouponDiscount(0);
    setFinalAmount(amount);
    toast({
      title: "Coupon Removed",
      description: "The discount has been removed",
    });
  };

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
          {couponApplied && couponDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="font-medium">Discount:</span>
              <span className="font-medium">-£{couponDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[#FFC107] pt-1 mt-2">
            <span className="font-semibold text-[#1D1D1F]">Total:</span>
            <span className="font-semibold text-[#1D1D1F]">£{finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Have a coupon code?
        </label>
        {!couponApplied ? (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1"
              disabled={applyingCoupon}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !couponCode.trim()}
              className="border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white"
            >
              {applyingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Code "{couponCode}" applied
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="h-7 text-gray-600 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
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
          className="flex-1 bg-[#145484] hover:bg-[#145484]/90 text-white btn-glisten"
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
            <CreditCard className="h-5 w-5 text-[#145484]" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#145484]" />
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
                  colorPrimary: '#145484',
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
