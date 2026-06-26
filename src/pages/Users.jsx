import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [changePw, setChangePw] = useState(null);
  const [newPw, setNewPw] = useState("");

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) return showMsg("A senha deve ter pelo menos 6 caracteres.", "error");
    setSaving(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = error.message === "User already registered" ? "E-mail já cadastrado." : error.message;
      showMsg(msg, "error");
    } else {
      await supabase.from("admin_users").insert({ id: data.user.id, email });
      showMsg("Usuário criado com sucesso!");
      setEmail("");
      setPassword("");
      loadUsers();
    }
    setSaving(false);
  };

  const handleChangePassword = async (userId) => {
    if (!newPw || newPw.length < 6) return showMsg("A senha deve ter pelo menos 6 caracteres.", "error");
    const { error } = await supabase.rpc("admin_change_password", { target_user_id: userId, new_password: newPw });
    if (error) {
      showMsg("Erro ao trocar senha: " + error.message, "error");
    } else {
      showMsg("Senha alterada com sucesso!");
      setChangePw(null);
      setNewPw("");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Remover o usuário ${user.email}?`)) return;
    await supabase.from("admin_users").delete().eq("id", user.id);
    loadUsers();
    showMsg("Usuário removido da lista.");
  };

  return (
    <div>
      <div className="page-header">
        <h2>Cadastro de Usuários</h2>
        <p>Gerencie os administradores do sistema</p>
      </div>

      {msg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          color: msg.type === "error" ? "#dc2626" : "#15803d", fontSize: 14,
        }}>{msg.text}</div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Novo Usuário</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Email</label>
            <input type="email" placeholder="usuario@exemplo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Senha (mínimo 6 caracteres)</label>
            <input type="password" placeholder="Senha" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 38 }}>
            {saving ? "Criando..." : "+ Criar usuário"}
          </button>
        </form>
      </div>

      <div className="card">
        <strong style={{ fontSize: 15, display: "block", marginBottom: 16 }}>Usuários cadastrados</strong>
        {users.length === 0 ? (
          <div className="empty">Nenhum usuário cadastrado ainda.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {changePw === u.id ? (
                        <>
                          <input type="password" placeholder="Nova senha" value={newPw}
                            onChange={(e) => setNewPw(e.target.value)} style={{ width: 160, padding: "6px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }} />
                          <button className="btn btn-success btn-sm" onClick={() => handleChangePassword(u.id)}>Salvar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setChangePw(null); setNewPw(""); }}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => setChangePw(u.id)}>🔑 Trocar senha</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u)}>🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
