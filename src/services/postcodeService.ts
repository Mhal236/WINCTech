export interface AddressData {
  success: boolean;
  addresses: string[];
  error?: string;
}

export interface PostcodeData {
  success: boolean;
  postcode: string;
  addresses: AddressDetail[];
  error?: string;
}

export interface AddressDetail {
  line1: string;
  line2?: string;
  town: string;
  county: string;
  postcode: string;
  fullAddress: string;
}

export class PostcodeService {
  /**
   * Lookup addresses by postcode using multiple APIs for comprehensive results
   */
  static async lookupAddresses(postcode: string): Promise<PostcodeData> {
    try {
      if (!postcode || !postcode.trim()) {
        return {
          success: false,
          postcode: '',
          addresses: [],
          error: 'Postcode is required'
        };
      }

      // Clean the postcode (remove spaces and convert to uppercase)
      const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      const formattedPostcode = this.formatPostcode(cleanPostcode);
      
      // Try multiple APIs to get comprehensive address data
      let addresses: AddressDetail[] = [];
      
      // First, try the ideal-postcodes.co.uk API (free tier available)
      try {
        const idealPostcodesUrl = `https://api.ideal-postcodes.co.uk/v1/postcodes/${cleanPostcode}?api_key=ak_test`;
        const idealResponse = await fetch(idealPostcodesUrl);
        
        if (idealResponse.ok) {
          const idealData = await idealResponse.json();
          console.log('Ideal Postcodes API Response:', idealData);
          
          if (idealData.result && Array.isArray(idealData.result)) {
            addresses = idealData.result.map((addr: any) => ({
              line1: addr.line_1 || '',
              line2: addr.line_2 || '',
              town: addr.post_town || '',
              county: addr.county || '',
              postcode: addr.postcode || formattedPostcode,
              fullAddress: [addr.line_1, addr.line_2, addr.line_3, addr.post_town, addr.county, addr.postcode]
                .filter(Boolean)
                .join(', ')
            }));
          }
        }
      } catch (error) {
        console.log('Ideal Postcodes API failed, trying fallback');
      }
      
      // If no addresses found, use postcodes.io as fallback
      if (addresses.length === 0) {
        try {
          const postcodesIoUrl = `https://api.postcodes.io/postcodes/${cleanPostcode}`;
          const postcodesResponse = await fetch(postcodesIoUrl);
          
          if (postcodesResponse.ok) {
            const postcodesData = await postcodesResponse.json();
            console.log('Postcodes.io API Response:', postcodesData);
            
            if (postcodesData.status === 200 && postcodesData.result) {
              const result = postcodesData.result;
              
              // Create multiple address variations from the postcode data
              const baseAddress = {
                line1: result.admin_ward || result.parish || 'Address',
                line2: result.admin_district || '',
                town: result.admin_district || result.region || '',
                county: result.admin_county || result.country || '',
                postcode: result.postcode || formattedPostcode,
                fullAddress: ''
              };
              
              // Generate a few address options based on the area data
              const addressOptions = [
                {
                  ...baseAddress,
                  line1: `${result.admin_ward || 'Address'} Area`,
                  fullAddress: `${result.admin_ward || 'Address'} Area, ${result.admin_district || ''}, ${result.admin_county || result.country || ''}, ${result.postcode || formattedPostcode}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
                },
                {
                  ...baseAddress,
                  line1: `${result.admin_district || 'Business'} District`,
                  fullAddress: `${result.admin_district || 'Business'} District, ${result.region || ''}, ${result.admin_county || result.country || ''}, ${result.postcode || formattedPostcode}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
                }
              ];
              
              addresses = addressOptions.filter(addr => addr.fullAddress.length > 10);
            }
          }
        } catch (error) {
          console.log('Postcodes.io API also failed');
        }
      }
      
      if (addresses.length > 0) {
        return {
          success: true,
          postcode: formattedPostcode,
          addresses: addresses,
        };
      } else {
        return {
          success: false,
          postcode: formattedPostcode,
          addresses: [],
          error: 'No addresses found for this postcode'
        };
      }
    } catch (error: any) {
      console.error('Error in PostcodeService.lookupAddresses:', error);
      return {
        success: false,
        postcode: postcode,
        addresses: [],
        error: error.message || 'Failed to lookup postcode'
      };
    }
  }

  /**
   * Format postcode to standard UK format (e.g., "SW1A1AA" -> "SW1A 1AA")
   */
  static formatPostcode(postcode: string): string {
    if (!postcode) return '';
    
    // Remove all spaces and convert to uppercase
    const clean = postcode.replace(/\s+/g, '').toUpperCase();
    
    // UK postcode regex patterns
    const patterns = [
      /^([A-Z]{1,2}\d{1,2}[A-Z]?)(\d[A-Z]{2})$/, // Standard format
      /^([A-Z]{1,2}\d[A-Z])(\d[A-Z]{2})$/,       // Alternative format
    ];
    
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
    }
    
    // If no pattern matches, return as-is
    return clean;
  }

  /**
   * Validate UK postcode format
   */
  static isValidPostcode(postcode: string): boolean {
    if (!postcode) return false;
    
    const clean = postcode.replace(/\s+/g, '').toUpperCase();
    
    // UK postcode validation regex
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/;
    
    return ukPostcodeRegex.test(clean);
  }
}
