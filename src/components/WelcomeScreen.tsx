import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  userName?: string;
}

export const WelcomeScreen = ({ userName = "Alex Wonder" }: WelcomeScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Show welcome screen for 2 seconds before starting fade
    const fadeDelay = setTimeout(() => {
      // Gradually reduce opacity over 3 seconds
      const startTime = Date.now();
      const duration = 3000; // 3 seconds fade

      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newOpacity = 1 - (elapsed / duration);
        
        if (elapsed >= duration) {
          setOpacity(0);
          setIsVisible(false);
          clearInterval(fadeInterval);
        } else {
          setOpacity(newOpacity);
        }
      }, 16); // Update roughly every frame

      return () => clearInterval(fadeInterval);
    }, 2000);

    return () => clearTimeout(fadeDelay);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{ opacity }}
      className={`fixed inset-0 z-50 flex items-center justify-center 
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
        transition-opacity duration-[3000ms] ease-out`}
    >
      <div className="text-center scale-in">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-[#0D9488]/70 
          animate-pulse shadow-glow"
        >
          Hello, {userName}
        </h1>
        <div className="mt-4 text-[#0D9488]/50 text-lg md:text-xl animate-pulse">
          Welcome to Glass Trade Hub
        </div>
      </div>
    </div>
  );
}; 