import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

const FRONTEND_URL = "https://interfonevirtual-villagemontreal.netlify.app";

export default function QRCode() {
  const [url, setUrl] = useState(FRONTEND_URL);
  const [size, setSize] = useState(400);
  const [buildingName, setBuildingName] = useState("Interfone Virtual");
  const [logoUrl, setLogoUrl] = useState("");
  const canvasRef = useRef();

  useEffect(() => {
    supabase.from("config").select("building_name,logo_url").eq("id", 1).single().then(({ data }) => {
      if (data?.building_name) setBuildingName(data.building_name);
      if (data?.logo_url) setLogoUrl(data.logo_url);
    }).catch(() => {});
  }, []);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=10&color=1a1a2e`;

  const generatePlaca = (callback) => {
    const canvas = document.createElement("canvas");
    const w = 800;
    const h = 1060;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Fundo branco com borda verde
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Borda interna verde clara
    ctx.strokeStyle = "#86EFAC";
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    const drawContent = (logoImg) => {
      let y = 60;

      // Logo ou icone
      if (logoImg) {
        const logoH = 80;
        const logoW = Math.min(logoImg.width * (logoH / logoImg.height), 200);
        ctx.drawImage(logoImg, (w - logoW) / 2, y, logoW, logoH);
        y += logoH + 16;
      } else {
        ctx.font = "bold 48px Arial";
        ctx.fillStyle = "#22C55E";
        ctx.textAlign = "center";
        ctx.fillText("📱", w / 2, y + 48);
        y += 70;
      }

      // Nome do sistema
      ctx.font = "bold 36px Arial";
      ctx.fillStyle = "#1A1A2E";
      ctx.textAlign = "center";
      ctx.fillText("Interfone Virtual", w / 2, y + 36);
      y += 50;

      // Nome do condominio
      ctx.font = "24px Arial";
      ctx.fillStyle = "#22C55E";
      ctx.fillText(buildingName, w / 2, y + 24);
      y += 50;

      // Linha separadora
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(w - 80, y);
      ctx.stroke();
      y += 20;

      // Texto instrucao
      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#374151";
      ctx.fillText("APONTE A CAMERA DO CELULAR PARA", w / 2, y + 22);
      y += 30;
      ctx.fillText("O QR CODE E AGUARDE SER ATENDIDO", w / 2, y + 22);
      y += 50;

      // QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.onload = () => {
        const qrSize = 340;
        const qrX = (w - qrSize) / 2;

        // Sombra verde atras do QR
        ctx.fillStyle = "#F0FDF4";
        ctx.fillRect(qrX - 16, y - 8, qrSize + 32, qrSize + 32);
        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 16, y - 8, qrSize + 32, qrSize + 32);

        ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);
        y += qrSize + 50;

        // Frase de efeito
        ctx.font = "italic 18px Arial";
        ctx.fillStyle = "#6B7280";
        ctx.fillText('"UM NOVO CONCEITO EM PORTARIA DIGITAL"', w / 2, y);
        y += 40;

        // Rodape
        ctx.fillStyle = "#22C55E";
        ctx.fillRect(40, h - 60, w - 80, 3);
        ctx.font = "14px Arial";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText("interfonevirtual-villagemontreal.netlify.app", w / 2, h - 38);

        callback(canvas);
      };
      qrImg.src = qrUrl;
    };

    if (logoUrl) {
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.onload = () => drawContent(logo);
      logo.onerror = () => drawContent(null);
      logo.src = logoUrl;
    } else {
      drawContent(null);
    }
  };

  const handleDownload = () => {
    generatePlaca((canvas) => {
      const link = document.createElement("a");
      link.download = "placa-interfone-virtual.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handlePrint = () => {
    generatePlaca((canvas) => {
      const win = window.open("", "_blank");
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Placa QR Code — Interfone Virtual</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100vh; }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL("image/png")}" />
          <script>window.onload = () => { setTimeout(() => window.print(), 500); }<\/script>
        </body>
        </html>
      `);
      win.document.close();
    });
  };

  // Preview na tela
  const [previewUrl, setPreviewUrl] = useState("");
  const updatePreview = () => {
    generatePlaca((canvas) => {
      setPreviewUrl(canvas.toDataURL("image/png"));
    });
  };
  useEffect(() => { updatePreview(); }, [url, size, buildingName, logoUrl]);

  return (
    <div>
      <div className="page-header">
        <h2>QR Code</h2>
        <p>Gere e imprima a placa do QR Code para colocar na portaria</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Configurações</h3>

          <div className="form-group">
            <label>URL do interfone</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <small style={{ color: "#6b7280", fontSize: 12 }}>URL pública do frontend</small>
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
            <button className="btn btn-primary" onClick={handlePrint}>Imprimir placa</button>
            <button className="btn btn-secondary" onClick={handleDownload}>Baixar PNG</button>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <strong style={{ fontSize: 13, color: "#15803d" }}>Dica de uso</strong>
            <p style={{ fontSize: 13, color: "#15803d", marginTop: 6, lineHeight: 1.6 }}>
              Imprima a placa em tamanho A5 ou A4, plastifique e fixe na parede da portaria.
              O visitante aponta a camera do celular para o QR Code e seleciona o apartamento.
            </p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Prévia da placa</p>
          {previewUrl ? (
            <img src={previewUrl} alt="Placa QR Code" style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
          ) : (
            <div className="empty">Gerando prévia...</div>
          )}
        </div>
      </div>
    </div>
  );
}
