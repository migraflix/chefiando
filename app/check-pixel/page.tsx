// Página pública sin auth para verificar que Meta Pixel está cargado.
// Solo informativa — no rastrea nada distinto al resto del sitio.

import { PIXEL_ID } from "@/components/ads-pixels";

export const metadata = {
  title: "Check Meta Pixel",
  robots: { index: false, follow: false },
};

export default function CheckPixelPage() {
  return (
    <main style={{ maxWidth: 640, margin: "60px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Meta Pixel · Status</h1>

      <div
        style={{
          background: "#dcfce7",
          border: "1px solid #16a34a",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: "#166534" }}>
          ✓ Meta Pixel instalado
        </p>
        <p style={{ margin: "8px 0 0 0", fontFamily: "monospace", color: "#166534" }}>
          ID: {PIXEL_ID}
        </p>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24, marginBottom: 8 }}>Eventos activos</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <code>PageView</code> — en todas las páginas del sitio.
        </li>
        <li>
          <code>Lead</code> — al enviar el form de <code>/oportunidad</code>.
        </li>
        <li>
          <code>CompleteRegistration</code> — al cargar <code>/fotos/gracias?processed=1</code>.
        </li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 24, marginBottom: 8 }}>Cómo verificar</h2>
      <ol style={{ lineHeight: 1.8 }}>
        <li>Instalar la extensión <strong>Meta Pixel Helper</strong> en Chrome.</li>
        <li>Abrir cualquier página de este sitio.</li>
        <li>Click en el ícono de la extensión: debe mostrar el pixel y el evento <code>PageView</code>.</li>
      </ol>

      <p style={{ color: "#6b7280", fontSize: 13, marginTop: 32 }}>
        Si algo no cuadra, avisar a Gabriel.
      </p>
    </main>
  );
}
