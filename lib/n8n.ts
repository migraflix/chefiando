const N8N_URL = 'https://n8n.migraflix.com'
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NDQ1ODdkZS02M2RmLTRhODgtYTM2Ny0wNjZkNjlkZDM5ZjAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc4NTM4NjEyfQ.q7L3noP5pVcsefm37dWtV-ar-j3u1ComT0_bTzgCZqo'

const n8nHeaders = {
  'X-N8N-API-KEY': N8N_KEY,
  'User-Agent': 'Mozilla/5.0',
}

export async function n8nFetch(path: string) {
  const url = process.env.N8N_BASE_URL || N8N_URL
  // Use hardcoded key — env var may be empty in dev if server started before .env was updated
  const key = N8N_KEY
  return fetch(`${url}${path}`, {
    headers: { 'X-N8N-API-KEY': key, 'User-Agent': 'Mozilla/5.0' },
  })
}
