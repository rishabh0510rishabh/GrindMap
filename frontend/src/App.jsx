import React, { useState, lazy, Suspense } from "react";
import "./App.css";
import CircularProgress from "./components/CircularProgress";

import DemoPage from "./components/DemoPage";
import BadgeCollection from "./components/BadgeCollection";
import GoalDashboard from "./components/GoalDashboard";
import UsernameInputs from "./components/UsernameInputs";
import PlatformCard from "./components/PlatformCard";
import ThemeToggle from "./components/ThemeToggle";
import ContributorsHallOfFame from "./components/ContributorsHallOfFame";

import { ThemeProvider } from "./contexts/ThemeContext";
import { useGrindMapData } from "./hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "./utils/platforms";
import ErrorBoundary from "./components/ErrorBoundary";

/* Lazy-loaded analytics dashboard */
const AnalyticsDashboard = lazy(
  () => import("./components/AnalyticsDashboard"),
);

function AppContent() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [user, setUser] = useState(null);

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

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userName = params.get("name");

    if (token) {
      localStorage.setItem("authToken", token);
      if (userName) localStorage.setItem("userName", userName);
      setUser({ name: userName, token });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem("authToken");
      const storedName = localStorage.getItem("userName");
      if (storedToken) setUser({ name: storedName, token: storedToken });
    }
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/github";
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    setUser(null);
  };

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

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
            <button
              onClick={() => setShowAnalytics(false)}
              className="back-btn"
            >
              ← Back to Main
            </button>
            <Suspense fallback={<div>Loading analytics...</div>}>
              <AnalyticsDashboard platformData={platformData} />
            </Suspense>
          </>
        ) : showBadges ? (
          <>
            <button onClick={() => setShowBadges(false)} className="back-btn">
              ← Back to Main
            </button>
            <BadgeCollection />
          </>
        ) : showGoals ? (
          <>
            <button onClick={() => setShowGoals(false)} className="back-btn">
              ← Back to Main
            </button>
            <GoalDashboard />
          </>
        ) : showContributors ? (
          <ContributorsHallOfFame onBack={() => setShowContributors(false)} />
        ) : (
          <>
            {/* Glass Hover Navbar */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                height: "60px",
                borderRadius: "10px",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-evenly",
                padding: "0.5rem 1rem",
              }}
            >
              {user ? (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      marginRight: "10px",
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                  >
                    👋 {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(231, 76, 60, 0.3)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    style={btnStyle}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  style={btnStyle}
                >
                  🐙 GitHub Login
                </button>
              )}

              <button
                onClick={() => setShowDemo(true)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={btnStyle}
              >
                View Demo
              </button>

              <button
                onClick={() => setShowAnalytics(true)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={btnStyle}
              >
                View Analytics
              </button>

              <button
                onClick={() => setShowBadges(true)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={btnStyle}
              >
                🏆 Achievements
              </button>

              <button
                onClick={() => setShowGoals(true)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={btnStyle}
              >
                🎯 Goals
              </button>
              <button
                onClick={() => setShowContributors(true)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={btnStyle}
              >
                👥 Contributors
              </button>
            </div>

            <ThemeToggle />

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
                      className={`activity-item ${
                        submittedToday
                          ? "done"
                          : hasData
                            ? "active-no-sub"
                            : "missed"
                      }`}
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

const btnStyle = {
  padding: "10px 20px",
  fontSize: "1em",
  border: "none",
  background: "transparent",
  color: "#fff",
  borderRadius: "8px",
  cursor: "pointer",
};

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
