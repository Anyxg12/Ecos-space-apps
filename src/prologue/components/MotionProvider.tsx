import { LazyMotion, domAnimation } from 'motion/react';
import type { ReactNode } from 'react';

/** Motion en modo ligero (LazyMotion + domAnimation) para reducir el bundle inicial. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
