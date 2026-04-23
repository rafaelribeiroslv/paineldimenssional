import React from 'react';
import { motion } from 'motion/react';

export default function AnimatedLogo({ size = 48, color = "#6366f1" }: { size?: number, color?: string }) {
  const particles = Array.from({ length: 8 });
  
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Central Core */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
          filter: ["blur(4px)", "blur(8px)", "blur(4px)"]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      
      {/* Main Star Shape */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
          {/* Fractal Web (Teia) / Dimensional Star */}
          <motion.path
            d="M 50 10 L 60 40 L 90 50 L 60 60 L 50 90 L 40 60 L 10 50 L 40 40 Z"
            fill="white"
            fillOpacity="0.9"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Inner details */}
          <circle cx="50" cy="50" r="4" fill={color} />
        </svg>
      </motion.div>

      {/* Orbiting Particles */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            width: 3, 
            height: 3, 
            backgroundColor: 'white',
            boxShadow: `0 0 4px white`
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.5, 1],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4
          }}
        >
          <div className="w-full h-full" style={{ transform: `translateX(${size/1.5}px)` }} />
        </motion.div>
      ))}

      {/* Pulsing Ring */}
      <motion.div 
        animate={{ 
          scale: [0.8, 1.5],
          opacity: [0.3, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        className="absolute inset-0 border border-white/30 rounded-full"
      />
    </div>
  );
}
