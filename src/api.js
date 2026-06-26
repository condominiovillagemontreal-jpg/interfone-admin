import { supabase } from "./supabase";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// ── Apartamentos ──────────────────────────────────────────
export async function getApartments() {
  const { data, error } = await supabase.from("apartments").select("*").order("id");
  if (error) throw error;
  return data;
}

export async function createApartment({ id, label, resident, phones }) {
  const { error } = await supabase.from("apartments").insert({ id, label, resident: resident || "", phones: phones || [] });
  if (error) throw error;
  return { ok: true };
}

export async function updateApartment(id, updates) {
  const { error } = await supabase.from("apartments").update(updates).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function deleteApartment(id) {
  const { error } = await supabase.from("apartments").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

// ── Config ────────────────────────────────────────────────
export async function getConfig() {
  const { data, error } = await supabase.from("config").select("*").eq("id", 1).single();
  if (error) throw error;
  return {
    buildingName: data.building_name,
    logoUrl: data.logo_url,
    greeting: data.greeting,
    callTimeoutSeconds: data.call_timeout_seconds,
    sipServer: data.sip_server,
    sipPort: data.sip_port,
    sipDomain: data.sip_domain,
    sipUsername: data.sip_username,
    sipPassword: data.sip_password,
    sipDisplayName: data.sip_display_name,
    sipLocalIp: data.sip_local_ip,
  };
}

export async function updateConfig(form) {
  const { error } = await supabase.from("config").update({
    building_name: form.buildingName,
    logo_url: form.logoUrl,
    greeting: form.greeting,
    call_timeout_seconds: form.callTimeoutSeconds,
    sip_server: form.sipServer,
    sip_port: form.sipPort,
    sip_domain: form.sipDomain,
    sip_username: form.sipUsername,
    sip_password: form.sipPassword,
    sip_display_name: form.sipDisplayName,
    sip_local_ip: form.sipLocalIp,
  }).eq("id", 1);
  if (error) throw error;
  return { ok: true };
}

// ── Logo (Supabase Storage) ───────────────────────────────
export async function uploadLogo(file) {
  const ext = file.name.split(".").pop();
  const fileName = `logo.${ext}`;
  const { error } = await supabase.storage.from("logos").upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName);
  const url = urlData.publicUrl + "?t=" + Date.now();
  await supabase.from("config").update({ logo_url: url }).eq("id", 1);
  return { ok: true, url };
}

export async function deleteLogo() {
  const { data: files } = await supabase.storage.from("logos").list();
  if (files?.length) {
    await supabase.storage.from("logos").remove(files.map((f) => f.name));
  }
  await supabase.from("config").update({ logo_url: "" }).eq("id", 1);
  return { ok: true };
}

// ── Chamadas (log local backend) ──────────────────────────
export async function getCalls() {
  const r = await fetch(`${BACKEND}/api/admin/calls`);
  return r.json();
}

export async function clearCalls() {
  const r = await fetch(`${BACKEND}/api/admin/calls`, { method: "DELETE" });
  return r.json();
}

// ── Sistema ───────────────────────────────────────────────
export async function shutdownSystem() {
  const r = await fetch(`${BACKEND}/api/admin/shutdown`, { method: "POST" });
  return r.json();
}
