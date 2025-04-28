import React, { useState, useEffect } from 'react';
import * as GlassApiService from '../lib/glass-api-service.js';

export default function ProductSearch() {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [year, setYear] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  // Load all makes when component mounts
  useEffect(() => {
    async function loadMakes() {
      try {
        setLoading(true);
        const result = await GlassApiService.getMakes();
        if (result.success && result.makes) {
          setMakes(result.makes);
        } else {
          setError('Failed to load vehicle makes: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error loading makes:', error);
        setError('Failed to load vehicle makes: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadMakes();
  }, []);

  // Load models when make is selected
  useEffect(() => {
    async function loadModels() {
      if (!selectedMake) {
        setModels([]);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        const result = await GlassApiService.getModels(selectedMake);
        
        if (result.success && result.models) {
          setModels(result.models);
        } else {
          setError('Failed to load models for selected make: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load models for selected make: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadModels();
  }, [selectedMake]);

  const handleMakeChange = (e) => {
    setSelectedMake(e.target.value);
    setSelectedModel('');
    setProducts([]);
    setSearchPerformed(false);
    setVehicleDetails(null);
    setApiResponse(null);
    setError('');
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setProducts([]);
    setSearchPerformed(false);
    setVehicleDetails(null);
    setApiResponse(null);
    setError('');
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
    setProducts([]);
    setSearchPerformed(false);
    setVehicleDetails(null);
    setApiResponse(null);
    setError('');
  };

  const searchProducts = async (e) => {
    e.preventDefault();
    
    if (!selectedMake || !selectedModel || !year) {
      setError('Please select make, model, and year');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setApiResponse(null);
      
      console.log(`Searching for products: ${selectedMake} ${selectedModel} ${year}`);
      const result = await GlassApiService.getAvailableProducts(
        selectedMake, 
        selectedModel, 
        parseInt(year)
      );
      
      // Save the full API response for debugging
      setApiResponse(result);
      
      if (result.success) {
        setProducts(result.products || []);
        setVehicleDetails(result.vehicle || null);
      } else {
        setError(result.error || 'Failed to retrieve products');
      }
      
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching products:', error);
      setError('An error occurred while searching for products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate years from 1990 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-6xl mx-auto mt-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Search Available Glass Products</h2>
      
      <form onSubmit={searchProducts} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make
          </label>
          <select
            value={selectedMake}
            onChange={handleMakeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            disabled={loading}
          >
            <option value="">Select Make</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!selectedMake || loading}
            required
          >
            <option value="">Select Model</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={year}
            onChange={handleYearChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!selectedModel || loading}
            required
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedMake || !selectedModel || !year || loading}
          >
            {loading ? 'Searching...' : 'Search Products'}
          </button>
        </div>
      </form>

      {error && (
        <div className="my-4 p-3 bg-red-100 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {vehicleDetails && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium mb-2">Vehicle Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <span className="font-medium">Make:</span> {vehicleDetails.make}
            </div>
            <div>
              <span className="font-medium">Model:</span> {vehicleDetails.model}
            </div>
            <div>
              <span className="font-medium">Type:</span> {vehicleDetails.modelType || 'Standard'}
            </div>
            <div>
              <span className="font-medium">Year:</span> {vehicleDetails.year}
            </div>
          </div>
        </div>
      )}

      {searchPerformed && !loading && products.length === 0 && !error && (
        <div className="my-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          <p className="font-medium">No products found for the selected vehicle.</p>
          <p className="text-sm mt-1">Try a different make, model, or year, or contact customer support for assistance.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Available Products ({products.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MAG Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ARGIC Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Make
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {product.MagCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {product.ArgicCode}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {product.Description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      £{parseFloat(product.Price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {product.Qty}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {product.Make}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {apiResponse && process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-gray-50 rounded-md">
          <details>
            <summary className="font-medium cursor-pointer">API Response Details (Debug)</summary>
            <pre className="mt-2 p-2 bg-gray-100 text-xs overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
} 