import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [loginType, setLoginType] = useState("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [changePw, setChangePw] = useState(null);
  const [newPw, setNewPw] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");

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
    if (!name.trim()) return showMsg("Nome é obrigatório.", "error");
    if (password.length < 6) return showMsg("A senha deve ter pelo menos 6 caracteres.", "error");

    if (loginType === "email" && !email.trim()) return showMsg("Email é obrigatório.", "error");
    if (loginType === "username" && !username.trim()) return showMsg("Nome de usuário é obrigatório.", "error");

    setSaving(true);

    const authEmail = loginType === "email" ? email.trim() : `${username.trim().toLowerCase()}@interfone.local`;

    const { data, error } = await supabase.auth.signUp({ email: authEmail, password });
    if (error) {
      const msg = error.message === "User already registered" ? "E-mail ou usuário já cadastrado." : error.message;
      showMsg(msg, "error");
      setSaving(false);
      return;
    }

    const insertData = {
      id: data.user.id,
      email: loginType === "email" ? email.trim() : null,
      name: name.trim(),
      username: loginType === "username" ? username.trim().toLowerCase() : null,
    };

    const { error: dbErr } = await supabase.from("admin_users").insert(insertData);
    if (dbErr) {
      showMsg("Erro ao salvar dados: " + dbErr.message, "error");
    } else {
      showMsg("Usuário criado com sucesso!");
      setName(""); setEmail(""); setUsername(""); setPassword("");
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

  const startEdit = (user) => {
    setEditing(user.id);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditUsername(user.username || "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName("");
    setEditEmail("");
    setEditUsername("");
  };

  const handleSaveEdit = async (userId) => {
    if (!editName.trim()) return showMsg("Nome é obrigatório.", "error");
    const updates = { name: editName.trim() };
    if (editEmail.trim()) updates.email = editEmail.trim();
    if (editUsername.trim()) updates.username = editUsername.trim().toLowerCase();
    const { error } = await supabase.from("admin_users").update(updates).eq("id", userId);
    if (error) {
      showMsg("Erro ao salvar: " + error.message, "error");
    } else {
      showMsg("Usuário atualizado!");
      cancelEdit();
      loadUsers();
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Remover o usuário ${user.name || user.email || user.username}?`)) return;
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
        <form onSubmit={handleCreate}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label>Nome *</label>
              <input placeholder="Nome completo" value={name}
                onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label>Senha (mínimo 6 caracteres) *</label>
              <input type="password" placeholder="Senha" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 8 }}>Tipo de login</label>
            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                <input type="radio" name="loginType" checked={loginType === "email"} onChange={() => setLoginType("email")} />
                E-mail
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                <input type="radio" name="loginType" checked={loginType === "username"} onChange={() => setLoginType("username")} />
                Nome de usuário
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            {loginType === "email" ? (
              <div className="form-group" style={{ flex: 1, minWidth: 250, marginBottom: 0 }}>
                <label>E-mail *</label>
                <input type="email" placeholder="usuario@exemplo.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              </div>
            ) : (
              <div className="form-group" style={{ flex: 1, minWidth: 250, marginBottom: 0 }}>
                <label>Nome de usuário *</label>
                <input placeholder="Ex: sindico, portaria" value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))} />
                <small style={{ color: "#6b7280", fontSize: 11 }}>Apenas letras, números, pontos e hífens</small>
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 38 }}>
              {saving ? "Criando..." : "+ Criar usuário"}
            </button>
          </div>
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
                <th>Nome</th>
                <th>Login</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {editing === u.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome"
                        style={{ padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6, width: "100%" }} />
                    ) : (u.name || <span style={{ color: "#9ca3af" }}>—</span>)}
                  </td>
                  <td>
                    {editing === u.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="E-mail (opcional)"
                          style={{ padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }} />
                        <input value={editUsername} onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))} placeholder="Username (opcional)"
                          style={{ padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }} />
                      </div>
                    ) : (
                      u.username
                        ? <span><span className="badge badge-gray">Usuário</span> {u.username}</span>
                        : <span><span className="badge badge-gray">E-mail</span> {u.email}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {editing === u.id ? (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleSaveEdit(u.id)}>Salvar</button>
                          <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancelar</button>
                        </>
                      ) : changePw === u.id ? (
                        <>
                          <input type="password" placeholder="Nova senha" value={newPw}
                            onChange={(e) => setNewPw(e.target.value)} style={{ width: 140, padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }} />
                          <button className="btn btn-success btn-sm" onClick={() => handleChangePassword(u.id)}>Salvar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setChangePw(null); setNewPw(""); }}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(u)}>Editar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setChangePw(u.id)}>Senha</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u)}>Remover</button>
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
