import { useState, useEffect, useRef } from "react";
import { getConfig, updateConfig, uploadLogo, deleteLogo } from "../api";

const EMPTY_FORM = {
  buildingName: "",
  greeting: "",
  logoUrl: "",
  callTimeoutSeconds: 25,
  sipServer: "",
  sipPort: 5060,
  sipDomain: "",
  sipUsername: "",
  sipPassword: "",
  sipDisplayName: "Portaria",
  sipLocalIp: "",
};

export default function Config() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    getConfig().then((d) => {
      setForm({
        buildingName: d.buildingName || "",
        greeting: d.greeting || "",
        logoUrl: d.logoUrl || "",
        callTimeoutSeconds: d.callTimeoutSeconds || 25,
        sipServer: d.sipServer || "",
        sipPort: d.sipPort || 5060,
        sipDomain: d.sipDomain || "",
        sipUsername: d.sipUsername || "",
        sipPassword: d.sipPassword || "",
        sipDisplayName: d.sipDisplayName || "Portaria",
        sipLocalIp: d.sipLocalIp || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(form);
      showMsg("✅ Configurações salvas com sucesso!");
    } catch { showMsg("❌ Erro ao salvar.", "error"); }
    setSaving(false);
  };

  const handleLogoFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadLogo(file);
      setLogoPreview(data.url);
      setForm((f) => ({ ...f, logoUrl: data.url }));
      showMsg("✅ Logo enviada com sucesso!");
    } catch { showMsg("❌ Erro ao enviar logo.", "error"); }
    setUploadingLogo(false);
  };

  const handleDeleteLogo = async () => {
    if (!confirm("Remover a logo atual?")) return;
    await deleteLogo();
    setLogoPreview("");
    setForm({ ...form, logoUrl: "" });
    showMsg("✅ Logo removida.");
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const sipOk = form.sipDomain && form.sipUsername && form.sipPassword;
  const currentLogo = logoPreview || form.logoUrl;

  if (loading) return <div className="card"><div className="empty">Carregando...</div></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Configurações do Sistema</h2>
        <p>Personalize o interfone e configure sua operadora VOIP</p>
      </div>

      {msg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          color: msg.type === "error" ? "#dc2626" : "#15803d", fontSize: 14,
        }}>{msg.text}</div>
      )}

      {/* Logo */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Logo do Condomínio</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Exibida na tela do interfone quando o visitante escaneia o QR Code.
        </p>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{
            width: 160, height: 100, border: "2px dashed #e5e7eb", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#f9fafb", overflow: "hidden", flexShrink: 0,
          }}>
            {currentLogo
              ? <img src={currentLogo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              : <span style={{ fontSize: 13, color: "#9ca3af" }}>Sem logo</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label>Upload de arquivo (PNG, JPG, SVG)</label>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleLogoFile} />
              <button className="btn btn-secondary" onClick={() => fileRef.current.click()} disabled={uploadingLogo}>
                {uploadingLogo ? "Enviando..." : "📁 Escolher arquivo"}
              </button>
            </div>
            <div className="form-group">
              <label>Ou informe uma URL de imagem</label>
              <input placeholder="https://..." value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
            </div>
            {currentLogo && (
              <button className="btn btn-danger btn-sm" onClick={handleDeleteLogo}>🗑️ Remover logo</button>
            )}
          </div>
        </div>
      </div>

      {/* Identidade */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Identidade</h3>
        <div className="form-group">
          <label>Nome do Condomínio / Empresa</label>
          <input placeholder="Ex: Condomínio Village Montreal" value={form.buildingName}
            onChange={(e) => set("buildingName", e.target.value)} />
        </div>
        <div className="form-group">
          <label>Mensagem de boas-vindas</label>
          <input placeholder="Ex: Selecione o apartamento que deseja chamar"
            value={form.greeting} onChange={(e) => set("greeting", e.target.value)} />
        </div>
        <div className="form-group" style={{ maxWidth: 200 }}>
          <label>Timeout de chamada (segundos)</label>
          <input type="number" min={10} max={60} value={form.callTimeoutSeconds}
            onChange={(e) => set("callTimeoutSeconds", Number(e.target.value))} />
        </div>
      </div>

      {/* VOIP / SIP */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Configuração VOIP / SIP</h3>
          {sipOk
            ? <span className="badge badge-green">✅ Configurado</span>
            : <span className="badge badge-red">❌ Não configurado</span>}
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Informe os dados do ramal SIP da portaria na sua operadora VOIP. O sistema usará esses dados
          para conectar ao servidor e fazer a ligação diretamente para o morador.
        </p>

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#0369a1" }}>
          <strong>ℹ️ Como funciona:</strong> O servidor do interfone se registra com sua operadora VOIP via protocolo SIP/UDP e faz a ligação diretamente para o celular do morador. Compatível com VoIP do Brasil, Nuvem Fone, e qualquer operadora SIP padrão.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <div className="form-group">
            <label>Servidor SIP (host) <span style={{ color: "#dc2626" }}>*</span></label>
            <input placeholder="voipdobrasil.net.br" value={form.sipServer}
              onChange={(e) => set("sipServer", e.target.value)} />
            <small style={{ color: "#6b7280", fontSize: 12 }}>Endereço do servidor da operadora</small>
          </div>

          <div className="form-group">
            <label>Porta SIP</label>
            <input type="number" placeholder="5060" value={form.sipPort}
              onChange={(e) => set("sipPort", Number(e.target.value))} />
            <small style={{ color: "#6b7280", fontSize: 12 }}>Padrão: 5060 (UDP)</small>
          </div>

          <div className="form-group">
            <label>Domínio / Realm SIP <span style={{ color: "#dc2626" }}>*</span></label>
            <input placeholder="voipdobrasil.net.br" value={form.sipDomain}
              onChange={(e) => set("sipDomain", e.target.value)} />
            <small style={{ color: "#6b7280", fontSize: 12 }}>Geralmente igual ao servidor</small>
          </div>

          <div className="form-group">
            <label>Nome exibido (Caller ID)</label>
            <input placeholder="Portaria" value={form.sipDisplayName}
              onChange={(e) => set("sipDisplayName", e.target.value)} />
          </div>

          <div className="form-group">
            <label>Ramal / Usuário SIP <span style={{ color: "#dc2626" }}>*</span></label>
            <input placeholder="6075931" value={form.sipUsername}
              onChange={(e) => set("sipUsername", e.target.value)} />
          </div>

          <div className="form-group">
            <label>Senha SIP <span style={{ color: "#dc2626" }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type={showPassword ? "text" : "password"} placeholder="Senha do ramal"
                value={form.sipPassword} onChange={(e) => set("sipPassword", e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPassword(!showPassword)} style={{ flexShrink: 0 }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>IP local do servidor (opcional)</label>
            <input placeholder="Deixe vazio para detectar automaticamente" value={form.sipLocalIp}
              onChange={(e) => set("sipLocalIp", e.target.value)} />
            <small style={{ color: "#6b7280", fontSize: 12 }}>
              IP da máquina onde o backend roda. Usado no SDP para receber o áudio RTP. Se vazio, detectado automaticamente.
            </small>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "12px 32px", fontSize: 15 }}>
          {saving ? "Salvando..." : "💾 Salvar configurações"}
        </button>
      </div>
    </div>
  );
}
