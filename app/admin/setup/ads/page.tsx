// Server component: lee NEXT_PUBLIC_* directo de process.env y muestra estado.
// Read-only a propósito: cambiar valores requiere editar Vercel + redeploy.
// Razón: los scripts se inyectan inline en el HTML inicial (cero delay), lo que
// solo es posible si los IDs están en ENV vars al momento del build/server-render.

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL
const GOOGLE_ADS_REGISTRATION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_LABEL
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

function Row({ name, value, hint }: { name: string; value: string | undefined; hint?: string }) {
  const ok = !!value
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0">
      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-gray-600'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-mono break-all">{name}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <span className={`text-xs font-mono whitespace-nowrap ${ok ? 'text-green-400' : 'text-gray-500'}`}>
        {ok ? value : 'sin configurar'}
      </span>
    </div>
  )
}

export default function AdsSetupPage() {
  const metaOk = !!META_PIXEL_ID
  const googleAdsOk = !!GOOGLE_ADS_ID
  const gtmOk = !!GTM_ID

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Setup · Ads</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Estado de los pixeles de rastreo. Los eventos{' '}
          <span className="font-mono text-gray-400">Lead</span> (submit de{' '}
          <span className="font-mono text-gray-400">/oportunidad</span>) y{' '}
          <span className="font-mono text-gray-400">CompleteRegistration</span> (carga de{' '}
          <span className="font-mono text-gray-400">/fotos/gracias?processed=1</span>) se disparan
          automáticamente cuando hay al menos un pixel configurado.
        </p>
      </div>

      <div className="bg-amber-950/40 border border-amber-900/60 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-200">Esta página es solo lectura</p>
        <p className="text-xs text-amber-200/70 mt-1">
          Para editar los pixel IDs, andá a <span className="font-mono">Vercel → este proyecto → Settings → Environment Variables</span>{' '}
          y redeploy. Lo hacemos así para inyectar los scripts inline en el HTML inicial (cero
          delay en el primer PageView, que es lo que importa para tracking).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Meta Pixel (Facebook / Instagram)</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {metaOk
              ? 'Activo. Dispara Lead y CompleteRegistration.'
              : 'Sin configurar. Agrega NEXT_PUBLIC_META_PIXEL_ID en Vercel.'}
          </p>
        </div>
        <Row
          name="NEXT_PUBLIC_META_PIXEL_ID"
          value={META_PIXEL_ID}
          hint="ID numérico (Business Manager → Eventos)"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Google Ads</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {googleAdsOk
              ? 'Activo. Necesita los conversion labels para que los eventos cuenten.'
              : 'Sin configurar. Agrega NEXT_PUBLIC_GOOGLE_ADS_ID y los labels en Vercel.'}
          </p>
        </div>
        <Row name="NEXT_PUBLIC_GOOGLE_ADS_ID" value={GOOGLE_ADS_ID} hint="Formato AW-XXXXXXXXXX" />
        <Row
          name="NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL"
          value={GOOGLE_ADS_LEAD_LABEL}
          hint="Conversion label del evento Lead"
        />
        <Row
          name="NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_LABEL"
          value={GOOGLE_ADS_REGISTRATION_LABEL}
          hint="Conversion label del evento CompleteRegistration"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Google Tag Manager</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {gtmOk
              ? 'Activo. Los eventos también se empujan al dataLayer.'
              : 'Opcional. Si usás GTM en vez de gtag directo, agrega NEXT_PUBLIC_GTM_ID.'}
          </p>
        </div>
        <Row name="NEXT_PUBLIC_GTM_ID" value={GTM_ID} hint="Formato GTM-XXXXXXX" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Cómo configurar (5 minutos)</p>
        <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
          <li>Vercel → este proyecto → Settings → Environment Variables.</li>
          <li>
            Agregar las variables con el prefijo <span className="font-mono text-gray-300">NEXT_PUBLIC_</span>{' '}
            (obligatorio para que se inyecten en el cliente).
          </li>
          <li>
            Redeploy (Vercel → Deployments → ... → Redeploy). Los pixeles aparecen inline en el{' '}
            <span className="font-mono text-gray-300">&lt;head&gt;</span> de todas las páginas.
          </li>
          <li>
            Verificar con la extensión <span className="text-gray-300">Meta Pixel Helper</span> o{' '}
            <span className="text-gray-300">Tag Assistant</span>.
          </li>
          <li>Refrescar esta página: los círculos verdes indican qué quedó activo.</li>
        </ol>
      </div>
    </div>
  )
}
