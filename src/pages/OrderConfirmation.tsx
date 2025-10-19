import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, Truck, MapPin, Phone, Mail, Calendar, FileText, Link2, UserCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { LinkOrderToJob } from "@/components/orders/LinkOrderToJob";
import { PageTransition } from "@/components/PageTransition";

interface GlassOrder {
  id: string;
  order_number: string;
  items: any[];
  vrn?: string;
  make?: string;
  model?: string;
  year?: string;
  subtotal: number;
  vat: number;
  delivery_fee: number;
  total_amount: number;
  delivery_option: 'delivery' | 'collection';
  delivery_address?: string;
  collection_address?: string;
  payment_status: string;
  order_status: string;
  supplier?: string;
  depot_name?: string;
  created_at: string;
  job_id?: string | null;
  customer_name?: string | null;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<GlassOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const fetchOrder = async () => {
    if (!orderId || !user?.id) {
      navigate('/glass-order');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('glass_orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setOrder(data as GlassOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/glass-order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId, user, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0FB8C1]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden p-4 md:p-8">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full animate-bounce shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-light text-gray-900">Order Confirmed<span className="text-green-500">!</span></h1>
            <p className="text-lg text-gray-600 font-light">
              Thank you for your order. We'll process it right away.
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="shadow-xl border-2 border-green-200">
            <CardContent className="p-8">
              {/* Order Number */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Number</p>
                    <p className="text-2xl font-bold text-gray-900">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {order.vrn && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#0FB8C1]" />
                    Vehicle Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-lg font-bold text-gray-900">
                      {order.make} {order.model} {order.year && `(${order.year})`}
                    </p>
                    <p className="text-sm text-gray-600">Registration: {order.vrn}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0FB8C1]" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.description}</p>
                        <p className="text-sm text-gray-600">Part Number: {item.partNumber}</p>
                        <p className="text-sm text-gray-600">Supplier: {item.supplier || order.supplier || 'Master Auto Glass'}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">£{(item.unitPrice * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">£{item.unitPrice.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  {order.delivery_option === 'delivery' ? (
                    <Truck className="w-5 h-5 text-[#0FB8C1]" />
                  ) : (
                    <MapPin className="w-5 h-5 text-[#0FB8C1]" />
                  )}
                  {order.delivery_option === 'delivery' ? 'Delivery' : 'Collection'} Details
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">
                    {order.delivery_option === 'delivery' ? 'Delivery Address' : 'Collection From'}
                  </p>
                  <p className="text-gray-700">
                    {order.delivery_option === 'delivery' 
                      ? order.delivery_address || '(Branch of your choice)'
                      : order.collection_address || 'Unit 1, 69 Millmarsh Lane, Enfield EN3 7UY'}
                  </p>
                  {order.depot_name && (
                    <p className="text-sm text-gray-600 mt-2">
                      Depot: {order.depot_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>£{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.delivery_fee > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Fee</span>
                      <span>£{order.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>VAT (20%)</span>
                    <span>£{order.vat.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>£{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Payment Successful</p>
                    <p className="text-sm text-green-700">
                      Your order has been confirmed and paid
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Linking Section */}
              <div className="mb-6">
                {order.job_id && order.customer_name ? (
                  <div className="bg-teal-50 border-2 border-[#0FB8C1] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0FB8C1] rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Linked to Active Job</p>
                          <p className="text-sm text-gray-700">
                            Customer: <span className="font-medium">{order.customer_name}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowLinkDialog(true)}
                        variant="outline"
                        size="sm"
                        className="border-[#0FB8C1] text-[#0FB8C1] hover:bg-[#0FB8C1] hover:text-white"
                      >
                        Change Job
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Link2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Link to Active Job</p>
                          <p className="text-sm text-gray-700">
                            Associate this order with one of your active jobs
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowLinkDialog(true)}
                        className="bg-[#0FB8C1] hover:bg-[#0d9da5] text-white"
                      >
                        Assign to Job
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0FB8C1] font-bold">1.</span>
                    <span>You'll receive an order confirmation email shortly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0FB8C1] font-bold">2.</span>
                    <span>Your glass will be prepared for {order.delivery_option === 'delivery' ? 'delivery' : 'collection'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0FB8C1] font-bold">3.</span>
                    <span>Expected delivery/collection: Next working day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0FB8C1] font-bold">4.</span>
                    <span>You can track your order in the History section</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/history')}
              className="bg-[#0FB8C1] hover:bg-[#0d9da5] text-white h-12 px-8 text-lg font-semibold"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Order History
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/glass-order')}
              className="border-[#0FB8C1] text-[#0FB8C1] hover:bg-[#0FB8C1] hover:text-white h-12 px-8 text-lg font-semibold"
            >
              Place Another Order
            </Button>
          </div>

          {/* Contact Support */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#0FB8C1]" />
                  <div>
                    <p className="text-sm text-gray-600">Call Us</p>
                    <p className="font-semibold text-gray-900">0</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#0FB8C1]" />
                  <div>
                    <p className="text-sm text-gray-600">Email Us</p>
                    <p className="font-semibold text-gray-900">hello@windscreencompare.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Link Order Dialog */}
      {orderId && (
        <LinkOrderToJob
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          orderId={orderId}
          currentJobId={order?.job_id}
          onSuccess={fetchOrder}
        />
      )}
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default OrderConfirmation;

