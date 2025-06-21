import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Animation variants for different transition types
const pageVariants = {
  initial: {
    opacity: 0,
    x: 30,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1], // Custom easing for smooth feel
      staggerChildren: 0.1,
      delayChildren: 0.1, // Add slight delay to help with auth loading
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

// Animation for child elements (cards, forms, etc.)
const childVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      className={`w-full ${className}`}
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      layout
    >
      <motion.div variants={childVariants}>
        {children}
      </motion.div>
    </motion.div>
  );
};

// Alternative transition for modal-like pages (login, signup, etc.)
export const ModalPageTransition = ({ children, className = "" }: PageTransitionProps) => {
  const modalVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    enter: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  return (
    <motion.div
      className={`w-full ${className}`}
      variants={modalVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

// Slide transition for swipe-like interactions
export const SlidePageTransition = ({ children, className = "", direction = "right" }: PageTransitionProps & { direction?: "left" | "right" }) => {
  const slideVariants = {
    initial: {
      opacity: 0,
      x: direction === "right" ? 100 : -100,
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
      },
    },
    exit: {
      opacity: 0,
      x: direction === "right" ? -100 : 100,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  return (
    <motion.div
      className={`w-full ${className}`}
      variants={slideVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}; 