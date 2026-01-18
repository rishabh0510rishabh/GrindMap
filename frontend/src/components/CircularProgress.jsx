import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const CircularProgress = ({ percentage = 0, color, size = 'medium' }) => {
  const sizes = {
    small: 100,
    medium: 150,
    large: 240
  };
  const width = sizes[size];

  // Use theme color if not provided
  const progressColor = color || 'var(--theme-progress)';

  return (
    <div style={{ width: `${width}px`, height: `${width}px`, margin: '20px auto' }}>
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          textSize: '16px',
          pathColor: progressColor,
          textColor: 'var(--theme-text)',
          trailColor: 'var(--theme-border)',
          pathTransitionDuration: 0.8,
        })}
      />
    </div>
  );
};

export default CircularProgress;