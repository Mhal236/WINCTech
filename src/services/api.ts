import { API_BASE_URL } from '@/utils/glass-api-config';

export const fetchGlassPriceInfo = async (
  customerCode: string,
  argicCode: string,
  depotCode: string
): Promise<{ success: boolean; priceRecords: any[]; message?: string }> => {
  try {
    console.log(`Fetching price for customer: ${customerCode}, argic: ${argicCode}, depot: ${depotCode}`);
    const response = await fetch(
      `${API_BASE_URL}/api/price-lookup?customerCode=${customerCode}&argicCode=${argicCode}&depotCode=${depotCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error:', errorData);
      return { success: false, priceRecords: [], message: errorData.message || 'Failed to fetch price information' };
    }

    const data = await response.json();
    
    // Ensure the data has the expected structure
    if (!data || !Array.isArray(data)) {
      console.error('Unexpected API response format:', data);
      return { success: false, priceRecords: [], message: 'Invalid response format from server' };
    }

    const processedRecords = data.map((record: any) => ({
      ArgicCode: record.ARGIC || record.ArgicCode || '',
      MagCode: record.MAG || record.MagCode || '',
      Price: record.PRICE || record.Price || 0,
      Qty: record.QTY || record.Qty || 0,
      Description: record.DESCRIPTION || record.Description || '',
      PriceInfo: record.PRICE_INFO || record.PriceInfo || '',
    }));

    console.log('Processed price records:', processedRecords);
    return { success: true, priceRecords: processedRecords };
  } catch (error) {
    console.error('Error fetching price information:', error);
    return { 
      success: false, 
      priceRecords: [], 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}; 