import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

const ACTIVE_COLOR = '#0365af';
const INACTIVE_COLOR = '#9ca3af';

type TabIconProps = {
  color: string;
};

function HomeIcon({ color }: TabIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
      <path d="M12 8L14.8 10.8L12.8 15.2L9.2 13.2L12 8Z" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function HistoryIcon({ color }: TabIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="M8 3V7M16 3V7M8 11H12M12 11V15M12 11L15 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ color }: TabIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4C8.9 4 7 6 7 9.4V12.2C7 13.1 6.7 14 6.1 14.6L5.2 15.5C4.6 16.1 5 17 5.9 17H18.1C19 17 19.4 16.1 18.8 15.5L17.9 14.6C17.3 14 17 13.1 17 12.2V9.4C17 6 15.1 4 12 4Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <path d="M10 19C10.3 20 11 20.6 12 20.6C13 20.6 13.7 20 14 19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ color }: TabIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.4" r="3.4" stroke={color} strokeWidth="1.8" />
      <path d="M6 19.2C6 16.7 8.5 14.8 12 14.8C15.5 14.8 18 16.7 18 19.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="5.2" height="5.2" rx="1.1" stroke="white" strokeWidth="1.8" />
      <rect x="14.3" y="4.5" width="5.2" height="5.2" rx="1.1" stroke="white" strokeWidth="1.8" />
      <rect x="4.5" y="14.3" width="5.2" height="5.2" rx="1.1" stroke="white" strokeWidth="1.8" />

      <rect x="6.3" y="6.3" width="1.8" height="1.8" rx="0.5" fill="white" />
      <rect x="16.1" y="6.3" width="1.8" height="1.8" rx="0.5" fill="white" />
      <rect x="6.3" y="16.1" width="1.8" height="1.8" rx="0.5" fill="white" />

      <rect x="12.2" y="12.2" width="1.8" height="1.8" rx="0.5" fill="white" />
      <rect x="15.1" y="12.2" width="1.8" height="1.8" rx="0.5" fill="white" />
      <rect x="12.2" y="15.1" width="1.8" height="1.8" rx="0.5" fill="white" />
      <rect x="17.9" y="15.1" width="1.8" height="1.8" rx="0.5" fill="white" />
    </svg>
  );
}

type TabItemProps = {
  to: string;
  label: string;
  icon: (color: string) => ReactNode;
};

function TabItem({ to, label, icon }: TabItemProps) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.tabItem,
        color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
      })}
    >
      {({ isActive }) => (
        <>
          {icon(isActive ? ACTIVE_COLOR : INACTIVE_COLOR)}
          <span style={{ ...styles.tabLabel, color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function BottomTabBar() {
  return (
    <nav style={styles.nav} aria-label={'\u0110i\u1ec1u h\u01b0\u1edbng ch\u00ednh'}>
      <TabItem to="/home" label={'Trang ch\u1ee7'} icon={(color) => <HomeIcon color={color} />} />
      <TabItem to="/history" label={'G\u1ecdi t\u1edbi'} icon={(color) => <HistoryIcon color={color} />} />

      <NavLink to="/qr" style={styles.centerLink}>
        {({ isActive }) => (
          <div style={{ ...styles.centerButton, boxShadow: isActive ? '0 8px 24px rgba(3,101,175,0.4)' : styles.centerButton.boxShadow }}>
            <QrIcon />
          </div>
        )}
      </NavLink>

      <TabItem to="/notifications" label={'Th\u00f4ng b\u00e1o'} icon={(color) => <BellIcon color={color} />} />
      <TabItem to="/profile" label={'C\u00e1 nh\u00e2n'} icon={(color) => <UserIcon color={color} />} />
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 0,
    width: '100%',
    maxWidth: '430px',
    height: '68px',
    background: 'rgba(255,255,255,0.95)',
    borderTop: '1px solid #dbe4ef',
    backdropFilter: 'blur(8px)',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 92px 1fr 1fr',
    alignItems: 'center',
    padding: '2px 8px calc(4px + env(safe-area-inset-bottom))',
    boxSizing: 'border-box',
    zIndex: 30,
    boxShadow: '0 -8px 24px rgba(3, 47, 90, 0.08)',
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    gap: 0,
    marginTop: '-5px',
  },
  tabLabel: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.1,
  },
  centerLink: {
    justifySelf: 'center',
    alignSelf: 'start',
    textDecoration: 'none',
    marginTop: '-24px',
  },
  centerButton: {
    width: '62px',
    height: '62px',
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 65%, #03559a 100%)',
    border: '4px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(3,101,175,0.36)',
  },
};

export default BottomTabBar;
