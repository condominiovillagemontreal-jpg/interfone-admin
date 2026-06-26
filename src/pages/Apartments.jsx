import { useState, useEffect, useRef } from "react";
import { getApartments, createApartment, updateApartment, deleteApartment, bulkUpsertApartments } from "../api";
import * as XLSX from "xlsx";

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
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState({ text: "", type: "" });
  const fileRef = useRef();

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

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportMsg({ text: "", type: "" });
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const apartments = rows.map((row) => {
        const label = String(row["Identificação"] || row["Identificacao"] || row["identificacao"] || row["identificação"] || "").trim();
        const resident = String(row["Nome Morador"] || row["nome morador"] || row["Morador"] || row["morador"] || "").trim();
        const phone1 = String(row["telefone de Discagem 1"] || row["Telefone 1"] || row["telefone1"] || row["Telefone de Discagem 1"] || "").trim();
        const name1 = String(row["nome pessoa 1"] || row["Nome Pessoa 1"] || row["Contato 1"] || row["contato1"] || "").trim();
        const phone2 = String(row["telefone discagem 2"] || row["Telefone 2"] || row["telefone2"] || row["Telefone de Discagem 2"] || "").trim();
        const name2 = String(row["nome pessoa 2"] || row["Nome Pessoa 2"] || row["Contato 2"] || row["contato2"] || "").trim();
        const mainRaw = String(row["telefone Principal"] || row["Telefone Principal"] || row["principal"] || "1").trim();

        const phones = [];
        if (phone1) phones.push({ number: phone1, contact: name1, main: mainRaw === "1" || mainRaw.toLowerCase() === phone1.toLowerCase() || !phone2 });
        if (phone2) phones.push({ number: phone2, contact: name2, main: mainRaw === "2" || mainRaw.toLowerCase() === phone2.toLowerCase() });
        if (phones.length && !phones.some((p) => p.main)) phones[0].main = true;

        return { label, resident, phones };
      }).filter((a) => a.label);

      if (!apartments.length) {
        setImportMsg({ text: "Nenhum apartamento encontrado na planilha. Verifique os nomes das colunas.", type: "error" });
        setImporting(false);
        return;
      }

      const result = await bulkUpsertApartments(apartments);
      load();
      setImportMsg({
        text: `${result.success} apartamento(s) importado(s) com sucesso!${result.errors.length ? ` ${result.errors.length} erro(s).` : ""}`,
        type: result.errors.length ? "warning" : "success"
      });
    } catch (err) {
      setImportMsg({ text: "Erro ao processar a planilha: " + err.message, type: "error" });
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Identificação", "Nome Morador", "telefone de Discagem 1", "nome pessoa 1", "telefone discagem 2", "nome pessoa 2", "telefone Principal"],
      ["Apto 101", "Família Silva", "+5511999990001", "João Silva", "+5511999990002", "Maria Silva", "1"],
      ["Apto 102", "Família Santos", "+5511888880001", "Pedro Santos", "", "", "1"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Apartamentos");
    XLSX.writeFile(wb, "modelo_apartamentos.xlsx");
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
      {importMsg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16,
          background: importMsg.type === "error" ? "#fef2f2" : importMsg.type === "warning" ? "#fef9c3" : "#f0fdf4",
          border: `1px solid ${importMsg.type === "error" ? "#fecaca" : importMsg.type === "warning" ? "#fde68a" : "#bbf7d0"}`,
          color: importMsg.type === "error" ? "#dc2626" : importMsg.type === "warning" ? "#854d0e" : "#15803d", fontSize: 14,
        }}>{importMsg.text}</div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong style={{ fontSize: 15 }}>Importar via Excel</strong>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Suba uma planilha .xlsx com as colunas: Identificacao, Nome Morador, telefone de Discagem 1, nome pessoa 1, telefone discagem 2, nome pessoa 2, telefone Principal
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleDownloadTemplate}>Baixar modelo</button>
            <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImportExcel} />
            <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={importing}>
              {importing ? "Importando..." : "Importar Excel"}
            </button>
          </div>
        </div>
      </div>

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
                    style={{ cursor: "pointer", width: "auto", flexShrink: 0 }}
                  />
                  <input
                    style={{ flex: 1, width: "auto", minWidth: 0 }}
                    placeholder="Telefone: +5511999990001"
                    value={p.number || ""}
                    onChange={(e) => setPhoneField(i, "number", e.target.value)}
                  />
                  <input
                    style={{ flex: 1, width: "auto", minWidth: 0 }}
                    placeholder="Nome do contato"
                    value={p.contact || ""}
                    onChange={(e) => setPhoneField(i, "contact", e.target.value)}
                  />
                  {form.phones.length > 1 && (
                    <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => removePhone(i)}>✕</button>
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
