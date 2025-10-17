import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, Clock, CheckCircle2, AlertCircle, Loader2, TrendingUp, Calendar, Banknote, Building2, CreditCard, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CompletedJob {
  id: string;
  job_id: string;
  status: string;
  completed_at: string;
  job: {
    id: string;
    full_name: string;
    quote_price: number;
    service_type: string;
    appointment_date: string;
    vehicle_reg: string;
  };
  payout_status?: 'pending' | 'processing' | 'paid';
  payout_amount?: number;
}

interface CashoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  completed_at?: string;
  jobs_count: number;
}

interface StripeConnectAccount {
  account_id: string;
  connected_at: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  email?: string;
}

export function CashoutSettings() {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [cashoutHistory, setCashoutHistory] = useState<CashoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [stripeAccount, setStripeAccount] = useState<StripeConnectAccount | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCompletedJobs();
      fetchCashoutHistory();
      fetchStripeAccount();
    }
  }, [user?.id]);

  const fetchCompletedJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch technician's completed jobs
      const response = await fetch('/api/technician/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: user.id })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Filter only completed jobs that haven't been cashed out
        const completed = result.data
          .filter((assignment: any) => 
            assignment.status === 'completed' && 
            assignment.MasterCustomer?.quote_price > 0
          )
          .map((assignment: any) => ({
            id: assignment.id,
            job_id: assignment.job_id,
            status: assignment.status,
            completed_at: assignment.completed_at,
            job: {
              id: assignment.MasterCustomer.id,
              full_name: assignment.MasterCustomer.full_name,
              quote_price: assignment.MasterCustomer.quote_price,
              service_type: assignment.MasterCustomer.service_type,
              appointment_date: assignment.MasterCustomer.appointment_date,
              vehicle_reg: assignment.MasterCustomer.vehicle_reg,
            },
            payout_status: 'pending', // Mock status for beta
            payout_amount: calculatePayoutAmount(assignment.MasterCustomer.quote_price),
          }));

        setCompletedJobs(completed);
      }
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch completed jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCashoutHistory = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/cashout/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setCashoutHistory(result.data);
      } else {
        setCashoutHistory([]);
      }
    } catch (error) {
      console.error('Error fetching cashout history:', error);
      setCashoutHistory([]);
    }
  };

  const fetchStripeAccount = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/stripe/connect/account-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();
      
      if (result.success && result.connected && result.account) {
        setStripeAccount(result.account);
      } else {
        setStripeAccount(null);
      }
    } catch (error) {
      console.error('Error fetching Stripe account:', error);
      setStripeAccount(null);
    }
  };

  const handleConnectStripe = async () => {
    if (!user?.id) return;
    
    setConnectingStripe(true);

    try {
      const response = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create account link');
      }

      toast({
        title: "Opening Stripe Connect",
        description: "Redirecting to Stripe onboarding...",
      });

      // Redirect to Stripe onboarding
      window.location.href = result.url;

    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Stripe account. Please try again.",
        variant: "destructive",
      });
      setConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? You will not be able to receive payouts until you reconnect.')) {
      return;
    }

    try {
      const response = await fetch('/api/stripe/connect/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to disconnect');
      }

      setStripeAccount(null);
      toast({
        title: "Stripe Disconnected",
        description: "Your Stripe account has been disconnected successfully",
      });
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Stripe account",
        variant: "destructive",
      });
    }
  };

  const handleManageStripeAccount = async () => {
    if (!user?.id || !stripeAccount) return;

    try {
      // Create login link for Stripe Express Dashboard
      const response = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();
      
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to open Stripe dashboard",
        variant: "destructive",
      });
    }
  };

  const calculatePayoutAmount = (jobPrice: number): number => {
    // Mock calculation: 85% of job price (15% platform fee)
    return jobPrice * 0.85;
  };

  const getTotalPendingAmount = (): number => {
    return completedJobs
      .filter(job => selectedJobs.has(job.id))
      .reduce((sum, job) => sum + (job.payout_amount || 0), 0);
  };

  const toggleJobSelection = (jobId: string) => {
    const newSelection = new Set(selectedJobs);
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId);
    } else {
      newSelection.add(jobId);
    }
    setSelectedJobs(newSelection);
  };

  const selectAllJobs = () => {
    if (selectedJobs.size === completedJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(completedJobs.map(job => job.id)));
    }
  };

  const handleCashoutRequest = async () => {
    if (!stripeAccount) {
      toast({
        title: "Stripe Account Required",
        description: "Please connect your Stripe account before requesting a cashout",
        variant: "destructive",
      });
      return;
    }

    if (!stripeAccount.payouts_enabled) {
      toast({
        title: "Payouts Not Enabled",
        description: "Your Stripe account doesn't have payouts enabled yet. Please complete your account setup.",
        variant: "destructive",
      });
      return;
    }

    if (selectedJobs.size === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select at least one job to cash out",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/cashout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          jobIds: Array.from(selectedJobs),
          amount: getTotalPendingAmount(),
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process cashout');
      }

      toast({
        title: "Cashout Request Submitted",
        description: result.message || `Payout of £${getTotalPendingAmount().toFixed(2)} is being processed`,
      });

      // Refresh data
      await fetchCompletedJobs();
      await fetchCashoutHistory();
      setSelectedJobs(new Set());
    } catch (error) {
      console.error('Error requesting cashout:', error);
      toast({
        title: "Cashout Failed",
        description: error.message || "Failed to process cashout request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
          <CardTitle className="text-base sm:text-lg font-semibold">Cashout Settings</CardTitle>
        </CardHeader>
        <CardContent className="mobile-card">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#145484]" />
            <span className="ml-2 text-sm text-gray-600">Loading cashout data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
        <div className="flex-1">
          <CardTitle className="text-base sm:text-lg font-semibold">Cashout Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Manage your earnings and request payouts via Stripe Connect
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mobile-card space-y-6">
        {!stripeAccount && (
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-xs sm:text-sm">
              <strong>Connect with Stripe:</strong> Stripe Connect provides secure, fast payouts directly to your bank account. 
              Complete the simple onboarding process to start receiving payments.
          </AlertDescription>
        </Alert>
        )}

        {/* Stripe Connect Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <svg className="h-5 w-5 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-2.803 0-5.642-1.291-7.194-2.25l-.937 5.57c1.436.8 4.46 1.865 8.381 1.865 2.804 0 5.034-.654 6.57-1.935 1.613-1.344 2.428-3.311 2.428-5.848-.001-3.54-2.058-5.598-6.596-7.797z"/>
              </svg>
              Stripe Connect
            </h3>
          </div>

          {stripeAccount ? (
            <div className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Stripe Account Connected</h4>
                      <p className="text-xs text-gray-500">Ready to receive payouts</p>
                    </div>
                  </div>
                  
                  <div className="ml-13 space-y-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Account ID</span>
                      <span className="font-mono text-xs text-gray-900 bg-white px-2 py-1 rounded border">
                        {stripeAccount.account_id}
                      </span>
                    </div>
                    {stripeAccount.email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Email</span>
                        <span className="font-medium text-gray-900">{stripeAccount.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Connected</span>
                      <span className="font-medium text-gray-900">
                        {new Date(stripeAccount.connected_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 ml-13">
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      stripeAccount.payouts_enabled 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    )}>
                      {stripeAccount.payouts_enabled ? '✓ Payouts Active' : 'Payouts Pending'}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      stripeAccount.details_submitted
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    )}>
                      {stripeAccount.details_submitted ? '✓ Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                    size="sm"
                    onClick={handleManageStripeAccount}
                    className="text-[#145484] border-[#145484]/20 hover:bg-[#145484]/5"
                  >
                    Manage Account
                        </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnectStripe}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white rounded-full border-2 border-gray-200">
                <svg className="h-8 w-8 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-2.803 0-5.642-1.291-7.194-2.25l-.937 5.57c1.436.8 4.46 1.865 8.381 1.865 2.804 0 5.034-.654 6.57-1.935 1.613-1.344 2.428-3.311 2.428-5.848-.001-3.54-2.058-5.598-6.596-7.797z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Connect Your Stripe Account</h4>
              <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto">
                Set up secure payouts in minutes. Stripe handles all the banking details safely.
              </p>
                    <Button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="bg-[#635BFF] hover:bg-[#5851DF] shadow-sm btn-glisten"
              >
                {connectingStripe ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                        </>
                      ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-2.803 0-5.642-1.291-7.194-2.25l-.937 5.57c1.436.8 4.46 1.865 8.381 1.865 2.804 0 5.034-.654 6.57-1.935 1.613-1.344 2.428-3.311 2.428-5.848-.001-3.54-2.058-5.598-6.596-7.797z"/>
                    </svg>
                    Connect with Stripe
                  </>
                      )}
                    </Button>
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-[#145484]" />
              </div>
              <span className="text-sm font-medium text-gray-600">Available to Cashout</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              £{completedJobs.reduce((sum, job) => sum + (job.payout_amount || 0), 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{completedJobs.length} completed jobs</p>
          </div>

          <div className="border rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Processing</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              £{cashoutHistory
                .filter(h => h.status === 'processing')
                .reduce((sum, h) => sum + h.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {cashoutHistory.filter(h => h.status === 'processing').length} requests
            </p>
          </div>

          <div className="border rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Paid Out</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              £{cashoutHistory
                .filter(h => h.status === 'completed')
                .reduce((sum, h) => sum + h.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Lifetime earnings</p>
          </div>
        </div>

        {/* Completed Jobs for Cashout */}
        {completedJobs.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Completed Jobs</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllJobs}
                className="text-xs"
              >
                {selectedJobs.size === completedJobs.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="text-xs">Job Details</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Job Value</TableHead>
                    <TableHead className="text-xs text-right">Your Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedJobs.has(job.id)}
                          onChange={() => toggleJobSelection(job.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#145484] focus:ring-[#145484]"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{job.job.full_name}</p>
                          <p className="text-xs text-gray-500">{job.job.vehicle_reg} • {job.job.service_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-600">
                          {new Date(job.completed_at).toLocaleDateString('en-GB')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-sm">£{job.job.quote_price.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-sm text-green-600">
                          £{job.payout_amount?.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedJobs.size > 0 && (
              <div className="border border-[#145484]/20 bg-gradient-to-r from-[#145484]/5 to-[#145484]/10 rounded-xl p-5">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      £{getTotalPendingAmount().toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Payout will be sent to your Stripe account
                    </p>
                </div>
                <Button
                  onClick={handleCashoutRequest}
                  disabled={processing}
                    className="bg-[#145484] hover:bg-[#145484]/90 shadow-sm h-11 btn-glisten"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4 mr-2" />
                      Request Cashout
                    </>
                  )}
                </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white rounded-full border-2 border-gray-200">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium mb-1">No Completed Jobs</p>
            <p className="text-sm text-gray-500">Jobs you complete will appear here for cashout</p>
          </div>
        )}

        {/* Cashout History */}
        {cashoutHistory.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-base text-gray-900">Payout History</h3>
            <div className="space-y-2">
              {cashoutHistory.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">£{request.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {request.jobs_count} job{request.jobs_count !== 1 ? 's' : ''} • {' '}
                        {new Date(request.requested_at).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

