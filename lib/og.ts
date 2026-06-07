// Baja la imagen de previsualización (Open Graph / Twitter) de una página web.
// Sirve para mostrar una miniatura de videos cuyo origen no la provee solo (Vimeo,
// Drive, Loom o cualquier link externo). Devuelve null si no encuentra nada.
export async function fetchOgImage(url: string): Promise<string | null> {
  let base: URL
  try {
    base = new URL(url)
  } catch {
    return null
  }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Algunos sitios devuelven el HTML completo solo a navegadores reales
        'User-Agent': 'Mozilla/5.0 (compatible; KineTrackBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('html')) return null

    const html = (await res.text()).slice(0, 500_000) // sólo el principio: ahí van los <meta>

    const found = extractMetaImage(html)
    if (!found) return null

    // Resolver rutas relativas contra la URL de la página
    try {
      return new URL(found, base).toString()
    } catch {
      return null
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function extractMetaImage(html: string): string | null {
  const props = ['og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image', 'twitter:image:src']
  for (const prop of props) {
    // <meta property="og:image" content="...">  y  <meta content="..." property="og:image">
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*\\bcontent=["']([^"']+)["']`, 'i')
    const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i')
    const m = html.match(a) ?? html.match(b)
    if (m?.[1]) return decodeEntities(m[1].trim())
  }
  return null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#47;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
