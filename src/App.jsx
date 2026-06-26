import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Apartments from "./pages/Apartments";
import Calls from "./pages/Calls";
import QRCode from "./pages/QRCode";
import Config from "./pages/Config";
import Users from "./pages/Users";
import Login from "./pages/Login";
import "./App.css";

const TABS = [
  { id: "apartments", label: "🏠 Apartamentos" },
  { id: "calls", label: "📞 Chamadas" },
  { id: "qrcode", label: "📲 QR Code" },
  { id: "config", label: "⚙️ Configurações" },
  { id: "users", label: "👤 Usuários" },
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("apartments");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (session === undefined) return <div className="login-page"><div className="login-card" style={{ textAlign: "center", padding: 40 }}>Carregando...</div></div>;
  if (!session) return <Login />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🔔</div>
          <div>
            <h1>Interfone Virtual</h1>
            <p>Painel de Administração</p>
          </div>
        </div>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
            {session.user.email}
          </div>
          <a
            className="web-btn"
            href="https://interfonevirtual-villagemontreal.netlify.app"
            target="_blank"
            rel="noreferrer"
          >
            🌐 Abrir interfone (web)
          </a>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Sair
          </button>
        </div>
      </aside>
      <main className="content">
        {tab === "apartments" && <Apartments />}
        {tab === "calls" && <Calls />}
        {tab === "qrcode" && <QRCode />}
        {tab === "config" && <Config />}
        {tab === "users" && <Users />}
      </main>
    </div>
  );
}
