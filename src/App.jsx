import { useState } from "react";
import Apartments from "./pages/Apartments";
import Calls from "./pages/Calls";
import QRCode from "./pages/QRCode";
import Config from "./pages/Config";
import { shutdownSystem } from "./api";
import "./App.css";

const TABS = [
  { id: "apartments", label: "🏠 Apartamentos" },
  { id: "calls", label: "📞 Chamadas" },
  { id: "qrcode", label: "📲 QR Code" },
  { id: "config", label: "⚙️ Configurações" },
];

export default function App() {
  const [tab, setTab] = useState("apartments");

  const handleShutdown = async () => {
    if (!confirm("Desligar o sistema? Isso vai encerrar o backend, frontend, painel admin e ngrok.")) return;
    try { await shutdownSystem(); } catch {}
    alert("Sistema desligado.");
  };

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
          <a
            className="web-btn"
            href="https://interfonevirtual-villagemontreal.netlify.app"
            target="_blank"
            rel="noreferrer"
          >
            🌐 Abrir interfone (web)
          </a>
          <button className="shutdown-btn" onClick={handleShutdown}>
            🔴 Desligar sistema
          </button>
        </div>
      </aside>
      <main className="content">
        {tab === "apartments" && <Apartments />}
        {tab === "calls" && <Calls />}
        {tab === "qrcode" && <QRCode />}
        {tab === "config" && <Config />}
      </main>
    </div>
  );
}
