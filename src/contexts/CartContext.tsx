import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  partNumber: string;
  description: string;
  unitPrice: number;
  quantity: number;
  supplier?: string;
  vehicleInfo?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getVAT: () => number;
  itemCount: number;
  isAnimating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('glassCart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('glassCart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        // Update quantity if item already exists
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const getVAT = () => {
    return getSubtotal() * 0.20; // 20% VAT
  };

  const getTotal = () => {
    return getSubtotal() + getVAT();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getSubtotal,
      getVAT,
      itemCount,
      isAnimating,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

