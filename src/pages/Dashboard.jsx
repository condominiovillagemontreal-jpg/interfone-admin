import { useState, useEffect } from "react";
import { getApartments, getCalls } from "../api";
import { supabase } from "../supabase";

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ total: 0, configured: 0, calls: 0, users: 0 });
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApartments(),
      getCalls().catch(() => []),
      supabase.from("admin_users").select("id", { count: "exact" }),
    ]).then(([apts, calls, usersRes]) => {
      const configured = apts.filter((a) => a.phones?.length).length;
      setStats({
        total: apts.length,
        configured,
        calls: Array.isArray(calls) ? calls.length : 0,
        users: usersRes.count || 0,
      });
      if (Array.isArray(calls)) setRecentCalls(calls.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><div className="empty">Carregando...</div></div>;

  const unconfigured = stats.total - stats.configured;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Visao geral do sistema de interfone virtual</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("apartments")}>
          <div className="stat-label">Apartamentos</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>cadastrados</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("apartments")}>
          <div className="stat-label">Configurados</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{stats.configured}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>com telefone</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("calls")}>
          <div className="stat-label">Chamadas</div>
          <div className="stat-value" style={{ color: "#1a56db" }}>{stats.calls}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>realizadas</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("users")}>
          <div className="stat-label">Usuarios</div>
          <div className="stat-value" style={{ color: "#7c3aed" }}>{stats.users}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>administradores</div>
        </div>
      </div>

      {unconfigured > 0 && (
        <div className="card" style={{ background: "#fef9c3", border: "1px solid #fde68a", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ color: "#854d0e", fontSize: 14 }}>Atencao</strong>
              <p style={{ color: "#854d0e", fontSize: 13, marginTop: 4 }}>
                {unconfigured} apartamento(s) sem telefone cadastrado. Visitantes nao conseguirao chamar esses moradores.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate("apartments")}>
              Configurar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <strong style={{ fontSize: 15, display: "block", marginBottom: 16 }}>Acesso rapido</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-primary" style={{ textAlign: "left" }} onClick={() => onNavigate("apartments")}>
              🏠 Gerenciar apartamentos
            </button>
            <button className="btn btn-secondary" style={{ textAlign: "left" }} onClick={() => onNavigate("qrcode")}>
              📲 Gerar QR Code
            </button>
            <button className="btn btn-secondary" style={{ textAlign: "left" }} onClick={() => onNavigate("config")}>
              ⚙️ Configuracoes do sistema
            </button>
            <button className="btn btn-secondary" style={{ textAlign: "left" }} onClick={() => onNavigate("users")}>
              👤 Gerenciar usuarios
            </button>
            <a
              className="btn btn-success"
              style={{ textAlign: "left", textDecoration: "none", display: "block" }}
              href="https://interfonevirtual-villagemontreal.netlify.app"
              target="_blank" rel="noreferrer"
            >
              🌐 Abrir interfone (visitante)
            </a>
          </div>
        </div>

        <div className="card">
          <strong style={{ fontSize: 15, display: "block", marginBottom: 16 }}>Ultimas chamadas</strong>
          {recentCalls.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>Nenhuma chamada registrada.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentCalls.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
                  <div>
                    <strong>{c.label || c.apartmentId}</strong>
                    {c.resident && <span style={{ color: "#6b7280", marginLeft: 8 }}>{c.resident}</span>}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>
                    {c.timestamp ? new Date(c.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentCalls.length > 0 && (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => onNavigate("calls")}>
              Ver todas as chamadas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
