// R2-backed, read-only image delivery. No upload or arbitrary proxy endpoint.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405 });
    }
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!/^native\/[a-z0-9-]+\/2026-10-18\.webp$/.test(key)) {
      return new Response('Not found', { status: 404 });
    }
    const object = await env.SCREENSHOTS.get(key);
    if (!object) return new Response('Not found', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : object.body, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        ETag: object.httpEtag,
      },
    });
  },
};
