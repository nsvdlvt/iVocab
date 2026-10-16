import { type Transition, type Variants } from "framer-motion";

/**
 * Vocabee Premium Motion Design System
 * Carefully tuned easing curves, GPU-accelerated transforms, and reduced-motion fallbacks.
 */

// Easing curves
export const EASING = {
  // Smooth organic cubic bezier for natural page elements
  smooth: [0.22, 1, 0.36, 1] as const,
  // Snappy spring-like easing for interactive controls and mascots
  spring: [0.34, 1.56, 0.64, 1] as const,
  // Soft gentle easing for hover effects
  soft: [0.25, 0.1, 0.25, 1] as const,
  // Premium decelerate for entrances
  decelerate: [0.05, 0.7, 0.1, 1] as const,
};

// Standard transitions
export const TRANSITIONS = {
  default: {
    duration: 0.35,
    ease: EASING.smooth,
  } satisfies Transition,
  slow: {
    duration: 0.5,
    ease: EASING.smooth,
  } satisfies Transition,
  bouncy: {
    type: "spring",
    stiffness: 400,
    damping: 25,
  } satisfies Transition,
  gentleFloat: {
    duration: 3.6,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut",
  } satisfies Transition,
  celebrationBounce: {
    type: "spring",
    stiffness: 500,
    damping: 18,
  } satisfies Transition,
};

// Container stagger variants
export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Fade in
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: TRANSITIONS.default,
  },
};

// Fade In Up
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.default,
  },
};

// Fade In Down
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.default,
  },
};

// Scale In (for badges, dialogs, mascot bubbles)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 22,
    },
  },
};

// Mascot hover / tap interactions
export const mascotInteractions = {
  hover: {
    scale: 1.05,
    rotate: [0, -3, 3, 0],
    transition: { duration: 0.4 },
  },
  tap: {
    scale: 0.94,
    y: 2,
    transition: { duration: 0.1 },
  },
};

// Mascot celebration jump
export const mascotCelebrate: Variants = {
  initial: { y: 0, scale: 1 },
  celebrate: {
    y: [0, -22, -4, -12, 0],
    rotate: [0, -6, 6, -3, 0],
    scale: [1, 1.12, 0.98, 1.04, 1],
    transition: {
      duration: 0.85,
      ease: EASING.spring,
    },
  },
};

// Card lift hover effect
export const cardHoverProps = {
  whileHover: {
    y: -4,
    boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.08)",
    transition: { duration: 0.2, ease: EASING.soft },
  },
  whileTap: {
    scale: 0.99,
    transition: { duration: 0.1 },
  },
};

// Button press effect
export const buttonPressProps = {
  whileTap: {
    scale: 0.96,
    transition: { duration: 0.1 },
  },
};

// Bilingual view fade transitions (prevents layout jumping)
export const bilingualTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: EASING.smooth },
};
