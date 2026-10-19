# Native template screenshot recovery — October 18, 2026

The audit queue is the scope: 172 native Squarespace templates. The 404 third-party entries, catalog order, affiliate links, demo links, prices, categories, and matcher code are preserved.

## Verification process

1. Check each original demo URL using a real HTTP request, following redirects and recording the final URL, HTTP status, page title, Squarespace context, and error-page signals.
2. Validate the capture/storage/delivery process on the first ten audit entries before processing the remaining 162.
3. Capture actual rendered demos at 1440 × 1000, WebP quality 80. Wait for the page, fonts, visible images, and animation settling. The first pilot uses the REST screenshot endpoint; the next batches reuse browser tabs through an authenticated temporary Worker. After Cloudflare rate/service errors, the remaining pages are captured with local Chromium 153 and Playwright, then encoded with sharp at WebP quality 80 and uploaded to R2.
4. Store image bytes in private Cloudflare R2, then serve only dated native image keys through the read-only image Worker. URLs contain no expiring signature.
5. Download every image from its final public URL, decode it, verify dimensions, content type, cache headers and SHA-256, and inspect labeled contact sheets. Only visually approved images are added to the catalog.
6. Compare the completed catalog against its original revision to verify that every third-party entry and every non-image native field is unchanged.

## Resources

- R2 bucket: `sqspthemes-template-screenshots`
- Image delivery: `https://sqspthemes-template-images.omari-6b8.workers.dev/native/{slug}/2026-10-18.webp`
- Image Worker source: `../../scripts/template-images-worker.js`
- Capture Worker source: `../../scripts/capture-native-worker.js`
- `demo-verification.json`: original URL checks for all 172 entries.
- `delivery-verification.json`: final URL, decoded dimensions, byte size, SHA-256 and HTTP delivery checks.
- `visual-review.json`: explicit passed/retry lists.
- `capture-manifest.json`: final verified source, image URL, dimensions, size and SHA-256 for every native template.
- `r2-inventory.json`: R2 object inventory.

Screenshot verification is separate from affiliate attribution. Existing affiliate verification flags remain unchanged. A working demo establishes demo availability; it does not independently prove that a template is still listed in Squarespace’s current template gallery.

## Final result

172/172 screenshots passed delivery and visual checks; all 172 original demos returned working Squarespace pages. No unavailable original demos were found. The 172 optimized WebP files total 13,767,490 bytes (about 13.1 MiB). Every downloaded image also matches its R2 object ETag. See `discontinued-templates.json` for the separate availability report.
