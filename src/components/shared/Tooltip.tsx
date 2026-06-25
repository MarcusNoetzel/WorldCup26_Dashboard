"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  id?: string;
}

interface Position {
  top: number;
  left: number;
}

export default function Tooltip({ content, children, id }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  // Guard SSR — only render portal after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute tooltip position from trigger element
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8, // 8px gap above trigger (mb-2 equivalent)
        left: rect.left + rect.width / 2, // center horizontally
      });
    }
  }, []);

  // Position on open and on resize/scroll
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, { passive: true });
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Click-outside dismissal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key dismissal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Tooltip popup content — rendered in portal when mounted
  const tooltipContent = mounted ? (
    createPortal(
      <div
        id={tooltipId}
        role="tooltip"
        tabIndex={-1}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
          marginTop: "-100%", // position above the computed top
        }}
        className={`px-2.5 py-1.5 text-xs text-white bg-fifa-blue-900 rounded shadow-lg whitespace-nowrap z-50 transition-opacity duration-150 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {content}
        {/* Downward arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-fifa-blue-900" />
      </div>,
      document.body
    )
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger */}
      <span
        className="cursor-help flex items-center gap-0.5"
        onClick={handleClick}
        aria-describedby={tooltipId}
      >
        {children}
        <span className="text-[10px] text-gray-400 font-medium" aria-hidden="true">
          ?
        </span>
      </span>

      {/* Tooltip popup rendered in portal */}
      {tooltipContent}
    </div>
  );
}
