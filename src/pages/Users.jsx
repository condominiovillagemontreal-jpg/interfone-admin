import { useState } from "react";
import { supabase } from "../supabase";

export default function Users() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) return showMsg("A senha deve ter pelo menos 6 caracteres.", "error");
    setSaving(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showMsg(error.message, "error");
    } else {
      showMsg("Usuário criado com sucesso!");
      setEmail("");
      setPassword("");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Cadastro de Usuários</h2>
        <p>Adicione novos administradores ao sistema</p>
      </div>

      {msg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          color: msg.type === "error" ? "#dc2626" : "#15803d", fontSize: 14,
        }}>{msg.text}</div>
      )}

      <div className="card" style={{ maxWidth: 480 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Novo Usuário</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="usuario@exemplo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Senha (mínimo 6 caracteres)</label>
            <input type="password" placeholder="Senha do novo usuário" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}
            style={{ padding: "10px 24px", fontSize: 14 }}>
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ padding: "14px 0", fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
          <strong>Como funciona:</strong><br />
          Cada usuário criado recebe acesso ao painel administrativo com email e senha.
          O novo usuário poderá fazer login em <strong>admin-villagemontreal.netlify.app</strong> imediatamente.
        </div>
      </div>
    </div>
  );
}
