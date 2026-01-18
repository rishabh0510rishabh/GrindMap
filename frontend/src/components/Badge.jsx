import React from 'react';
import './Badge.css';

const Badge = ({ badge, userBadge, showProgress = false, progress = 0, size = 'medium' }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#8B8B8B';
      case 'rare': return '#4A90E2';
      case 'epic': return '#9B59B6';
      case 'legendary': return '#F39C12';
      default: return '#8B8B8B';
    }
  };

  const isEarned = userBadge && userBadge.progress === 100;

  return (
    <div className={`badge ${size} ${isEarned ? 'earned' : 'locked'}`}>
      <div
        className="badge-icon"
        style={{
          backgroundColor: isEarned ? getRarityColor(badge.rarity) : '#555',
          boxShadow: isEarned ? `0 0 20px ${getRarityColor(badge.rarity)}40` : 'none'
        }}
      >
        {isEarned ? badge.icon : '🔒'}
      </div>

      <div className="badge-info">
        <h4 className="badge-name">{badge.name}</h4>
        <p className="badge-description">{badge.description}</p>

        {isEarned && userBadge && (
          <div className="badge-earned-date">
            Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
          </div>
        )}

        {showProgress && !isEarned && (
          <div className="badge-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}

        <div className="badge-points">
          {badge.points} points
        </div>
      </div>

      {userBadge && userBadge.isNew && (
        <div className="badge-new-indicator">NEW!</div>
      )}
    </div>
  );
};

export default Badge;