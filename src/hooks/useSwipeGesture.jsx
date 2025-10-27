import { useRef, useState, useCallback } from 'react';

/**
 * Custom hook for handling swipe gestures using Pointer Events API
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {Function} options.onSwipeUp - Callback for up swipe
 * @param {Function} options.onSwipeDown - Callback for down swipe
 * @param {number} options.threshold - Minimum distance in pixels to trigger swipe (default: 50)
 * @param {number} options.velocityThreshold - Minimum velocity in px/ms to trigger swipe (default: 0.3)
 * @returns {Object} - { handlers, isDragging }
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
}) {
  const [isDragging, setIsDragging] = useState(false);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const startTime = useRef(0);
  const pointerId = useRef(null);

  const handlePointerDown = useCallback((e) => {
    // Only process primary pointer (first finger on touch screen)
    if (!e.isPrimary) return;

    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    startTime.current = Date.now();
    pointerId.current = e.pointerId;
    setIsDragging(true);

    // Capture pointer for smooth tracking
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!e.isPrimary || !isDragging || pointerId.current !== e.pointerId) return;

    lastX.current = e.clientX;
    lastY.current = e.clientY;
  }, [isDragging]);

  const handlePointerUp = useCallback((e) => {
    if (!e.isPrimary || pointerId.current !== e.pointerId) return;

    const dx = lastX.current - startX.current;
    const dy = lastY.current - startY.current;
    const dt = Date.now() - startTime.current;
    
    // Calculate distance and velocity
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = dt > 0 ? distance / dt : 0;

    // Determine if movement is mostly horizontal or vertical
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    // Check if swipe meets threshold requirements
    const meetsThreshold = distance > threshold || velocity > velocityThreshold;

    if (meetsThreshold) {
      if (isHorizontal) {
        // Horizontal swipe
        if (dx < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (dx > 0 && onSwipeRight) {
          onSwipeRight();
        }
      } else {
        // Vertical swipe
        if (dy < 0 && onSwipeUp) {
          onSwipeUp();
        } else if (dy > 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    }

    // Reset state
    setIsDragging(false);
    pointerId.current = null;

    // Release pointer capture
    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore errors if pointer was already released
      }
    }
  }, [isDragging, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handlePointerCancel = useCallback((e) => {
    if (!e.isPrimary || pointerId.current !== e.pointerId) return;

    setIsDragging(false);
    pointerId.current = null;

    // Release pointer capture
    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore errors if pointer was already released
      }
    }
  }, []);

  const handlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };

  return { handlers, isDragging };
}
