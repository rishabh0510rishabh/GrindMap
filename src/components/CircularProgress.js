import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'; // Import the library's CSS

function CircularProgress({ solved, goal }) {
  const percentage = (solved / goal) * 100;

  return (
    <div className="circular-progress" style={{ width: 200, height: 200, margin: '20px auto' }}>
      <CircularProgressbar
        value={percentage}
        text={`${Math.round(percentage)}%`}
        styles={buildStyles({
          pathColor: `#4caf50`, // Green for progress
          textColor: '#333',
          trailColor: '#d6d6d6',
        })}
      />
      <p>Progress towards goal</p>
    </div>
  );
}

export default CircularProgress;