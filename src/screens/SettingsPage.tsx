export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>
      <ul className="list">
        <li className="listRow">
          <div>
            <div className="listTitle">Vault location</div>
            <div className="hint">(coming soon)</div>
          </div>
          <button className="button" disabled>
            Change
          </button>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">Diagnostics</div>
            <div className="hint">(coming soon)</div>
          </div>
          <button className="button" disabled>
            Open
          </button>
        </li>
      </ul>
    </section>
  );
}

