import React from 'react';
import { useCurrentFrame, interpolate, useVideoConfig, Img, staticFile } from 'remotion';
import { BgModeType } from '../types';

interface Props {
  mode: BgModeType;
}

const IMAGE_PATHS: Record<string, string> = {
  img_forest: 'backgrounds/calm_forest.jpg',
  img_ocean: 'backgrounds/calm_ocean.jpg',
  img_zen: 'backgrounds/calm_zen.jpg',
  img_cosmic: 'backgrounds/calm_cosmic.jpg',
};

export const BackgroundCanvas: React.FC<Props> = ({ mode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gentle ken-burns zoom animation for background images
  const imageScale = interpolate(
    frame,
    [0, fps * 60],
    [1.0, 1.12],
    { extrapolateRight: 'clamp' }
  );

  // Floating animations for procedural backgrounds
  const orbScale = interpolate(
    Math.sin(frame / (fps * 2)),
    [-1, 1],
    [0.88, 1.12]
  );

  const orbRotate = frame * 0.4;

  const gradientX = interpolate(
    Math.sin(frame / (fps * 3)),
    [-1, 1],
    [15, 85]
  );

  const gradientY = interpolate(
    Math.cos(frame / (fps * 2.5)),
    [-1, 1],
    [25, 75]
  );

  // Render Image Backgrounds
  if (IMAGE_PATHS[mode]) {
    const imageSrc = staticFile(IMAGE_PATHS[mode]);
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0a0d14',
          overflow: 'hidden',
        }}
      >
        <Img
          src={imageSrc}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${imageScale})`,
            transition: 'transform 0.1s linear',
          }}
        />
        {/* Soft Vignette Overlay for maximum subtitle readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at 50% 50%, rgba(19, 19, 20, 0.45) 0%, rgba(19, 19, 20, 0.75) 85%),
              linear-gradient(180deg, rgba(19, 19, 20, 0.6) 0%, transparent 25%, transparent 75%, rgba(19, 19, 20, 0.8) 100%)
            `,
          }}
        />
      </div>
    );
  }

  if (mode === 'minimal_dark') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#131314',
          backgroundImage: 'radial-gradient(circle at 50% 35%, #252426 0%, #131314 75%)',
        }}
      />
    );
  }

  if (mode === 'mesh_gradient') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0e0e0f',
          backgroundImage: `
            radial-gradient(at ${gradientX}% ${gradientY}%, rgba(255, 182, 146, 0.38) 0px, transparent 50%),
            radial-gradient(at ${100 - gradientX}% ${100 - gradientY}%, rgba(194, 193, 255, 0.32) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(233, 196, 0, 0.22) 0px, transparent 70%)
          `,
        }}
      />
    );
  }

  if (mode === 'neon_waves') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0e0e0f',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '140%',
            height: '140%',
            top: '-20%',
            left: '-20%',
            background: `conic-gradient(from ${orbRotate}deg at 50% 50%, #ff823c, #ffb692, #c2c1ff, #ffe171, #ff823c)`,
            filter: 'blur(90px)',
            opacity: 0.28,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    );
  }

  // Default: dark_orb (Obsidian Ember glowing central orb)
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#131314',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${orbScale}) rotate(${orbRotate}deg)`,
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 182, 146, 0.45) 0%, rgba(255, 130, 60, 0.22) 45%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          right: '10%',
          transform: `scale(${1.2 - (orbScale - 0.88)})`,
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233, 196, 0, 0.28) 0%, rgba(194, 193, 255, 0.12) 60%, transparent 80%)',
          filter: 'blur(75px)',
        }}
      />
    </div>
  );
};
