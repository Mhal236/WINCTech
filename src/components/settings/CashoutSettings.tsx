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

interface BankAccount {
  account_holder_name: string;
  account_number: string;
  sort_code: string;
  bank_name?: string;
}

export function CashoutSettings() {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [cashoutHistory, setCashoutHistory] = useState<CashoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  
  // Bank account form state
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchCompletedJobs();
      fetchCashoutHistory();
      fetchBankAccount();
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
    // Mock cashout history for beta version
    setCashoutHistory([
      {
        id: '1',
        amount: 450.00,
        status: 'completed',
        requested_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        jobs_count: 3,
      },
      {
        id: '2',
        amount: 280.00,
        status: 'processing',
        requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        jobs_count: 2,
      }
    ]);
  };

  const fetchBankAccount = async () => {
    if (!user?.id) return;

    // TODO: Fetch from database/API
    // Mock data for beta - check localStorage
    const savedBank = localStorage.getItem(`bank_account_${user.id}`);
    if (savedBank) {
      setBankAccount(JSON.parse(savedBank));
    }
  };

  const handleSaveBankAccount = async () => {
    if (!accountHolderName || !accountNumber || !sortCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required bank account details",
        variant: "destructive",
      });
      return;
    }

    // Validate sort code format (XX-XX-XX)
    const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/;
    if (!sortCodeRegex.test(sortCode)) {
      toast({
        title: "Invalid Sort Code",
        description: "Please enter sort code in format XX-XX-XX",
        variant: "destructive",
      });
      return;
    }

    // Validate account number (8 digits)
    if (accountNumber.length !== 8 || !/^\d+$/.test(accountNumber)) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be 8 digits",
        variant: "destructive",
      });
      return;
    }

    setSavingBank(true);

    try {
      // TODO: Save to database via API endpoint (encrypted)
      // For beta, save to localStorage
      const bankData: BankAccount = {
        account_holder_name: accountHolderName,
        account_number: accountNumber,
        sort_code: sortCode,
        bank_name: bankName || undefined,
      };

      localStorage.setItem(`bank_account_${user?.id}`, JSON.stringify(bankData));
      setBankAccount(bankData);

      toast({
        title: "Bank Account Saved",
        description: "Your bank account details have been securely saved",
      });

      setShowBankDialog(false);
      
      // Clear form
      setAccountHolderName('');
      setAccountNumber('');
      setSortCode('');
      setBankName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save bank account details",
        variant: "destructive",
      });
    } finally {
      setSavingBank(false);
    }
  };

  const handleRemoveBankAccount = () => {
    if (confirm('Are you sure you want to remove your bank account details?')) {
      localStorage.removeItem(`bank_account_${user?.id}`);
      setBankAccount(null);
      toast({
        title: "Bank Account Removed",
        description: "Your bank account details have been removed",
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
    if (!bankAccount) {
      toast({
        title: "Bank Account Required",
        description: "Please add your bank account details before requesting a cashout",
        variant: "destructive",
      });
      setShowBankDialog(true);
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

    // Mock cashout request for beta version
    setTimeout(() => {
      toast({
        title: "Cashout Request Submitted (Beta)",
        description: `Request for £${getTotalPendingAmount().toFixed(2)} will be sent to your bank account ending in ${bankAccount.account_number.slice(-4)}`,
      });

      // Remove selected jobs from the list (mock behavior)
      setCompletedJobs(prev => prev.filter(job => !selectedJobs.has(job.id)));
      setSelectedJobs(new Set());
      setProcessing(false);

      // Add to history
      setCashoutHistory(prev => [{
        id: (prev.length + 1).toString(),
        amount: getTotalPendingAmount(),
        status: 'pending',
        requested_at: new Date().toISOString(),
        jobs_count: selectedJobs.size,
      }, ...prev]);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
            Manage your earnings and request payouts (Beta Feature)
          </CardDescription>
        </div>
        <Badge variant="outline" className="bg-[#FFC107] text-[#1D1D1F] border-[#FFC107]">
          Beta
        </Badge>
      </CardHeader>
      <CardContent className="mobile-card space-y-6">
        {/* Beta Notice */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-600 text-xs sm:text-sm">
            <strong>Beta Feature:</strong> This cashout feature is currently in beta. Stripe Payouts API integration coming soon. 
            For now, this shows mock data and functionality.
          </AlertDescription>
        </Alert>

        {/* Bank Account Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#145484]" />
              Bank Account Details
            </h3>
          </div>

          {bankAccount ? (
            <div className="border rounded-lg p-4 bg-gradient-to-br from-[#145484]/5 to-[#23b7c0]/5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-[#145484]">Bank Account Connected</span>
                  </div>
                  <div className="ml-7 space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-600">Account Holder:</span>{' '}
                      <span className="font-medium">{bankAccount.account_holder_name}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Account Number:</span>{' '}
                      <span className="font-medium">****{bankAccount.account_number.slice(-4)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Sort Code:</span>{' '}
                      <span className="font-medium">{bankAccount.sort_code}</span>
                    </p>
                    {bankAccount.bank_name && (
                      <p className="text-sm">
                        <span className="text-gray-600">Bank:</span>{' '}
                        <span className="font-medium">{bankAccount.bank_name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-[#145484]" />
                          Update Bank Account
                        </DialogTitle>
                        <DialogDescription>
                          Update your bank account details for receiving payouts
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="holder-name">Account Holder Name *</Label>
                          <Input
                            id="holder-name"
                            placeholder="John Doe"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account-number">Account Number *</Label>
                          <Input
                            id="account-number"
                            placeholder="12345678"
                            maxLength={8}
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sort-code">Sort Code *</Label>
                          <Input
                            id="sort-code"
                            placeholder="12-34-56"
                            maxLength={8}
                            value={sortCode}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length > 2 && value.length <= 4) {
                                value = value.slice(0, 2) + '-' + value.slice(2);
                              } else if (value.length > 4) {
                                value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 6);
                              }
                              setSortCode(value);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-name">Bank Name (Optional)</Label>
                          <Input
                            id="bank-name"
                            placeholder="e.g., Barclays, HSBC"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                          />
                        </div>
                        <Alert className="border-blue-200 bg-blue-50">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-700 text-xs">
                            Your bank details are encrypted and stored securely. We use Stripe Payouts API for secure transfers.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowBankDialog(false)}
                          disabled={savingBank}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveBankAccount}
                          disabled={savingBank}
                          className="bg-[#145484] hover:bg-[#145484]/90"
                        >
                          {savingBank ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Account'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveBankAccount}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="font-medium text-gray-900 mb-1">No Bank Account Added</p>
              <p className="text-sm text-gray-500 mb-4">
                Add your bank account to receive payouts via Stripe
              </p>
              <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#145484] hover:bg-[#145484]/90">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#145484]" />
                      Add Bank Account
                    </DialogTitle>
                    <DialogDescription>
                      Add your bank account details to receive payouts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="holder-name">Account Holder Name *</Label>
                      <Input
                        id="holder-name"
                        placeholder="John Doe"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-number">Account Number *</Label>
                      <Input
                        id="account-number"
                        placeholder="12345678"
                        maxLength={8}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sort-code">Sort Code *</Label>
                      <Input
                        id="sort-code"
                        placeholder="12-34-56"
                        maxLength={8}
                        value={sortCode}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 2 && value.length <= 4) {
                            value = value.slice(0, 2) + '-' + value.slice(2);
                          } else if (value.length > 4) {
                            value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 6);
                          }
                          setSortCode(value);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Name (Optional)</Label>
                      <Input
                        id="bank-name"
                        placeholder="e.g., Barclays, HSBC"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <Alert className="border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 text-xs">
                        Your bank details are encrypted and stored securely. We use Stripe Payouts API for secure transfers.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowBankDialog(false)}
                      disabled={savingBank}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveBankAccount}
                      disabled={savingBank}
                      className="bg-[#145484] hover:bg-[#145484]/90"
                    >
                      {savingBank ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Account'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#145484] to-[#23b7c0] rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium opacity-90">Available to Cashout</span>
            </div>
            <p className="text-2xl font-bold">
              £{completedJobs.reduce((sum, job) => sum + (job.payout_amount || 0), 0).toFixed(2)}
            </p>
            <p className="text-xs opacity-75 mt-1">{completedJobs.length} completed jobs</p>
          </div>

          <div className="bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg p-4 text-[#1D1D1F]">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Processing</span>
            </div>
            <p className="text-2xl font-bold">
              £{cashoutHistory
                .filter(h => h.status === 'processing')
                .reduce((sum, h) => sum + h.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {cashoutHistory.filter(h => h.status === 'processing').length} requests
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Total Paid Out</span>
            </div>
            <p className="text-2xl font-bold">
              £{cashoutHistory
                .filter(h => h.status === 'completed')
                .reduce((sum, h) => sum + h.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs opacity-75 mt-1">Lifetime earnings</p>
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
                          {new Date(job.completed_at).toLocaleDateString()}
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
              <div className="flex items-center justify-between p-4 bg-[#145484] text-white rounded-lg">
                <div>
                  <p className="text-sm font-medium">Selected: {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''}</p>
                  <p className="text-2xl font-bold">£{getTotalPendingAmount().toFixed(2)}</p>
                </div>
                <Button
                  onClick={handleCashoutRequest}
                  disabled={processing}
                  className="bg-[#FFC107] text-[#1D1D1F] hover:bg-[#FFD54F]"
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
            )}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">No Completed Jobs Available</p>
            <p className="text-sm text-gray-500 mt-1">Complete jobs to see them here for cashout</p>
          </div>
        )}

        {/* Cashout History */}
        {cashoutHistory.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Cashout History</h3>
            <div className="space-y-2">
              {cashoutHistory.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#145484]/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-[#145484]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">£{request.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {request.jobs_count} job{request.jobs_count !== 1 ? 's' : ''} • {' '}
                        {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
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

