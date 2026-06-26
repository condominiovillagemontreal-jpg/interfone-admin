import { useState, useEffect } from "react";
import { getCalls, clearCalls } from "../api";

const STATUS_LABEL = {
  initiated: { label: "Iniciada", cls: "badge-yellow" },
  ringing: { label: "Chamando", cls: "badge-yellow" },
  "in-progress": { label: "Em andamento", cls: "badge-green" },
  completed: { label: "Concluída", cls: "badge-green" },
  busy: { label: "Ocupado", cls: "badge-red" },
  "no-answer": { label: "Sem resposta", cls: "badge-red" },
  failed: { label: "Falhou", cls: "badge-red" },
  canceled: { label: "Cancelada", cls: "badge-gray" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

function fmtDuration(s) {
  if (!s) return "—";
  const sec = parseInt(s);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getCalls().then((d) => { setCalls(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!confirm("Limpar todos os registros de chamadas?")) return;
    await clearCalls();
    setCalls([]);
  };

  const total = calls.length;
  const completed = calls.filter((c) => c.status === "completed").length;
  const failed = calls.filter((c) => ["failed", "no-answer", "busy"].includes(c.status)).length;

  return (
    <div>
      <div className="page-header">
        <h2>Histórico de Chamadas</h2>
        <p>Registro de todas as chamadas realizadas pelo interfone</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Concluídas</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sem resposta</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>{failed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Taxa de atendimento</div>
          <div className="stat-value" style={{ fontSize: 20, paddingTop: 6 }}>
            {total ? Math.round((completed / total) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <strong style={{ fontSize: 15 }}>Registros</strong>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Atualizar</button>
            {calls.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={handleClear}>🗑️ Limpar</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="empty">Carregando...</div>
        ) : calls.length === 0 ? (
          <div className="empty">Nenhuma chamada registrada ainda.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Apartamento</th>
                <th>Morador</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c, i) => {
                const st = STATUS_LABEL[c.status] || { label: c.status, cls: "badge-gray" };
                return (
                  <tr key={i}>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>{fmtDate(c.timestamp)}</td>
                    <td><strong>{c.label}</strong></td>
                    <td>{c.resident}</td>
                    <td style={{ fontSize: 13 }}>{c.phone}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>{fmtDuration(c.duration)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
