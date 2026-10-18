# SQSPThemes Template Matchmaker v2

A vector-database-free template matcher designed for the Squarespace `/templates` page.

## Current status

The UI and first-pass deterministic matching implementation are committed. **Not yet live:** the existing `/templates-d` collection must be exported/reconciled and converted to a publicly accessible JSON feed. The 2024 template category/description sheets are candidate enrichment sources, not verified current listings.

## Embed in a Squarespace Code Block

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/omarih33/sqspthemes-site@main/template-matchmaker.css">
<div id="sqt-template-matchmaker" data-catalog-url="https://YOUR_PUBLIC_CATALOG_URL/templates.json"></div>
<script defer src="https://cdn.jsdelivr.net/gh/omarih33/sqspthemes-site@main/template-matchmaker.js"></script>
```

Do not paste this before the JSON catalog URL is live and tested. To enable an optional AI reranker, add `data-match-api="https://YOUR_WORKER/match"` to the div. The endpoint takes `{query,candidates}` and returns `{ids:["catalog-id-1","catalog-id-2"]}`.

## Catalog schema

The data source is a JSON array or `{"templates":[...]}`. Suggested normalized fields:

```json
{
  "templates": [
    {
      "id": "stable-id",
      "name": "Template name",
      "designer": "Designer",
      "description": "Short factual summary",
      "industry": ["Therapist"],
      "style": ["Minimal", "Warm"],
      "features": ["Booking"],
      "tags": ["Service business"],
      "price": 190,
      "image_url": "https://example.com/image.jpg",
      "demo_url": "https://example.com/demo",
      "product_url": "https://example.com/affiliate-checkout",
      "detail_url": "https://www.sqspthemes.com/templates-d/example",
      "status": "active"
    }
  ]
}
```

## Operating principle

Maintain one master Google Sheet. Export or sync its verified active rows to a static JSON endpoint (Cloudflare Pages/Workers or a public CDN). The Matchmaker reads the same feed as the browsing UI. New records need no vector embeddings, database reindexing, or AI-training procedure. Any AI credentials remain server-side in Cloudflare.

## Before production release

- Reconcile live Squarespace `/templates-d` entries and preserve detail links.
- Check current prices, demos, thumbnail URLs, duplicate IDs, status, and affiliate links.
- Validate AI-generated features; do not promise functionality that is not present.
- Add a Cloudflare-hosted AI reranker only if tests show meaningful matching improvement.
- Test on mobile and keyboard, verify Squarespace styles do not override the widget.
- Measure searches, clicks, and zero-match cases without collecting sensitive text unnecessarily.
