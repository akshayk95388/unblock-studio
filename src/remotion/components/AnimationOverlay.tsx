import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { OverlayEffectType } from '../types';

interface Props {
  effect: OverlayEffectType;
  opacity?: number;
  highlightColor?: string;
}

export const AnimationOverlay: React.FC<Props> = ({
  effect,
  opacity = 0.6,
  highlightColor = '#ffb692',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (effect === 'none') return null;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 12,
        opacity,
        mixBlendMode: 'screen',
      }}
    >
      {effect === 'ambient_particles' && (
        <AmbientParticles frame={frame} color={highlightColor} />
      )}

      {effect === 'glowing_orbs' && (
        <GlowingOrbs frame={frame} color={highlightColor} />
      )}

      {effect === 'cosmic_dust' && (
        <CosmicDust frame={frame} color={highlightColor} />
      )}

      {effect === 'light_leaks' && (
        <LightLeaks frame={frame} color={highlightColor} />
      )}
    </AbsoluteFill>
  );
};

const AmbientParticles: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const particleCount = 20;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const x = (i * 37 + 12) % 100; // distributed X percentage
    const speed = 0.5 + (i % 5) * 0.3;
    const initialY = (i * 53) % 100;
    const y = (initialY - frame * speed + 1000) % 100; // loops bottom to top
    const size = 3 + (i % 6) * 2;
    const particleOpacity = 0.3 + 0.5 * Math.sin(frame * 0.05 + i);

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: particleOpacity,
          boxShadow: `0 0 ${size * 2}px ${color}`,
        }}
      />
    );
  });

  return <>{particles}</>;
};

const GlowingOrbs: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const scale1 = 1 + 0.15 * Math.sin(frame * 0.04);
  const scale2 = 1 + 0.2 * Math.cos(frame * 0.03);
  const opacity1 = 0.4 + 0.2 * Math.sin(frame * 0.05);
  const opacity2 = 0.3 + 0.2 * Math.cos(frame * 0.06);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
          transform: `scale(${scale1})`,
          opacity: opacity1,
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, #7e57c2 0%, rgba(0,0,0,0) 70%)`,
          transform: `scale(${scale2})`,
          opacity: opacity2,
          filter: 'blur(40px)',
        }}
      />
    </>
  );
};

const CosmicDust: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const particleCount = 28;
  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2 + frame * 0.01;
        const radius = 150 + (i % 7) * 45 + Math.sin(frame * 0.03 + i) * 20;
        const x = 50 + (Math.cos(angle) * radius) / 10;
        const y = 45 + (Math.sin(angle) * radius) / 18;
        const size = 2 + (i % 4) * 1.5;
        const opacity = 0.4 + 0.4 * Math.sin(frame * 0.08 + i);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? color : '#e0e7ff',
              opacity,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};

const LightLeaks: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const leakOpacity = 0.3 + 0.3 * Math.sin(frame * 0.03);
  const rot = interpolate(frame, [0, 300], [0, 25], { extrapolateRight: 'extend' });

  return (
    <div
      style={{
        position: 'absolute',
        top: '-20%',
        right: '-20%',
        width: '140%',
        height: '140%',
        background: `linear-gradient(${135 + rot}deg, ${color} 0%, rgba(255, 182, 146, 0) 50%, rgba(236, 72, 153, 0.4) 100%)`,
        opacity: leakOpacity,
        filter: 'blur(50px)',
      }}
    />
  );
};
