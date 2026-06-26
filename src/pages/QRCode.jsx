import { useState } from "react";

const FRONTEND_URL = "https://interfonevirtual-villagemontreal.netlify.app";

export default function QRCode() {
  const [url, setUrl] = useState(FRONTEND_URL);
  const [size, setSize] = useState(400);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=20&color=1a1a2e`;

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code — Interfone Virtual</title>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
          .page { text-align: center; padding: 40px; }
          h1 { font-size: 28px; margin-bottom: 8px; color: #1a1a2e; }
          p { color: #6b7280; margin-bottom: 24px; font-size: 16px; }
          img { display: block; margin: 0 auto 20px; border: 8px solid #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
          .url { font-size: 13px; color: #9ca3af; word-break: break-all; }
          .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>🔔 Interfone Virtual</h1>
          <p>Aponte a câmera do celular para chamar um morador</p>
          <img src="${qrUrl}" width="${size}" height="${size}" />
          <div class="url">${url}</div>
          <div class="footer">Em caso de emergência, acione o zelador</div>
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = "qrcode-interfone.png";
    link.click();
  };

  return (
    <div>
      <div className="page-header">
        <h2>QR Code</h2>
        <p>Gere e imprima o QR Code para colocar na portaria</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Configurações</h3>

          <div className="form-group">
            <label>URL do interfone</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
            <small style={{ color: "#6b7280", fontSize: 12 }}>
              URL pública do frontend (Vercel)
            </small>
          </div>

          <div className="form-group">
            <label>Tamanho do QR Code</label>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={200}>Pequeno (200px)</option>
              <option value={300}>Médio (300px)</option>
              <option value={400}>Grande (400px)</option>
              <option value={600}>Extra Grande (600px)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Imprimir</button>
            <button className="btn btn-secondary" onClick={handleDownload}>⬇️ Baixar PNG</button>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
            <strong style={{ fontSize: 13, color: "#0369a1" }}>💡 Dica de uso</strong>
            <p style={{ fontSize: 13, color: "#0369a1", marginTop: 6, lineHeight: 1.6 }}>
              Imprima o QR Code em tamanho A5 ou A4, plastifique e fixe na parede da portaria ou interfone. O visitante aponta a câmera do celular e seleciona o apartamento desejado.
            </p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Prévia do QR Code</p>
          <div style={{ padding: 16, background: "#fff", borderRadius: 12, border: "2px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
            <img
              src={qrUrl}
              alt="QR Code"
              width={size > 300 ? 300 : size}
              height={size > 300 ? 300 : size}
              style={{ display: "block" }}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <strong style={{ fontSize: 15 }}>🔔 Interfone Virtual</strong>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Aponte a câmera para chamar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
