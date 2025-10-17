# Glass Cart & Checkout System Guide

## Overview

The cart system allows users to add glass products to a shopping cart and proceed through a complete checkout flow similar to modern e-commerce platforms.

## Features

✅ **Cart Management**
- Add items to cart
- Update quantities
- Remove items
- Persistent cart (stored in localStorage)
- Real-time cart count badge

✅ **Checkout Page**
- Delivery/Collection options
- Detailed part listing
- Multiple payment methods (Credits, Card, Klarna, Finance)
- Order summary with VAT calculation
- Terms & Conditions agreement

✅ **Cart Icon**
- Located in the top-right of the sidebar (admin users only)
- Shows item count badge
- Clickable to navigate to checkout

## Usage

### 1. Adding Items to Cart

Use the `AddToCartButton` component:

```tsx
import { AddToCartButton } from "@/components/cart/AddToCartButton";

<AddToCartButton
  partNumber="WSC-12345"
  description="VW Golf Mk7 Windscreen (Heated, Rain Sensor)"
  unitPrice={220.00}
  quantity={1}
  supplier="Master Auto Glass"
  vehicleInfo="VW Golf Mk7 2013-2020"
/>
```

### 2. Using Cart Context Directly

For custom implementations:

```tsx
import { useCart } from "@/contexts/CartContext";

function MyComponent() {
  const { addItem, items, itemCount, getTotal } = useCart();

  const handleAdd = () => {
    addItem({
      id: `part-${Date.now()}`,
      partNumber: "WSC-12345",
      description: "Windscreen",
      unitPrice: 220.00,
      quantity: 1,
    });
  };

  return (
    <div>
      <p>Cart has {itemCount} items</p>
      <p>Total: £{getTotal().toFixed(2)}</p>
      <button onClick={handleAdd}>Add to Cart</button>
    </div>
  );
}
```

### 3. Cart Methods

```tsx
const {
  items,              // Array of cart items
  addItem,            // Add item to cart
  removeItem,         // Remove item by ID
  updateQuantity,     // Update item quantity
  clearCart,          // Empty the cart
  getSubtotal,        // Get subtotal (before VAT)
  getVAT,             // Get VAT amount (20%)
  getTotal,           // Get total with VAT
  itemCount,          // Total number of items
} = useCart();
```

## Example: Glass Product Card with Cart

```tsx
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

function GlassProductCard({ product }) {
  return (
    <Card className="p-4">
      <h3 className="font-bold">{product.description}</h3>
      <p className="text-gray-600">{product.partNumber}</p>
      <p className="text-lg font-bold mt-2">£{product.price.toFixed(2)}</p>
      
      <AddToCartButton
        partNumber={product.partNumber}
        description={product.description}
        unitPrice={product.price}
        quantity={1}
        className="w-full mt-4"
      />
    </Card>
  );
}
```

## Checkout Flow

1. **User adds items to cart** → Cart count badge updates
2. **Click cart icon** → Navigate to `/checkout`
3. **Select delivery/collection**
4. **Review part details** → Adjust quantities if needed
5. **Choose payment method**
6. **Agree to terms** → Enable "Confirm Order" button
7. **Confirm order** → Process payment & clear cart

## Integration with Existing Pages

### Glass Order Page
Add the `AddToCartButton` to your glass product listings:

```tsx
// In GlassProductList.tsx or similar
{products.map(product => (
  <div key={product.id} className="flex justify-between items-center">
    <div>{product.description}</div>
    <div>£{product.price}</div>
    <AddToCartButton
      partNumber={product.partNumber}
      description={product.description}
      unitPrice={product.price}
    />
  </div>
))}
```

### VRN Search Results
Add cart functionality to search results:

```tsx
<AddToCartButton
  partNumber={result.argicCode}
  description={result.description}
  unitPrice={result.price}
  vehicleInfo={`${result.make} ${result.model}`}
/>
```

## Styling

The cart system uses your existing design system:
- Primary color: `#0D9488` (teal)
- Matches the Windscreen Compare brand
- Responsive on all devices
- Smooth animations and transitions

## Routes

- `/checkout` - Main checkout page (admin required)

## Permissions

Currently, cart functionality is only available to **admin** users. To enable for other roles, update the route protection in `App.tsx`:

```tsx
<Route path="/checkout" element={
  <ProtectedRoute requiredRole="pro-2"> // Change from "admin"
    <Checkout />
  </ProtectedRoute>
} />
```

## Future Enhancements

- Email order confirmation
- Order history
- Save carts for later
- Bulk ordering
- Custom delivery instructions
- Invoice generation

