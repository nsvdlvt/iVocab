"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: "rect" | "circle" | "star";
  delay: number;
}

const COLORS = [
  "#F59E0B", // Amber / Vocabee Gold
  "#3B82F6", // Royal Blue
  "#10B981", // Emerald Green
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#FBBF24", // Honey Yellow
];

interface MascotCelebrationProps {
  active: boolean;
  particleCount?: number;
  duration?: number;
}

export function MascotCelebration({
  active,
  particleCount = 36,
  duration = 3200,
}: MascotCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const generated: Particle[] = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 440,
      y: -(Math.random() * 220 + 80),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * 720 - 360,
      shape: i % 3 === 0 ? "star" : i % 2 === 0 ? "circle" : "rect",
      delay: Math.random() * 0.2,
    }));

    setParticles(generated);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, particleCount, duration]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-30 flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: [0, p.x * 0.8, p.x],
              y: [0, p.y, p.y + 160],
              scale: [0, 1.2, 0.7],
              rotate: [0, p.rotation],
            }}
            transition={{
              duration: 2.2,
              delay: p.delay,
              ease: [0.25, 1, 0.5, 1],
            }}
            style={{ position: "absolute" }}
          >
            {p.shape === "circle" && (
              <div
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: "50%",
                }}
              />
            )}
            {p.shape === "rect" && (
              <div
                style={{
                  width: p.size,
                  height: p.size * 0.6,
                  backgroundColor: p.color,
                  borderRadius: 2,
                }}
              />
            )}
            {p.shape === "star" && (
              <svg
                width={p.size * 1.4}
                height={p.size * 1.4}
                viewBox="0 0 24 24"
                fill={p.color}
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
              >
                <path d="M12 2l2.9 6.6 7.1.6-5.3 4.6 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.6 7.1-.6z" />
              </svg>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
