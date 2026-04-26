import { NavLink } from "react-router-dom";
import useAppStore from "../../store";

function Sidebar() {
  const user = useAppStore((state) => state.user);

  return (
    <aside className="panel sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">EN</span>
        <div>
          <h1>ElixNode</h1>
          <div className="muted">Industrial twin, analytics, alerts, and AI ops</div>
        </div>
      </div>
      <div className="sidebar-user">
        <strong>{user?.name ?? "Pranajit Banerjee"}</strong>
        <div className="muted">{user?.email ?? "pranajitbanerjee2004@gmail.com"}</div>
      </div>
      <nav className="nav-links">
        <NavLink to="/dashboard" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <span>Overview</span>
          <span className="muted">01</span>
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <span>Alerts</span>
          <span className="muted">02</span>
        </NavLink>
        <NavLink to="/ai-insight" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <span>AI Insight</span>
          <span className="muted">03</span>
        </NavLink>
        <NavLink to="/anomaly-log" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <span>Anomaly Log</span>
          <span className="muted">04</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="badge ok">Live workspace</div>
      </div>
    </aside>
  );
}

export default Sidebar;
