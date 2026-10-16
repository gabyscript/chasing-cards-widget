// Function de prueba del setup: confirma que Netlify Functions responde en local y en producción.
export default async () =>
  Response.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  )
