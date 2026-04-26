import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser } from "./services/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import AIInsight from "./pages/AIInsight";
import AnomalyLog from "./pages/AnomalyLog";
import ChatBot from "./components/ChatBot/ChatBot";

function ProtectedRoute({ children }) {
  const user = getStoredUser();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const user = getStoredUser();

  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-insight"
          element={
            <ProtectedRoute>
              <AIInsight />
            </ProtectedRoute>
          }
        />
        <Route
          path="/anomaly-log"
          element={
            <ProtectedRoute>
              <AnomalyLog />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBot />
    </div>
  );
}

export default App;
