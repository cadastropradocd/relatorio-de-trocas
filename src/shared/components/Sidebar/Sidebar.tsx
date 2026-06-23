import { useState, useCallback, useMemo, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import './Sidebar.css';

const IconHome = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconChart = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconClock = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconUsers = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconLogout = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconDep = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconChevron = ({ collapsed }: { collapsed: boolean }): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`sidebar-chevron ${collapsed ? 'collapsed' : ''}`}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const TODAY = new Date().toISOString().split('T')[0];

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const dashboardLink = useMemo(() => `/dashboard/${TODAY}`, [TODAY]);

  const closeDrawer = useCallback((): void => {
    setDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback((): void => {
    setDrawerOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList): void => {
      if (e.matches) setDrawerOpen(false);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${drawerOpen ? 'sidebar-drawer-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && <span className="sidebar-logo">TROCAS</span>}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir' : 'Recolher'}>
            <IconChevron collapsed={collapsed} />
          </button>
          <button className="sidebar-close-btn" onClick={closeDrawer} aria-label="Fechar menu" title="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Menu principal">
          <NavLink to={dashboardLink} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Dashboard" onClick={closeDrawer}>
            <IconHome /> {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Relatórios" onClick={closeDrawer}>
            <IconChart /> {!collapsed && <span>Relatórios</span>}
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Histórico" onClick={closeDrawer}>
            <IconClock /> {!collapsed && <span>Histórico</span>}
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/usuarios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Usuários" onClick={closeDrawer}>
              <IconUsers /> {!collapsed && <span>Usuários</span>}
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/departamentos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Departamentos" onClick={closeDrawer}>
              <IconDep /> {!collapsed && <span>Departamentos</span>}
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && user?.name && (
            <span className="sidebar-user">{user.name}</span>
          )}
          <button className="sidebar-link sidebar-logout" onClick={handleSignOut} aria-label="Sair da conta" title="Sair">
            <IconLogout />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {drawerOpen && <div className="sidebar-overlay" onClick={closeDrawer} />}

      <button className="hamburger-btn" onClick={toggleDrawer} aria-label="Abrir menu" title="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <nav className="bottom-nav" aria-label="Navegação principal">
        <NavLink to={dashboardLink} className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`} title="Dashboard">
          <IconHome /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/relatorios" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`} title="Relatórios">
          <IconChart /> <span>Relatórios</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`} title="Histórico">
          <IconClock /> <span>Histórico</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Sidebar;
