import https from 'node:https';

// API credentials from your environment
const API_URL = 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData';
const API_KEY = '6193cc7a-c1b2-469c-ad41-601c6faa294c';

// Test VRN
const VRN = 'HN11EYW';

// Construct the full URL with query parameters
const url = `${API_URL}?v=2&api_nullitems=1&auth_apikey=${API_KEY}&key_vrm=${VRN}`;

console.log(`Testing vehicle API with VRN: ${VRN}`);
console.log(`Using URL: ${API_URL} (not showing full URL with key)`);

// Make the request
const req = https.get(url, (res) => {
  console.log(`Response status code: ${res.statusCode}`);
  console.log(`Response headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received');
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(data);
      console.log('===== RESPONSE DATA =====');
      
      if (jsonData.Response && jsonData.Response.StatusCode) {
        console.log(`Status code: ${jsonData.Response.StatusCode}`);
      }
      
      if (jsonData.Response && jsonData.Response.StatusMessage) {
        console.log(`Status message: ${jsonData.Response.StatusMessage}`);
      }
      
      // Check if we have vehicle data
      if (jsonData.Response && 
          jsonData.Response.DataItems && 
          jsonData.Response.DataItems.VehicleRegistration) {
        
        const vr = jsonData.Response.DataItems.VehicleRegistration;
        console.log('\n===== VEHICLE DATA =====');
        console.log(`Make: ${vr.Make || 'Not found'}`);
        console.log(`Model: ${vr.Model || 'Not found'}`);
        console.log(`Year: ${vr.YearOfManufacture || 'Not found'}`);
        console.log(`Color: ${vr.Colour || 'Not found'}`);
        console.log(`Fuel Type: ${vr.FuelType || 'Not found'}`);
        console.log(`Engine Capacity: ${vr.EngineCapacity || 'Not found'}`);
      } else {
        console.log('Vehicle registration data not found in response');
        
        // Show structure of the response to debug
        console.log('\n===== RESPONSE STRUCTURE =====');
        Object.keys(jsonData).forEach(key => {
          console.log(`${key}: ${typeof jsonData[key]}`);
          if (typeof jsonData[key] === 'object' && jsonData[key] !== null) {
            Object.keys(jsonData[key]).forEach(subKey => {
              console.log(`  ${subKey}: ${typeof jsonData[key][subKey]}`);
            });
          }
        });
      }
      
      // Show raw response for debugging (truncated)
      const preview = data.length > 500 ? data.substring(0, 500) + '...' : data;
      console.log('\n===== RAW RESPONSE PREVIEW =====');
      console.log(preview);
      
    } catch (error) {
      console.error('Error parsing response as JSON:', error.message);
      console.log('Raw response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end(); 