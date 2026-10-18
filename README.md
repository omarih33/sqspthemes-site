# SQSPThemes site layer

GitHub is the source of truth for the SQSPThemes presentation layer. Squarespace owns the content; this repo owns the shared presentation and custom experiences.

## Live deployment

Cloudflare Pages project: `sqspthemes-assets`

Production asset host:

- `https://sqspthemes-assets.pages.dev/sqspthemes.css`
- `https://sqspthemes-assets.pages.dev/sqspthemes.js`
- `https://sqspthemes-assets.pages.dev/directory-data.json`

Every commit to `main` automatically deploys to Cloudflare Pages. No release tags, SHA edits, jsDelivr purges, or manual asset version bumps.

## Files

| File | Purpose |
| --- | --- |
| `sqspthemes.css` | Site-wide SQSPThemes styling |
| `sqspthemes.js` | Header, footer, blog, directory, and site behavior |
| `directory-data.json` | Designer directory data |
| `code-injection-header.html` | One permanent Squarespace Header injection |
| `_headers` | Cache policy for live assets |
| `snippets/post-snippets.html` | Optional post blocks |
| `template-matchmaker.css` | Template Matchmaker styles |
| `template-matchmaker.js` | Template Matchmaker behavior |

## Squarespace

Paste `code-injection-header.html` into Website Tools → Code Injection → Header once. After that, normal design/code changes happen in GitHub only.

The layer stays off inside the Squarespace editor so native Squarespace content remains editable.
