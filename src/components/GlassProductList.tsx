import React, { useState, useEffect } from 'react';
import { PriceRecord } from '../utils/glassApiService';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

interface GlassProductListProps {
  products: PriceRecord[];
  isLoading: boolean;
  error?: string;
  onSelectProduct: (product: PriceRecord) => void;
}

const GlassProductList: React.FC<GlassProductListProps> = ({
  products,
  isLoading,
  error,
  onSelectProduct
}) => {
  const [selectedProduct, setSelectedProduct] = useState<PriceRecord | null>(null);

  const handleSelectProduct = (product: PriceRecord) => {
    setSelectedProduct(product);
    onSelectProduct(product);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-medium">Error loading glass products</p>
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-gray-700 px-4 py-6 text-center border border-gray-200 rounded-lg">
        <p className="font-medium">No glass products found for this vehicle</p>
        <p className="text-sm mt-2">Please try a different vehicle or check with customer service.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Available Glass Products</h3>
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <div 
            key={product.ArgicCode} 
            className={`border rounded-lg p-4 ${
              selectedProduct?.ArgicCode === product.ArgicCode 
                ? 'border-[#135084] bg-blue-50' 
                : 'border-gray-200 hover:border-[#135084] transition-colors'
            }`}
          >
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{product.Description}</h4>
                <p className="text-sm text-gray-600 mt-1">Code: {product.ArgicCode}</p>
                <p className="text-sm text-gray-600">
                  Available Quantity: <span className="font-medium">{product.Qty}</span>
                </p>
                {product.PriceInfo && (
                  <p className="text-sm text-gray-600 mt-2">{product.PriceInfo}</p>
                )}
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                <div className="text-xl font-semibold">£{product.Price.toFixed(2)}</div>
                <Button
                  variant="primary"
                  className="mt-2 bg-[#135084] hover:bg-[#0e3b61]"
                  onClick={() => handleSelectProduct(product)}
                >
                  {selectedProduct?.ArgicCode === product.ArgicCode 
                    ? "Selected" 
                    : "Select This Option"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlassProductList; 