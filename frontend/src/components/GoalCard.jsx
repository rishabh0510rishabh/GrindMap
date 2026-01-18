import React, { useState } from 'react';
import Confetti from 'react-confetti';
import './GoalCard.css';

const GoalCard = ({ goal, onUpdateProgress, onEdit, onDelete, onComplete }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'problems': return '🎯';
      case 'rating': return '📈';
      case 'streak': return '🔥';
      case 'time': return '⚡';
      case 'consistency': return '📅';
      default: return '🎯';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#2196F3';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'active': return '#2196F3';
      case 'paused': return '#FF9800';
      case 'abandoned': return '#9E9E9E';
      default: return '#2196F3';
    }
  };

  const handleProgressUpdate = async (newValue) => {
    setIsUpdating(true);
    try {
      const wasCompleted = isCompleted;
      await onUpdateProgress(goal._id, newValue, newNote.trim() || null);
      setNewNote('');

      // Check if goal was just completed
      if (!wasCompleted && newValue >= goal.goal.targetValue) {
        setShowConfetti(true);
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = goal.isOverdue;
  const daysRemaining = goal.daysRemaining;
  const progressPercentage = goal.progressPercentage || 0;
  const isCompleted = goal.status === 'completed';

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      <div className={`goal-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="goal-header">
        <div className="goal-icon">
          {getCategoryIcon(goal.goal.category)}
        </div>
        <div className="goal-title-section">
          <h3 className="goal-title">{goal.goal.title}</h3>
          <div className="goal-meta">
            <span
              className="goal-difficulty"
              style={{ backgroundColor: getDifficultyColor(goal.goal.difficulty) }}
            >
              {goal.goal.difficulty}
            </span>
            <span
              className="goal-status"
              style={{ backgroundColor: getStatusColor(goal.status) }}
            >
              {goal.status}
            </span>
            {goal.priority && (
              <span className={`goal-priority priority-${goal.priority}`}>
                {goal.priority}
              </span>
            )}
          </div>
        </div>
        <div className="goal-actions">
          {!isCompleted && (
            <button
              className="goal-action-btn"
              onClick={() => onUpdateProgress(goal._id, goal.currentValue + 1)}
              disabled={isUpdating}
            >
              +1
            </button>
          )}
          <button className="goal-action-btn" onClick={onEdit}>
            ✏️
          </button>
          <button className="goal-action-btn delete" onClick={onDelete}>
            🗑️
          </button>
        </div>
      </div>

      <div className="goal-description">
        <p>{goal.goal.description}</p>
      </div>

      <div className="goal-progress">
        <div className="progress-header">
          <span className="progress-text">
            {goal.currentValue} / {goal.goal.targetValue} {goal.goal.targetUnit}
          </span>
          <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: isCompleted ? '#4CAF50' : '#2196F3'
            }}
          ></div>
        </div>
      </div>

      <div className="goal-details">
        <div className="goal-detail-item">
          <span className="detail-label">Started:</span>
          <span className="detail-value">{formatDate(goal.startDate)}</span>
        </div>
        {goal.targetDate && (
          <div className="goal-detail-item">
            <span className="detail-label">Target:</span>
            <span className={`detail-value ${isOverdue ? 'overdue' : ''}`}>
              {formatDate(goal.targetDate)}
              {daysRemaining !== null && (
                <span className="days-remaining">
                  ({daysRemaining === 0 ? 'Due today' : daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`})
                </span>
              )}
            </span>
          </div>
        )}
        {isCompleted && goal.completedDate && (
          <div className="goal-detail-item">
            <span className="detail-label">Completed:</span>
            <span className="detail-value completed">{formatDate(goal.completedDate)}</span>
          </div>
        )}
      </div>

      {goal.milestones && goal.milestones.length > 0 && (
        <div className="goal-milestones">
          <h4>Milestones</h4>
          <div className="milestones-list">
            {goal.milestones.map((milestone, index) => (
              <div key={index} className="milestone-item achieved">
                <span className="milestone-icon">🏆</span>
                <span className="milestone-text">{milestone.message}</span>
                <span className="milestone-date">{formatDate(milestone.achievedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isCompleted && (
        <div className="goal-update-section">
          <div className="update-input-group">
            <input
              type="number"
              value={goal.currentValue}
              onChange={(e) => {
                const newValue = Math.max(0, parseInt(e.target.value) || 0);
                // We'll update this optimistically
              }}
              className="progress-input"
              min="0"
              max={goal.goal.targetValue}
            />
            <button
              className="update-btn"
              onClick={() => handleProgressUpdate(goal.currentValue)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </div>
          <div className="note-input-group">
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="note-input"
            />
          </div>
        </div>
      )}

      {goal.notes && goal.notes.length > 0 && (
        <div className="goal-notes">
          <button
            className="notes-toggle"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? 'Hide' : 'Show'} Notes ({goal.notes.length})
          </button>
          {showNotes && (
            <div className="notes-list">
              {goal.notes.map((note, index) => (
                <div key={index} className="note-item">
                  <span className="note-content">{note.content}</span>
                  <span className="note-date">{formatDate(note.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="goal-completed-banner">
          🎉 Goal Completed! 🎉
        </div>
      )}
    </div>
    </>
  );
};

export default GoalCard;