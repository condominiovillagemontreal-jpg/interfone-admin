import { useState } from "react";
import { supabase } from "../supabase";

export default function Login() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const isEmail = loginValue.includes("@");
    const email = isEmail ? loginValue.trim() : `${loginValue.trim().toLowerCase()}@interfone.local`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === "Invalid login credentials" ? "Usuário ou senha incorretos." : error.message);
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ fontSize: 40 }}>🔔</div>
          <h1>Interfone Virtual</h1>
          <p>Painel de Administração</p>
        </div>
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16,
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", fontSize: 13,
            }}>{error}</div>
          )}
          <div className="form-group">
            <label>E-mail ou nome de usuário</label>
            <input placeholder="admin@exemplo.com ou sindico" value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" placeholder="Sua senha" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: "100%", padding: "12px", fontSize: 15, marginTop: 8 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
