import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css'; // Import CSS
import { format } from 'date-fns'; // For date formatting if needed

function ActivityHeatmap({ data }) {
  // Assuming data is [{ date: 'YYYY-MM-DD', count: number }, ...]
  // Get dates for the last 6 months or so
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6);

  return (
    <div className="activity-heatmap">
      <h2>Activity Heatmap</h2>
      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        values={data}
        classForValue={(value) => {
          if (!value) return 'color-empty';
          return `color-scale-${Math.min(value.count, 4)}`; // Scale 1-4 for colors
        }}
        titleForValue={(value) => value ? `${value.count} problems on ${format(new Date(value.date), 'MMM dd, yyyy')}` : null}
      />
    </div>
  );
}

export default ActivityHeatmap;