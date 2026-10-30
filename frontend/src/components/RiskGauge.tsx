import React from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;
  verdict: 'safe' | 'suspicious' | 'phishing';
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, verdict, size = 180 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let strokeColor = '#10B981'; // safe green
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let bgFill = 'rgba(16, 185, 129, 0.05)';

  if (verdict === 'phishing') {
    strokeColor = '#EF4444'; // phishing red
    glowColor = 'rgba(239, 68, 68, 0.5)';
    bgFill = 'rgba(239, 68, 68, 0.08)';
  } else if (verdict === 'suspicious') {
    strokeColor = '#F59E0B'; // suspicious amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    bgFill = 'rgba(245, 158, 11, 0.08)';
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill={bgFill}
        />
        {/* Animated Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: `drop-shadow(0 0 10px ${glowColor})`,
          }}
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: strokeColor }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
          Risk Index
        </span>
      </div>
    </div>
  );
};
