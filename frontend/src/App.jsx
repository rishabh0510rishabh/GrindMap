import React, { useState } from "react";
import "./App.css";
import CircularProgress from "./components/CircularProgress";

import DemoPage from "./components/DemoPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import BadgeCollection from "./components/BadgeCollection";
import UsernameInputs from "./components/UsernameInputs";
import PlatformCard from "./components/PlatformCard";
import Leaderboard from "./components/Leaderboard";
import Friends from "./components/Friends";
import Profile from "./components/Profile";
import { useGrindMapData } from "./hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "./utils/platforms";

function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const {
    usernames,
    platformData,
    loading,
    totalSolved,
    handleChange,
    fetchAll,
    getPlatformPercentage,
    hasSubmittedToday,
  } = useGrindMapData();

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  // Today's Activity Logic
  const today = new Date();

  return (
    <div className="app">
  <div className="container">

      {showDemo ? (
        <>
          <DemoPage onBack={() => setShowDemo(false)} />
        </>
      ) : showAnalytics ? (
        <>
          <button onClick={() => setShowAnalytics(false)} className="back-btn">
            ← Back to Main
          </button>
          <AnalyticsDashboard platformData={platformData} />
        </>
      ) : showBadges ? (
        <>
          <button onClick={() => setShowBadges(false)} className="back-btn">
            ← Back to Main
          </button>
          <BadgeCollection />
        </>
      ) : showLeaderboard ? (
        <>
          <Leaderboard onBack={() => setShowLeaderboard(false)} />
        </>
      ) : showFriends ? (
        <>
          <Friends onBack={() => setShowFriends(false)} />
        </>
      ) : showProfile ? (
        <>
          <Profile onBack={() => setShowProfile(false)} />
        </>
      ) : (
        <>
          <h1>GrindMap</h1>

          <UsernameInputs
            usernames={usernames}
            onChange={handleChange}
            onFetch={fetchAll}
            loading={loading}
          />

          <div className="overall">
            <h2>Overall Progress</h2>
            <CircularProgress
              solved={totalSolved}
              goal={OVERALL_GOAL}
              color="#4caf50"
            />
            <p>
              {totalSolved} / {OVERALL_GOAL} problems solved
            </p>
          </div>

          <div className="platforms-grid">
            {PLATFORMS.map((plat) => (
              <PlatformCard
                key={plat.key}
                platform={plat}
                data={platformData[plat.key]}
                expanded={expanded}
                onToggle={toggleExpand}
                percentage={getPlatformPercentage(plat.key)}
                loading={loading}
              />
            ))}
          </div>

          {/* Today's Activity */}
          <div className="today-activity">
            <h2>
              Today's Activity (
              {today.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              )
            </h2>
            <div className="activity-list">
              {PLATFORMS.map((plat) => {
                const submittedToday = hasSubmittedToday(plat.key);
                const hasData =
                  platformData[plat.key] && !platformData[plat.key].error;

                return (
                  <div
                    key={plat.key}
                    className={`activity-item ${submittedToday ? "done" : hasData ? "active-no-sub" : "missed"}`}
                  >
                    <span>{plat.name}</span>
                    <span>
                      {submittedToday
                        ? "✅ Coded Today"
                        : hasData
                          ? "✅ Active (No submission today)"
                          : "❌ No Data"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      </div>
</div>

  );
}

export default App;
