import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Main from "./pages/Main";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Dashboard from "./pages/Dashboard";
import MyPage from "./pages/MyPage";
import { supabase } from "./supabase";
import "./App.css";

function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setIsAuthenticated(!!session);
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
}

function ResultRouteGuard() {
  const location = useLocation();
  const canAccess = !!location.state?.fromQuiz && !!location.state?.result;

  if (!canAccess) {
    return <Navigate to="/quiz" replace />;
  }

  return <Result />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<ResultRouteGuard />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
