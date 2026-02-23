import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import auth from './services/auth';
import { connectSocket, disconnectSocket } from './services/socket';
import HomePage from './pages/HomePage';
import CallDetailPage from './pages/CallDetailPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deepLinkCallId, setDeepLinkCallId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => { disconnectSocket(); };
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const callIdFromUrl = new URLSearchParams(window.location.search).get('callId');
    const isAuth = await auth.init();
    const pendingCallId = auth.getPendingCallId() || callIdFromUrl;
    if (pendingCallId) setDeepLinkCallId(pendingCallId);
    setIsAuthenticated(isAuth);
    setIsLoading(false);
  };

  const handleLogin = () => {
    const pendingCallId = auth.getPendingCallId();
    if (pendingCallId) setDeepLinkCallId(pendingCallId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    disconnectSocket();
    auth.logout();
    setDeepLinkCallId(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to={deepLinkCallId ? `/call/${deepLinkCallId}` : "/"} replace /> : 
              <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              (deepLinkCallId ? <Navigate to={`/call/${deepLinkCallId}`} replace /> : <HomePage onLogout={handleLogout} />) : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/call/:callId" 
          element={
            isAuthenticated ? 
              <CallDetailPage onViewed={() => setDeepLinkCallId(null)} /> : 
              <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f5f5f5',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e0e0e0',
    borderTop: '4px solid #0365af',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
};

export default App;
