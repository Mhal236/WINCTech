import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function CartIcon() {
  const { itemCount, isAnimating } = useCart();
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);
  const [showBadge, setShowBadge] = useState(itemCount > 0);

  useEffect(() => {
    if (isAnimating) {
      setShowAnimation(true);
      setShowBadge(false); // Hide badge during animation
      
      // Animation sequence:
      // 1. Circle traces around (800ms)
      // 2. Reaches badge position (900ms)
      // 3. Disappears (1000ms)
      // 4. Badge appears (1100ms)
      const timer1 = setTimeout(() => {
        setShowAnimation(false);
      }, 1000);
      
      const timer2 = setTimeout(() => {
        setShowBadge(true);
      }, 1100);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setShowBadge(itemCount > 0);
    }
  }, [isAnimating, itemCount]);

  return (
    <button
      onClick={() => navigate('/checkout')}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Shopping cart"
    >
      {/* SVG Circle Trace Animation */}
      {showAnimation && (
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          width="44"
          height="44"
          viewBox="0 0 44 44"
          xmlns="http://www.w3.org/2000/svg"
          style={{ zIndex: 15 }}
        >
          {/* Hollow circle that traces from bottom to top-right where badge appears */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#145484"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="113" // Circumference of circle (2 * π * r)
            strokeDashoffset="113"
            className="animate-trace-circle"
          />
          
          <style>{`
            @keyframes trace-circle {
              0% {
                stroke-dashoffset: 113;
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              80% {
                stroke-dashoffset: 0;
                opacity: 1;
              }
              100% {
                stroke-dashoffset: 0;
                opacity: 0;
              }
            }
            
            .animate-trace-circle {
              animation: trace-circle 1s ease-out forwards;
            }
          `}</style>
        </svg>
      )}
      
      <ShoppingCart className="h-6 w-6 text-gray-700 relative z-10" />
      
      {showBadge && (
        <span className={cn(
          "absolute -top-1 -right-1 bg-[#145484] text-white text-xs font-bold",
          "rounded-full h-5 w-5 flex items-center justify-center z-20",
          "animate-in zoom-in duration-200"
        )}>
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

