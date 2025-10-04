/**
 * Cashout Service
 * Handles all cashout-related API calls using Stripe Payouts API
 */

export interface BankAccountData {
  id?: string;
  account_holder_name: string;
  account_number: string;
  sort_code: string;
  bank_name?: string;
  is_verified?: boolean;
}

export interface CashoutRequestData {
  id?: string;
  amount: number;
  jobs_count: number;
  job_ids: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripe_payout_id?: string;
  requested_at: string;
  completed_at?: string;
  failure_reason?: string;
}

export class CashoutService {
  /**
   * Save or update bank account details
   */
  static async saveBankAccount(
    technicianId: string,
    accountData: BankAccountData
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // TODO: Replace with actual API call when ready
      // For beta: using localStorage
      const bankData = {
        ...accountData,
        id: crypto.randomUUID(),
        is_verified: true,
      };

      localStorage.setItem(`bank_account_${technicianId}`, JSON.stringify(bankData));

      return { success: true, data: bankData };

      /* Production implementation:
      const response = await fetch('/api/cashout/save-bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId,
          ...accountData,
        })
      });

      const result = await response.json();
      return result;
      */
    } catch (error) {
      console.error('Error saving bank account:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get bank account details for a technician
   */
  static async getBankAccount(
    technicianId: string
  ): Promise<{ success: boolean; data?: BankAccountData; error?: string }> {
    try {
      // TODO: Replace with actual API call when ready
      // For beta: using localStorage
      const savedBank = localStorage.getItem(`bank_account_${technicianId}`);
      
      if (savedBank) {
        const data = JSON.parse(savedBank);
        // Mask account number
        data.account_number = `****${data.account_number.slice(-4)}`;
        return { success: true, data };
      }

      return { success: false, error: 'No bank account found' };

      /* Production implementation:
      const response = await fetch('/api/cashout/get-bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId })
      });

      const result = await response.json();
      return result;
      */
    } catch (error) {
      console.error('Error fetching bank account:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove bank account details
   */
  static async removeBankAccount(
    technicianId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Replace with actual API call when ready
      // For beta: using localStorage
      localStorage.removeItem(`bank_account_${technicianId}`);
      return { success: true };

      /* Production implementation:
      const response = await fetch('/api/cashout/remove-bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId })
      });

      const result = await response.json();
      return result;
      */
    } catch (error) {
      console.error('Error removing bank account:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Request a cashout
   */
  static async requestCashout(
    technicianId: string,
    jobIds: string[],
    amount: number
  ): Promise<{ success: boolean; data?: CashoutRequestData; error?: string; message?: string }> {
    try {
      // Validate minimum amount
      if (amount < 20) {
        return { 
          success: false, 
          error: 'Minimum cashout amount is £20.00' 
        };
      }

      // TODO: Replace with actual API call when ready
      // For beta: mock implementation
      const cashoutRequest: CashoutRequestData = {
        id: crypto.randomUUID(),
        amount,
        jobs_count: jobIds.length,
        job_ids: jobIds,
        status: 'pending',
        requested_at: new Date().toISOString(),
      };

      return { 
        success: true, 
        data: cashoutRequest,
        message: `Payout of £${amount.toFixed(2)} initiated to your bank account`
      };

      /* Production implementation:
      const response = await fetch('/api/cashout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId,
          jobIds,
          amount,
        })
      });

      const result = await response.json();
      return result;
      */
    } catch (error) {
      console.error('Error requesting cashout:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get cashout history for a technician
   */
  static async getCashoutHistory(
    technicianId: string
  ): Promise<{ success: boolean; data?: CashoutRequestData[]; error?: string }> {
    try {
      // TODO: Replace with actual API call when ready
      // For beta: mock data
      const mockHistory: CashoutRequestData[] = [
        {
          id: '1',
          amount: 450.00,
          jobs_count: 3,
          job_ids: ['job1', 'job2', 'job3'],
          status: 'completed',
          requested_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          amount: 280.00,
          jobs_count: 2,
          job_ids: ['job4', 'job5'],
          status: 'processing',
          requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];

      return { success: true, data: mockHistory };

      /* Production implementation:
      const response = await fetch('/api/cashout/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId })
      });

      const result = await response.json();
      return result;
      */
    } catch (error) {
      console.error('Error fetching cashout history:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Calculate payout amount after platform fee
   */
  static calculatePayoutAmount(jobPrice: number, platformFeePercent: number = 15): number {
    const fee = jobPrice * (platformFeePercent / 100);
    return jobPrice - fee;
  }

  /**
   * Validate UK bank account number
   */
  static validateAccountNumber(accountNumber: string): boolean {
    // UK account numbers are 8 digits
    return /^\d{8}$/.test(accountNumber);
  }

  /**
   * Validate UK sort code
   */
  static validateSortCode(sortCode: string): boolean {
    // UK sort codes are in format XX-XX-XX
    return /^\d{2}-\d{2}-\d{2}$/.test(sortCode);
  }

  /**
   * Format sort code with dashes
   */
  static formatSortCode(sortCode: string): string {
    const digits = sortCode.replace(/\D/g, '');
    if (digits.length >= 6) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
    }
    return sortCode;
  }
}

