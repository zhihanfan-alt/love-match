/**
 * GSAP-powered animation utilities for Canvas game.
 * Provides smooth, professional easing for card movement, UI feedback, and transitions.
 */
import gsap from 'gsap';
import { Position } from '../types';

/** Smooth card slide with overshoot */
export function animateCardMove(
  position: Position,
  target: Position,
  onComplete?: () => void
): gsap.core.Tween {
  return gsap.to(position, {
    x: target.x,
    y: target.y,
    duration: 0.35,
    ease: 'back.out(1.2)',
    onComplete,
  });
}

/** Instant snap (for undo/restore) */
export function animateCardSnap(
  position: Position,
  target: Position,
  onComplete?: () => void
): gsap.core.Tween {
  return gsap.to(position, {
    x: target.x,
    y: target.y,
    duration: 0.15,
    ease: 'power2.out',
    onComplete,
  });
}

/** Click pulse: scale up then back with bounce feel */
export function animateClick(target: { scale: number }): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(target, { scale: 1.2, duration: 0.08, ease: 'power2.out' })
    .to(target, { scale: 1.0, duration: 0.12, ease: 'elastic.out(1, 0.4)' });
  return tl;
}

/** Combo popup: rise + fade */
export function animateComboPopup(
  popup: { y: number; alpha: number },
  startY: number,
  riseAmount: number = 60
): gsap.core.Timeline {
  const tl = gsap.timeline({
    onComplete: () => {
      popup.alpha = 0;
    }
  });
  tl.to(popup, { y: startY - riseAmount, duration: 1.2, ease: 'power2.out' }, 0)
    .to(popup, { alpha: 0, duration: 0.6, ease: 'power1.in' }, 0.6);
  return tl;
}

/** Screen shake effect */
export function animateShake(
  shakeObj: { x: number; y: number },
  intensity: number = 4
): gsap.core.Timeline {
  const tl = gsap.timeline({
    onComplete: () => {
      shakeObj.x = 0;
      shakeObj.y = 0;
    }
  });
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const factor = 1 - (i / steps);
    tl.set(shakeObj, {
      x: (Math.random() - 0.5) * intensity * factor * 2,
      y: (Math.random() - 0.5) * intensity * factor * 2,
    });
  }
  tl.set(shakeObj, { x: 0, y: 0 });
  return tl;
}

/** Overlay fade-in with scale-up */
export function animateOverlayIn(
  overlay: { alpha: number; scale: number },
  duration: number = 0.4
): gsap.core.Timeline {
  overlay.alpha = 0;
  overlay.scale = 0.8;
  const tl = gsap.timeline();
  tl.to(overlay, { alpha: 1, duration, ease: 'power2.out' }, 0)
    .to(overlay, { scale: 1, duration, ease: 'back.out(1.5)' }, 0);
  return tl;
}

/** Hint highlight pulse */
export function animateHintPulse(target: { scale: number }): gsap.core.Tween {
  return gsap.to(target, {
    scale: 1.15,
    duration: 0.3,
    ease: 'power1.inOut',
  });
}

/** Kill all tweens on a target */
export function killTweensOf(target: object): void {
  gsap.killTweensOf(target);
}

export { gsap };
