"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  id?: string;
}

export default function Tooltip({ content, children, id }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

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

  // Viewport-aware positioning: detect overflow and adjust alignment
  useLayoutEffect(() => {
    if (!isOpen || !tooltipRef.current || !containerRef.current) return;

    const checkOverflow = () => {
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      if (tooltipRect.right > viewportWidth) {
        setAlignRight(true);
      } else if (tooltipRect.left < 0) {
        setAlignRight(false); // align left instead of center
      } else {
        setAlignRight(false); // center is fine
      }
    };

    // Measure after the browser paints the tooltip
    requestAnimationFrame(checkOverflow);

    const handleResize = () => requestAnimationFrame(checkOverflow);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

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

      {/* Tooltip popup */}
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        tabIndex={-1}
        className={`absolute bottom-full mb-2 px-2.5 py-1.5 text-xs text-white bg-fifa-blue-900 rounded shadow-lg z-50 transition-opacity duration-150 ${
          alignRight
            ? "right-0 whitespace-nowrap"
            : "left-1/2 -translate-x-1/2 whitespace-nowrap"
        } ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {content}
        {/* Downward arrow */}
        <div
          className={`absolute top-full -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-fifa-blue-900 ${
            alignRight ? "right-4" : "left-1/2 -translate-x-1/2"
          }`}
        />
      </div>
    </div>
  );
}
