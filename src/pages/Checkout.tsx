import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, Loader2 as LoaderIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Payment Form Component (uses Stripe Elements)
function CheckoutForm({ 
  total, 
  onSuccess 
}: { 
  total: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings?payment_success=true`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#145484] hover:bg-[#145484]/90 h-12 text-lg font-semibold btn-glisten"
      >
        {isProcessing ? (
          <>
            <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay £${total.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { items, removeItem, updateQuantity, getSubtotal, getVAT, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'collection'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('123 Workshop Lane, Anytown');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loadingPaymentIntent, setLoadingPaymentIntent] = useState(false);

  const deliveryFee = deliveryOption === 'delivery' ? 15 : 0;
  const subtotal = getSubtotal();
  const vat = getVAT() + (deliveryFee * 0.20);
  const total = subtotal + deliveryFee + vat;

  // Create payment intent when component loads
  useEffect(() => {
    if (items.length > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [items.length]);

  const createPaymentIntent = async () => {
    setLoadingPaymentIntent(true);
    
    try {
      const response = await fetch('/api/stripe/create-glass-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          userId: user?.id,
          items: items.map(item => ({
            partNumber: item.partNumber,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            supplier: item.supplier,
          })),
          deliveryOption,
          deliveryFee,
          subtotal,
          vat,
        })
      });

      const result = await response.json();
      
      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        throw new Error(result.error || 'Failed to create payment intent');
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: `Your order for £${total.toFixed(2)} has been placed successfully`,
    });
    clearCart();
    navigate('/');
  };

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Add some glass products to get started</p>
              <Button onClick={() => navigate('/glass-order')} className="touch-target">
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Windscreen Compare</h1>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Checkout</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Main Checkout Flow */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Step 1: Delivery/Collection */}
              <Card className="shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#145484] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      1
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Delivery / Collection</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <button
                      onClick={() => setDeliveryOption('delivery')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all touch-target ${
                        deliveryOption === 'delivery'
                          ? 'border-[#145484] bg-[#145484]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-bold mb-1 text-sm sm:text-base">Delivery</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{deliveryAddress}</p>
                    </button>

                    <button
                      onClick={() => setDeliveryOption('collection')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all touch-target ${
                        deliveryOption === 'collection'
                          ? 'border-[#145484] bg-[#145484]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-bold mb-1 text-sm sm:text-base">Collection</h4>
                      <p className="text-xs sm:text-sm text-gray-600">From GlassCorp Depot</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Part Details */}
              <Card className="shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#145484] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      2
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Part Details</h3>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-md transition-shadow">
                        {/* Mobile Layout - Stacked */}
                        <div className="block sm:hidden space-y-3">
                          {/* Part info */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-[#145484]/10 px-2 py-1 rounded-md">
                                <span className="font-mono text-xs font-semibold text-[#145484]">
                                  {item.partNumber}
                                </span>
                              </div>
                              {item.supplier && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {item.supplier}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-medium text-sm text-gray-900 mb-1">
                              {item.description}
                            </h4>
                            
                            {item.vehicleInfo && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {item.vehicleInfo}
                              </div>
                            )}
                          </div>

                          {/* Price and controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Quantity controls */}
                              <div className="flex items-center gap-2 border rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors touch-target"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4 text-gray-600" />
                                </button>
                                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors touch-target"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>

                              {/* Total price */}
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Total</div>
                                <div className="text-lg font-bold text-[#145484]">
                                  £{(item.unitPrice * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors touch-target"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Desktop Layout - Horizontal */}
                        <div className="hidden sm:flex items-start justify-between gap-4">
                          {/* Left side - Part info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-[#145484]/10 px-3 py-1 rounded-md">
                                <span className="font-mono text-sm font-semibold text-[#145484]">
                                  {item.partNumber}
                                </span>
                              </div>
                              {item.supplier && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {item.supplier}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-medium text-gray-900 mb-1">
                              {item.description}
                            </h4>
                            
                            {item.vehicleInfo && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {item.vehicleInfo}
                              </div>
                            )}
                          </div>

                          {/* Right side - Price and actions */}
                          <div className="flex items-center gap-4">
                            {/* Quantity controls */}
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Quantity</span>
                              <div className="flex items-center gap-2 border rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4 text-gray-600" />
                                </button>
                                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex flex-col items-end gap-1 min-w-[100px]">
                              <span className="text-xs text-gray-500">Unit Price</span>
                              <span className="text-sm font-medium text-gray-700">
                                £{item.unitPrice.toFixed(2)}
                              </span>
                              <div className="h-px w-full bg-gray-200 my-1"></div>
                              <span className="text-xs text-gray-500">Total</span>
                              <span className="text-lg font-bold text-[#145484]">
                                £{(item.unitPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Payment Options */}
              <Card className="shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#145484] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      3
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Payment Options</h3>
                  </div>

                  {loadingPaymentIntent ? (
                    <div className="flex items-center justify-center py-12">
                      <LoaderIcon className="h-8 w-8 animate-spin text-[#145484]" />
                      <span className="ml-3 text-gray-600">Loading payment options...</span>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#145484',
                          borderRadius: '8px',
                        }
                      }
                    }}>
                      <CheckoutForm total={total} onSuccess={handlePaymentSuccess} />
                    </Elements>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load payment options. Please try again.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg lg:sticky lg:top-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#145484] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      4
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Order Summary</h3>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                      <span>Delivery</span>
                      <span className="font-medium">£{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                      <span>VAT (20%)</span>
                      <span className="font-medium">£{vat.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 sm:pt-3">
                      <div className="flex justify-between text-lg sm:text-xl font-bold">
                        <span>Total</span>
                        <span>£{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-4 sm:mb-6">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 cursor-pointer leading-relaxed">
                      I have read and agree to the{' '}
                      <a href="#" className="text-[#145484] hover:underline">
                        Terms & Conditions
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-[#145484] hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </label>
                  </div>

                  {!agreedToTerms && (
                    <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-amber-700">
                        Please agree to the Terms & Conditions to proceed with payment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

