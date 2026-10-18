# sqspthemes-site

The SQSPThemes 2.0 layer for sqspthemes.com: the header, search, footer and
blog drawn on top of Squarespace 7.1. Squarespace still holds the content;
these files decide how it looks.

| File | What it is |
| --- | --- |
| `sqspthemes.css` | All styles, light and dark |
| `sqspthemes.js` | Header, search, footer, blog list, blog posts |
| `code-injection-header.html` | The one paste for Squarespace (settings + loader) |
| `snippets/post-snippets.html` | Optional blocks for posts: At a glance, plugin box |

## Install

1. Upload this folder to a public GitHub repo named `sqspthemes-site`.
2. On GitHub: **Releases → Draft a new release**, tag `1.0.0`, publish.
3. In `code-injection-header.html`, replace `GITHUB_USERNAME` with your
   GitHub username and paste your Kit form action URL.
4. Squarespace: **Website Tools → Code Injection → Header**, paste the whole file.
5. Remove the old blog code from Code Injection → Footer (keep the member-login code)
   and anything from the first attempt in Custom CSS.

jsDelivr serves the files from GitHub at
`https://cdn.jsdelivr.net/gh/GITHUB_USERNAME/sqspthemes-site@1.0.0/…`
and minifies them automatically (`.min.css` / `.min.js`).

## Releasing a change

1. Edit the files on GitHub and commit.
2. Publish a new release with the next tag (`1.0.1`, `1.1.0`…).
3. In Code Injection → Header, change `@1.0.0` to the new tag in both links.

Tagged versions never change on the CDN, so the site only updates when you
change the tag, and rolling back is changing it back.

## Settings

Everything editable lives in `window.SQT_CONFIG` in Code Injection: headline,
Kit form, topics, post types, footer links, which pages get dark mode.
The header nav comes from Squarespace's own main navigation. Add, rename or
reorder pages there and the header follows.

## Safety

- The layer stays off inside the Squarespace editor, so the native site stays editable.
- If the files take longer than 4 seconds or the script hits an error,
  the page falls back to the normal Squarespace site.
