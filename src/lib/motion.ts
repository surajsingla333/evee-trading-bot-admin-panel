import type { Transition, Variants } from 'framer-motion'

export const easeOut: Transition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1],
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05 },
  },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: easeOut },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: easeOut },
}
