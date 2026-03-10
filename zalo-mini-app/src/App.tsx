import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import auth from './services/auth';
import { connectSocket, disconnectSocket } from './services/socket';
import HomePage from './pages/HomePage';
import CallDetailPage from './pages/CallDetailPage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import QrPage from './pages/QrPage';
import GlobalIncomingCallOverlay from './components/GlobalIncomingCallOverlay';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const isAuth = await auth.init();
    setIsAuthenticated(isAuth);
    setIsLoading(false);
  };

  const handleLinked = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    disconnectSocket();
    auth.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="mini-shell">
        <div className="mini-frame">
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="mini-shell">
        <div className="mini-frame">
          <GlobalIncomingCallOverlay enabled={isAuthenticated === true} />
          <Routes>
            <Route 
              path="/login" 
              element={<LoginPage onLinked={handleLinked} />} 
            />
            <Route 
              path="/" 
              element={<Navigate to="/home" replace />}
            />
            <Route 
              path="/home" 
              element={<HomePage onLogout={handleLogout} />}
            />
            <Route 
              path="/history" 
              element={<HistoryPage />}
            />
            <Route 
              path="/qr" 
              element={<QrPage />}
            />
            <Route 
              path="/notifications" 
              element={<NotificationsPage />}
            />
            <Route 
              path="/profile" 
              element={<ProfilePage onLogout={handleLogout} />} 
            />
            <Route 
              path="/call/:callId" 
              element={
                isAuthenticated ? 
                  <CallDetailPage /> : 
                  <Navigate to="/login" replace />
              } 
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </div>
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
