/**
 * Framer Motion wrapper components — consistent, respects prefers-reduced-motion.
 *
 * Usage:
 *   <FadeIn><MyComponent /></FadeIn>
 *   <SlideUp delay={0.1}><Hero /></SlideUp>
 *   <Stagger><Card /><Card /><Card /></Stagger>
 *
 * Reduced-motion: when user prefers reduced motion, transitions are
 * effectively instant (duration 0). Framer Motion respects
 * `useReducedMotion()` automatically if wired.
 */

import {motion, useReducedMotion, type HTMLMotionProps} from 'framer-motion';
import type {ReactNode} from 'react';

type BaseProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
};

export function FadeIn({children, delay = 0, duration = 0.35, className}: BaseProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      transition={{
        delay: reduce ? 0 : delay,
        duration: reduce ? 0 : duration,
        ease: [0, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({
  children,
  delay = 0,
  duration = 0.4,
  className,
}: BaseProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{opacity: 0, y: reduce ? 0 : 16}}
      animate={{opacity: 1, y: 0}}
      transition={{
        delay: reduce ? 0 : delay,
        duration: reduce ? 0 : duration,
        ease: [0, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  delayChildren = 0.1,
  staggerChildren = 0.08,
  className,
}: BaseProps & {
  delayChildren?: number;
  staggerChildren?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: reduce ? 0 : delayChildren,
            staggerChildren: reduce ? 0 : staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: Pick<BaseProps, 'children' | 'className'>) {
  return (
    <motion.div
      variants={{
        hidden: {opacity: 0, y: 12},
        visible: {opacity: 1, y: 0, transition: {duration: 0.35, ease: [0, 0, 0.2, 1]}},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export motion for ad-hoc use.
export {motion};
export type {HTMLMotionProps};
