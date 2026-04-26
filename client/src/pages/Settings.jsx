import Sidebar from "../components/Layout/Sidebar";
import useAppStore from "../store";

function Settings() {
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <section className="panel settings-grid" style={{ padding: 24 }}>
          <h1>Settings</h1>
          <label className="stack">
            <span>Email alerts enabled</span>
            <select
              value={String(preferences.emailEnabled)}
              onChange={(event) => updatePreferences({ emailEnabled: event.target.value === "true" })}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label className="stack">
            <span>Cooldown minutes</span>
            <input
              type="number"
              min="1"
              value={preferences.cooldownMinutes}
              onChange={(event) => updatePreferences({ cooldownMinutes: Number(event.target.value) })}
            />
          </label>
        </section>
      </main>
    </div>
  );
}

export default Settings;
