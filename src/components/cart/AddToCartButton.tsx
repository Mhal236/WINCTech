import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  partNumber: string;
  description: string;
  unitPrice: number;
  quantity?: number;
  supplier?: string;
  vehicleInfo?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function AddToCartButton({
  partNumber,
  description,
  unitPrice,
  quantity = 1,
  supplier,
  vehicleInfo,
  className,
  variant = "default",
  size = "default",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    const item = {
      id: `${partNumber}-${Date.now()}`, // Unique ID for cart item
      partNumber,
      description,
      unitPrice,
      quantity,
      supplier,
      vehicleInfo,
    };

    addItem(item);
    
    setAdded(true);
    toast({
      title: "Added to cart",
      description: `${partNumber} has been added to your cart`,
    });

    // Reset animation after 2 seconds
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200",
        added && "bg-green-600 hover:bg-green-700",
        className
      )}
    >
      {added ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}

