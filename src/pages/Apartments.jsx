import { useState, useEffect } from "react";
import { getApartments, createApartment, updateApartment, deleteApartment } from "../api";

const EMPTY_PHONE = { number: "", contact: "", main: true };
const EMPTY = { id: "", label: "", resident: "", phones: [{ ...EMPTY_PHONE }] };

function phonesToForm(apt) {
  if (!apt.phones?.length) return [{ ...EMPTY_PHONE }];
  if (typeof apt.phones[0] === "string") {
    return apt.phones.map((p, i) => ({ number: p, contact: "", main: i === 0 }));
  }
  const hasMain = apt.phones.some((p) => p.main);
  return apt.phones.map((p, i) => ({ ...p, main: hasMain ? !!p.main : i === 0 }));
}

function phonesFromForm(phones) {
  return phones.filter((p) => p.number.trim()).map((p) => ({
    number: p.number.trim(),
    contact: p.contact.trim(),
    main: !!p.main,
  }));
}

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

  const openCreate = () => { setForm({ ...EMPTY, id: String(Date.now()), phones: [{ ...EMPTY_PHONE }] }); setModal("create"); setMsg(""); };
  const openEdit = (apt) => {
    setForm({ ...apt, phones: phonesToForm(apt) });
    setModal(apt);
    setMsg("");
  };
  const closeModal = () => { setModal(null); setMsg(""); };

  const setPhoneField = (i, field, val) => {
    const phones = form.phones.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    setForm({ ...form, phones });
  };
  const setMainPhone = (i) => {
    const phones = form.phones.map((p, idx) => ({ ...p, main: idx === i }));
    setForm({ ...form, phones });
  };
  const addPhone = () => setForm({ ...form, phones: [...form.phones, { number: "", contact: "", main: false }] });
  const removePhone = (i) => {
    let phones = form.phones.filter((_, idx) => idx !== i);
    if (phones.length && !phones.some((p) => p.main)) phones[0].main = true;
    setForm({ ...form, phones });
  };

  const handleSave = async () => {
    if (!form.label) return setMsg("Identificação é obrigatória.");
    setSaving(true);
    const phones = phonesFromForm(form.phones);
    try {
      if (modal === "create") await createApartment({ ...form, phones });
      else await updateApartment(modal.id, { label: form.label, resident: form.resident, phones });
      load();
      closeModal();
    } catch { setMsg("Erro ao salvar."); }
    setSaving(false);
  };

  const handleDelete = async (apt) => {
    if (!confirm(`Remover ${apt.label}?`)) return;
    await deleteApartment(apt.id);
    load();
  };

  const getMainPhone = (apt) => {
    if (!apt.phones?.length) return null;
    if (typeof apt.phones[0] === "string") return { number: apt.phones[0], contact: "" };
    return apt.phones.find((p) => p.main) || apt.phones[0];
  };

  const configured = apts.filter((a) => a.phones?.length).length;

  return (
    <div>
      <div className="page-header">
        <h2>Apartamentos</h2>
        <p>Gerencie os apartamentos, moradores e telefones do condomínio</p>
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
              ? <span className="badge badge-green">Completo</span>
              : <span className="badge badge-yellow">Incompleto</span>}
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
                <th>Identificação</th><th>Morador</th>
                <th>Telefone principal</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {apts.map((apt) => {
                const main = getMainPhone(apt);
                return (
                  <tr key={apt.id}>
                    <td><strong>{apt.label}</strong></td>
                    <td>{apt.resident || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                    <td>
                      {main ? (
                        <span style={{ fontSize: 13 }}>
                          {main.number}
                          {main.contact && <span style={{ color: "#6b7280", marginLeft: 6 }}>({main.contact})</span>}
                        </span>
                      ) : <span style={{ color: "#9ca3af" }}>Não configurado</span>}
                    </td>
                    <td>
                      {apt.phones?.length
                        ? <span className="badge badge-green">Ativo</span>
                        : <span className="badge badge-red">Sem telefone</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(apt)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(apt)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <h3>{modal === "create" ? "Novo Apartamento" : `Editar ${modal.label}`}</h3>

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
              <small style={{ display: "block", color: "#6b7280", fontSize: 12, marginBottom: 10 }}>
                Selecione qual será o telefone principal. Os demais serão usados como fallback.
              </small>
              {form.phones.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input
                    type="radio"
                    name="mainPhone"
                    checked={p.main}
                    onChange={() => setMainPhone(i)}
                    title="Definir como principal"
                    style={{ cursor: "pointer" }}
                  />
                  <input
                    style={{ flex: 1 }}
                    placeholder="Telefone: +5511999990001"
                    value={p.number}
                    onChange={(e) => setPhoneField(i, "number", e.target.value)}
                  />
                  <input
                    style={{ flex: 1 }}
                    placeholder="Nome do contato"
                    value={p.contact}
                    onChange={(e) => setPhoneField(i, "contact", e.target.value)}
                  />
                  {form.phones.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removePhone(i)}>✕</button>
                  )}
                </div>
              ))}
              {form.phones.length < 5 && (
                <button className="btn btn-secondary btn-sm" onClick={addPhone} style={{ marginTop: 4 }}>
                  + Adicionar telefone
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
