import { useState, useEffect } from "react";
import { getApartments, createApartment, updateApartment, deleteApartment } from "../api";

const EMPTY = { id: "", label: "", resident: "", phones: [""] };

export default function Apartments() {
  const [apts, setApts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    getApartments().then((d) => { setApts(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal("create"); setMsg(""); };
  const openEdit = (apt) => {
    setForm({ ...apt, phones: apt.phones?.length ? apt.phones : [""] });
    setModal(apt);
    setMsg("");
  };
  const closeModal = () => { setModal(null); setMsg(""); };

  const setPhone = (i, val) => {
    const phones = [...form.phones];
    phones[i] = val;
    setForm({ ...form, phones });
  };
  const addPhone = () => setForm({ ...form, phones: [...form.phones, ""] });
  const removePhone = (i) => setForm({ ...form, phones: form.phones.filter((_, idx) => idx !== i) });

  const handleSave = async () => {
    if (!form.id || !form.label) return setMsg("ID e Identificação são obrigatórios.");
    setSaving(true);
    const phones = form.phones.map((p) => p.trim()).filter(Boolean);
    try {
      if (modal === "create") await createApartment({ ...form, phones });
      else await updateApartment(modal.id, { ...form, phones });
      load();
      closeModal();
    } catch { setMsg("Erro ao salvar."); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Remover o apartamento ${id}?`)) return;
    await deleteApartment(id);
    load();
  };

  const configured = apts.filter((a) => a.phones?.length).length;

  return (
    <div>
      <div className="page-header">
        <h2>Apartamentos</h2>
        <p>Gerencie os ramais, moradores e telefones do condomínio</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{apts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Configurados</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{configured}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sem telefone</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>{apts.length - configured}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ fontSize: 16, paddingTop: 8 }}>
            {configured === apts.length && apts.length > 0
              ? <span className="badge badge-green">✅ Completo</span>
              : <span className="badge badge-yellow">⚠️ Incompleto</span>}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <strong style={{ fontSize: 15 }}>Lista de Apartamentos</strong>
          <button className="btn btn-primary" onClick={openCreate}>+ Novo Apartamento</button>
        </div>

        {loading ? <div className="empty">Carregando...</div> : apts.length === 0 ? (
          <div className="empty">Nenhum apartamento cadastrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Identificação</th><th>Morador</th>
                <th>Telefones</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {apts.map((apt) => (
                <tr key={apt.id}>
                  <td><code style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>{apt.id}</code></td>
                  <td><strong>{apt.label}</strong></td>
                  <td>{apt.resident || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                  <td>
                    {apt.phones?.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {apt.phones.map((p, i) => (
                          <span key={i} style={{ fontSize: 13 }}>
                            {i === 0 ? "📱" : "📲"} {p}
                            {i > 0 && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>fallback</span>}
                          </span>
                        ))}
                      </div>
                    ) : <span style={{ color: "#9ca3af" }}>Não configurado</span>}
                  </td>
                  <td>
                    {apt.phones?.length
                      ? <span className="badge badge-green">✅ Ativo</span>
                      : <span className="badge badge-red">❌ Sem telefone</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(apt)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(apt.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3>{modal === "create" ? "Novo Apartamento" : `Editar ${modal.label}`}</h3>

            <div className="form-group">
              <label>ID / Ramal *</label>
              <input placeholder="Ex: 101" value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={modal !== "create"} />
            </div>
            <div className="form-group">
              <label>Identificação *</label>
              <input placeholder="Ex: Apto 101" value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nome do Morador</label>
              <input placeholder="Ex: Família Silva" value={form.resident}
                onChange={(e) => setForm({ ...form, resident: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Telefones para discagem</label>
              <small style={{ display: "block", color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
                O sistema liga do 1° ao último em sequência se não houver resposta.
              </small>
              {form.phones.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#6b7280", minWidth: 80 }}>
                    {i === 0 ? "📱 Principal" : `📲 Fallback ${i}`}
                  </span>
                  <input
                    style={{ flex: 1 }}
                    placeholder="+5511999990001"
                    value={p}
                    onChange={(e) => setPhone(i, e.target.value)}
                  />
                  {form.phones.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removePhone(i)}>✕</button>
                  )}
                </div>
              ))}
              {form.phones.length < 5 && (
                <button className="btn btn-secondary btn-sm" onClick={addPhone} style={{ marginTop: 4 }}>
                  + Adicionar fallback
                </button>
              )}
            </div>

            {msg && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{msg}</p>}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
