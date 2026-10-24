'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distancePx?: number;
  threshold?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
  delayMs = 0,
  durationMs = 700,
  direction = 'up',
  distancePx = 32,
  threshold = 0.08,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    // Check if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  const getTransform = () => {
    if (isVisible) return 'none';
    switch (direction) {
      case 'up':
        return `translateY(${distancePx}px)`;
      case 'down':
        return `translateY(-${distancePx}px)`;
      case 'left':
        return `translateX(${distancePx}px)`;
      case 'right':
        return `translateX(-${distancePx}px)`;
      case 'none':
      default:
        return 'none';
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delayMs}ms`,
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        willChange: 'opacity, transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
