/* SQSPThemes "Around the Web" | Cloudflare Pages Function
 * Aggregates the curated RSS/Atom feeds server-side to avoid browser CORS.
 * A failed/retired feed never prevents the others from appearing.
 */
const FEEDS = [["Applet Studio","https://www.applet.studio/blog?format=rss"],["Paige Brunton","https://www.paigebrunton.com/blog?format=rss"],["Designing the Row","https://www.designingtherow.com/blog?format=rss"],["Jen X Web Design","https://www.jenxwebdesign.com/blog?format=rss"],["Made by Dave","https://madebydave.org/blog?format=rss"],["by Crawford","https://bycrawford.com/blog?format=rss"],["Web Goyat","https://webgoyat.com/blog?format=rss"],["Clare Butler","https://www.clarebutler.co/blog?format=rss"],["Sunday Muse Design","https://www.sundaymusedesign.com/blog?format=rss"],["Pocketknife","https://www.pocketknife.design/blog?format=rss"],["Big Cat Creative","https://bigcatcreative.com/blog?format=rss"],["byRosanna","https://www.byrosanna.co.uk/blog?format=rss"],["Launch the Damn Thing","https://launchthedamnthing.com/blog?format=rss"],["Spark Plugin","https://www.sparkplugin.com/blog?format=rss"],["SquareWebsites","https://www.squarewebsites.org/blog?format=rss"],["HopeSpring Digital","https://hopespringdigital.com/blog?format=rss"],["Squarestylist","https://www.squarestylist.com/blog?format=rss"],["Beyondspace","https://beyondspace.studio/blog?format=rss"],["iane","https://iane.ca/blog?format=rss"],["Will Myers","https://www.will-myers.com/articles?format=rss"],["Kerstin Martin","https://kerstinmartin.com/blog?format=rss"],["GoLive HQ","https://golivehq.co/blog?format=rss"],["Beatriz Caraballo","https://www.beatrizcaraballo.com/blog?format=rss"],["Websites by Khara","https://www.websitesbykhara.com/blog?format=rss"],["Kristine Neil","https://www.kristineneil.com/blog?format=rss"],["Can Dohen","https://www.candohen.com/blog?format=rss"],["Floating Lotus Design","https://floatinglotusdesign.com/blog?format=rss"],["Christy Price","https://www.christyprice.com/blog?format=rss"],["SquareKicker","https://www.squarekicker.com/blog?format=rss"],["Ley Design Studio","https://leydesignstudio.com/blog?format=rss"],["DMarz Designs","https://dmarzdesigns.com/blog?format=rss"]];
const DAY = 86400000;
const MAX_AGE_DAYS = 60;
const INACTIVE_DAYS = 90;
const MAX_PER_BLOG = 3;
const MAX_VISIBLE = 9;

function xmlValue(block, tag) {
  const safeTag = tag.replace(/:/g, "\\:");
  const found = block.match(new RegExp("<" + safeTag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + safeTag + "\\s*>", "i"));
  return found ? found[1] : "";
}

function xmlDecode(value) {
  return String(value || "")
    .replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g, "$1")
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, value) => {
      const n = value[0].toLowerCase() === "x" ? parseInt(value.slice(1), 16) : parseInt(value, 10);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => ({
      amp:"&", lt:"<", gt:">", quot:'"', apos:"'", nbsp:" "
    }[entity.toLowerCase()] || ""))
    .replace(/<[^>]*>/g, "")
    .replace(/\\s+/g, " ")
    .trim();
}

function linkFrom(block, base) {
  let link = xmlDecode(xmlValue(block, "link"));
  if (!link) {
    const tags = block.match(/<link\\b[^>]*>/gi) || [];
    const preferred = tags.find(tag => /rel\\s*=\\s*["']alternate["']/i.test(tag)) || tags[0] || "";
    const href = preferred.match(/href\\s*=\\s*["']([^"']+)["']/i);
    if (href) link = xmlDecode(href[1]);
  }
  try {
    const u = new URL(link, base);
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password) return "";
    u.hash = "";
    return u.href;
  } catch (_) { return ""; }
}

function extractPosts(xml, feed, now) {
  const blocks = xml.match(/<item(?:\\s[^>]*)?>[\\s\\S]*?<\\/item\\s*>/gi) ||
                 xml.match(/<entry(?:\\s[^>]*)?>[\\s\\S]*?<\\/entry\\s*>/gi) || [];
  const posts = [];
  const seen = new Set();
  for (const block of blocks) {
    const title = xmlDecode(xmlValue(block, "title")).slice(0, 300);
    const dateText = xmlDecode(xmlValue(block, "pubDate") || xmlValue(block, "dc:date") ||
      xmlValue(block, "published") || xmlValue(block, "updated") || xmlValue(block, "date"));
    const date = Date.parse(dateText);
    const url = linkFrom(block, feed[1]);
    if (!title || !url || !Number.isFinite(date) || date > now + DAY) continue;
    const ageDays = (now - date) / DAY;
    if (ageDays < 0 || ageDays > MAX_AGE_DAYS || seen.has(url)) continue;
    seen.add(url);
    posts.push({ title, url, blog: feed[0], publishedAt: new Date(date).toISOString() });
  }
  posts.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  // With a strict 60-day article window, a blog inactive for 90 days is
  // necessarily excluded; reappearing is automatic when it publishes again.
  if (posts.length && (now - Date.parse(posts[0].publishedAt)) / DAY > INACTIVE_DAYS) return [];
  return posts.slice(0, MAX_PER_BLOG);
}

async function fetchFeed(feed, now) {
  try {
    const res = await fetch(feed[1], {
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(7500),
      cf: { cacheEverything: true, cacheTtl: 1800 }
    });
    if (!res.ok) return [];
    const xml = (await res.text()).slice(0, 1500000);
    return extractPosts(xml, feed, now);
  } catch (_) { return []; }
}

export async function onRequestGet(context) {
  const { request } = context;
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const key = new Request(new URL("/api/around-web", request.url).toString());
  if (cache) {
    try {
      const cached = await cache.match(key);
      if (cached) return cached;
    } catch (_) {}
  }
  const now = Date.now();
  const byFeed = await Promise.all(FEEDS.map(feed => fetchFeed(feed, now)));
  const unique = new Set();
  const posts = byFeed.flat().sort((a, b) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  ).filter(post => {
    if (unique.has(post.url)) return false;
    unique.add(post.url);
    return true;
  }).slice(0, MAX_VISIBLE);
  const body = JSON.stringify({
    posts,
    updatedAt: new Date(now).toISOString(),
    activeBlogs: byFeed.filter(p => p.length).length,
    totalBlogs: FEEDS.length
  });
  const response = new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff"
    }
  });
  if (cache) context.waitUntil(cache.put(key, response.clone()).catch(() => {}));
  return response;
}
