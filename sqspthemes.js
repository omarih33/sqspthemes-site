/*!
 * SQSPThemes site layer
 * Draws the SQSPThemes 2.0 header, footer, search and blog on top of a
 * Squarespace 7.1 site. Content still comes from Squarespace.
 *
 * Settings live in Code Injection (window.SQT_CONFIG), not in this file.
 * If anything here fails, the page falls back to the normal Squarespace site.
 */
(function () {
  "use strict";

  var d = document;
  var html = d.documentElement;
  var C = window.SQT_CONFIG || {};
  if (/^\/find-templates\/?$/.test(location.pathname)) html.classList.add("sqt-matchmaker-page");
  if (/^\/plugin-directory\/?$/.test(location.pathname)) html.classList.add("sqt-plugin-directory-page");
  if (/^\/best-squarespace-designers\/?$/.test(location.pathname)) html.classList.add("sqt-directory-route");

  var DEFAULTS = {
    wordmark: "sqspthemes",
    tagline: "",
    headline: "What's New Across the Squarespace Ecosystem",
    subhead: "Practical solutions, useful tools, design ideas, and Squarespace news worth your attention.",
    author: "Omari Harebin",
    kitAction: "https://app.kit.com/forms/8682133/subscriptions",
    readers: "",
    searchUrl: "/search",
    tipUrl: "/contact",
    reportUrl: "/contact",
    topics: [],                 // Squarespace CATEGORIES
    types: ["How-to", "News", "Tools", "Opportunities"], // Squarespace TAGS
    opportunity: null,
    themePaths: ["/blog"],
    showLogin: true,
    nav: [],                    // only used if the Squarespace nav can't be read
    footer: [],
    footerNote: "Your guide through the Squarespace ecosystem.",
    owner: ""
  };
  Object.keys(DEFAULTS).forEach(function (k) {
    if (C[k] == null) C[k] = DEFAULTS[k];
  });

  // Keep all SQSPThemes-rendered newsletter forms on the current Kit form.
  if (!C.kitAction || /PASTE_KIT_FORM_ACTION_URL|PASTE_/i.test(C.kitAction)) {
    C.kitAction = "https://app.kit.com/forms/8682133/subscriptions";
  }

  /* ============================== utilities ============================== */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function fmtDate(t) {
    if (!t) return "";
    var dt = t instanceof Date ? t : new Date(t);
    return isNaN(dt) ? "" : MONTHS[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear();
  }
  function parseListDate(s) {
    var m = String(s || "").match(/(\d+)\/(\d+)\/(\d+)/);
    if (!m) return null;
    var y = +m[3];
    if (y < 100) y += 2000;
    return new Date(y, +m[1] - 1, +m[2]);
  }
  function text(node) {
    return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function stripHtml(s) {
    var t = d.createElement("div");
    t.innerHTML = s || "";
    return text(t);
  }
  function path() {
    return location.pathname.replace(/\/+$/, "") || "/";
  }
  function blogBase() {
    var p = location.pathname.split("/").filter(Boolean);
    return "/" + (p[0] || "blog");
  }
  function getJSON(url, signal) {
    return fetch(url + (url.indexOf("?") > -1 ? "&" : "?") + "format=json",
      { credentials: "same-origin", signal: signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function match(list, values) {
    values = values || [];
    for (var i = 0; i < values.length; i++) {
      for (var j = 0; j < list.length; j++) {
        if (String(values[i]).toLowerCase() === String(list[j]).toLowerCase()) return list[j];
      }
    }
    return "";
  }
  function topicOf(categories) {
    // only your configured topics count; old categories from past years are ignored
    if (C.topics.length) return match(C.topics, categories);
    return (categories && categories[0]) || "";
  }
  function typeOf(tags) {
    return match(C.types, tags);
  }
  function make(markup) {
    var t = d.createElement("template");
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }
  function onPath(list) {
    var p = path();
    return (list || []).some(function (x) {
      x = x.replace(/\/+$/, "") || "/";
      return x === "/" ? p === "/" : (p === x || p.indexOf(x + "/") === 0);
    });
  }

  function isInternalUrl(url) {
    if (!url || url.charAt(0) === "#") return true;
    try {
      return new URL(url, location.origin).origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  function normalizeInternalLinks(root) {
    (root || d).querySelectorAll('a[target="_blank"]').forEach(function (a) {
      if (isInternalUrl(a.getAttribute("href"))) {
        a.removeAttribute("target");
        a.removeAttribute("rel");
      }
    });
  }

  function enforceInternalSameTab() {
    d.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || !isInternalUrl(a.getAttribute("href"))) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
      a.removeAttribute("target");
      a.removeAttribute("rel");
    }, true);
  }

  function styleNativePage() {
    var page = d.getElementById("page");
    if (!page) return;
    page.classList.add("sqt-native-page");
    page.querySelectorAll("section.page-section").forEach(function (sec) {
      if (sec.matches('[data-sqsp-section="blog-list"]') || sec.querySelector(".blog-item-wrapper")) return;
      var hasMedia = !!sec.querySelector(".section-background img, .section-background video, .background-video, video");
      if (!hasMedia) sec.classList.add("sqt-native-plain");
    });
  }

  function readBlogIntro(sec) {
    var source = sec && sec.previousElementSibling;
    if (!source || !source.matches("section.page-section")) {
      return { headline: C.headline, subhead: C.subhead };
    }
    var heading = source.querySelector(".sqs-html-content h1, .sqs-html-content h2, .sqs-html-content h3, h1, h2, h3");
    var paras = [].slice.call(source.querySelectorAll(".sqs-html-content p, p")).filter(function (p) {
      return text(p);
    });
    var headline = text(heading) || C.headline;
    var subhead = paras.length ? text(paras[0]) : C.subhead;
    if (/^what.?s worth knowing in the squarespace world\.?$/i.test(headline)) {
      headline = "What's New Across the Squarespace Ecosystem";
    }
    if (/^news, opportunities, tools, and ideas for people building businesses around squarespace\.?$/i.test(subhead)) {
      subhead = "Practical solutions, useful tools, design ideas, and Squarespace news worth your attention.";
    }
    return { headline: headline, subhead: subhead };
  }

  /* ============================ appearance system ============================ */

  var themeOK = C.themePaths.indexOf("*") > -1 || onPath(C.themePaths);
  var PREF_KEY = "sqt-preferences";
  var DEFAULT_PREFS = {
    vibe: "2010",
    mode: "auto",
    background: "default",
    customBackground: "#f6f4ef",
    accent: "default",
    customAccent: "#e24a2a",
    textSize: "default",
    density: "comfortable"
  };

  function clonePrefs(src) {
    var out = {};
    Object.keys(DEFAULT_PREFS).forEach(function (k) { out[k] = src && src[k] ? src[k] : DEFAULT_PREFS[k]; });
    return out;
  }

  function loadPrefs() {
    var prefs = clonePrefs(DEFAULT_PREFS);
    try {
      var raw = localStorage.getItem(PREF_KEY);
      if (raw) return clonePrefs(JSON.parse(raw));
      var legacyTheme = localStorage.getItem("sqt-theme") || "";
      var legacyStyle = localStorage.getItem("sqt-style") || "";
      if (legacyTheme === "light" || legacyTheme === "dark") prefs.mode = legacyTheme;
      if (legacyStyle === "editorial" || legacyStyle === "2010") prefs.vibe = legacyStyle;
    } catch (e) {}
    return prefs;
  }

  var appearancePrefs = loadPrefs();

  function savePrefs() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(appearancePrefs));
      localStorage.removeItem("sqt-theme");
      localStorage.removeItem("sqt-style");
    } catch (e) {}
  }

  function resolvedTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function theme() {
    return html.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function styleMode() {
    return html.getAttribute("data-sqt-style") === "editorial" ? "editorial" : "2010";
  }

  function normalizeHex(value) {
    value = String(value || "").trim();
    if (/^#[0-9a-f]{3}$/i.test(value)) {
      return "#" + value.slice(1).split("").map(function (c) { return c + c; }).join("").toLowerCase();
    }
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "";
  }

  function contrastInk(hex) {
    hex = normalizeHex(hex);
    if (!hex) return "#111111";
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function linear(c) {
      c /= 255;
      return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
    }
    var lum = .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
    return lum > .48 ? "#111111" : "#f7f5ef";
  }

  function applyCustomColors() {
    var bg = normalizeHex(appearancePrefs.customBackground);
    var accent = normalizeHex(appearancePrefs.customAccent);
    if (appearancePrefs.background === "custom" && bg) {
      html.style.setProperty("--sqt-custom-bg", bg);
      html.style.setProperty("--sqt-custom-ink", contrastInk(bg));
    } else {
      html.style.removeProperty("--sqt-custom-bg");
      html.style.removeProperty("--sqt-custom-ink");
    }
    if (appearancePrefs.accent === "custom" && accent) {
      html.style.setProperty("--sqt-custom-accent", accent);
      html.style.setProperty("--sqt-custom-accent-ink", contrastInk(accent));
    } else {
      html.style.removeProperty("--sqt-custom-accent");
      html.style.removeProperty("--sqt-custom-accent-ink");
    }
  }

  function setCustomColor(kind, value) {
    var hex = normalizeHex(value);
    if (!hex) return false;
    if (kind === "background") {
      appearancePrefs.customBackground = hex;
      appearancePrefs.background = "custom";
    } else if (kind === "accent") {
      appearancePrefs.customAccent = hex;
      appearancePrefs.accent = "custom";
    } else {
      return false;
    }
    applyPrefs(true);
    return true;
  }

  function syncCustomizerUI() {
    var root = d.getElementById("sqt-customizer");
    if (!root) return;
    root.querySelectorAll("[data-pref][data-value]").forEach(function (b) {
      var key = b.getAttribute("data-pref");
      var value = b.getAttribute("data-value");
      b.classList.toggle("is-active", appearancePrefs[key] === value);
      b.setAttribute("aria-pressed", appearancePrefs[key] === value ? "true" : "false");
    });
    root.querySelectorAll("[data-custom-color]").forEach(function (input) {
      var kind = input.getAttribute("data-custom-color");
      var value = kind === "background" ? appearancePrefs.customBackground : appearancePrefs.customAccent;
      if (input.type === "color" && normalizeHex(value)) input.value = normalizeHex(value);
      if (input.classList.contains("sqt-hex-input")) input.value = String(value || "").toUpperCase();
    });
    var status = root.querySelector(".sqt-save-status");
    if (status) status.textContent = "Saved automatically";
  }

  function applyPrefs(save) {
    html.setAttribute("data-sqt-style", appearancePrefs.vibe === "editorial" ? "editorial" : "2010");
    html.setAttribute("data-sqt-mode", appearancePrefs.mode || "auto");
    html.setAttribute("data-theme", resolvedTheme(appearancePrefs.mode));
    html.setAttribute("data-sqt-bg", appearancePrefs.background || "default");
    html.setAttribute("data-sqt-accent", appearancePrefs.accent || "default");
    html.setAttribute("data-sqt-text-size", appearancePrefs.textSize || "default");
    html.setAttribute("data-sqt-density", appearancePrefs.density || "comfortable");
    applyCustomColors();
    if (save) savePrefs();
    syncCustomizerUI();
  }

  function setPreference(key, value) {
    if (!(key in DEFAULT_PREFS)) return;
    appearancePrefs[key] = value || DEFAULT_PREFS[key];
    applyPrefs(true);
  }

  function resetPreferences() {
    appearancePrefs = clonePrefs(DEFAULT_PREFS);
    applyPrefs(true);
  }

  function makeCustomizer() {
    if (d.getElementById("sqt-customizer")) return d.getElementById("sqt-customizer");
    var panel = make(
      '<aside id="sqt-customizer" hidden aria-label="Customize SQSPThemes">' +
        '<div class="sqt-customizer__head">' +
          '<h2 class="sqt-customizer__title">Make it your own.</h2>' +
          '<p class="sqt-customizer__dek">Customize how SQSPThemes looks and feels. We\'ll remember your setup.</p>' +
          '<button class="sqt-customizer__close" type="button" aria-label="Close customizer">×</button>' +
        '</div>' +
        prefGroup("Vibe", "vibe", [
          ["2010", "Classic Directory"],
          ["editorial", "Modern Editorial"]
        ]) +
        prefGroup("Mode", "mode", [
          ["light", "Day"],
          ["dark", "Night"],
          ["auto", "Auto"]
        ], true) +
        colorGroup("Background", "background", [
          ["default", "Default", "linear-gradient(135deg,#fff 50%,#111 50%)"],
          ["white", "White", "#ffffff"],
          ["paper", "Paper", "#f6f4ef"],
          ["cool", "Cool", "#eaf0f4"],
          ["sage", "Sage", "#e7ede4"]
        ], appearancePrefs.customBackground) +
        colorGroup("Accent", "accent", [
          ["default", "Default", "linear-gradient(135deg,#0645ad 50%,#e24a2a 50%)"],
          ["blue", "Blue", "#1769e0"],
          ["orange", "Orange", "#e24a2a"],
          ["green", "Green", "#17734b"],
          ["purple", "Purple", "#6b4ba1"]
        ], appearancePrefs.customAccent) +
        prefGroup("Text size", "textSize", [
          ["default", "Default"],
          ["large", "Large"]
        ]) +
        prefGroup("Density", "density", [
          ["compact", "Compact"],
          ["comfortable", "Comfortable"]
        ]) +
        '<div class="sqt-customizer__foot">' +
          '<button class="sqt-reset" type="button">Reset to default</button>' +
          '<span class="sqt-save-status" aria-live="polite">Saved automatically</span>' +
        '</div>' +
      '</aside>'
    );
    d.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      var pref = e.target.closest("[data-pref][data-value]");
      if (pref) {
        setPreference(pref.getAttribute("data-pref"), pref.getAttribute("data-value"));
        return;
      }
      if (e.target.closest(".sqt-customizer__close")) closeCustomizer();
      if (e.target.closest(".sqt-reset")) resetPreferences();
    });
    panel.addEventListener("input", function (e) {
      if (e.target.matches('input[type="color"][data-custom-color]')) {
        setCustomColor(e.target.getAttribute("data-custom-color"), e.target.value);
      } else if (e.target.matches(".sqt-hex-input[data-custom-color]")) {
        var hex = normalizeHex(e.target.value);
        if (hex) setCustomColor(e.target.getAttribute("data-custom-color"), hex);
      }
    });
    panel.addEventListener("change", function (e) {
      if (e.target.matches(".sqt-hex-input[data-custom-color]")) {
        var kind = e.target.getAttribute("data-custom-color");
        var current = kind === "background" ? appearancePrefs.customBackground : appearancePrefs.customAccent;
        if (!setCustomColor(kind, e.target.value)) e.target.value = String(current || "").toUpperCase();
      }
    });
    syncCustomizerUI();
    return panel;
  }

  function prefGroup(label, key, values, three) {
    return '<fieldset class="sqt-pref-group">' +
      '<legend>' + esc(label) + '</legend>' +
      '<div class="sqt-pref-options' + (three ? ' sqt-pref-options--three' : '') + '">' +
        values.map(function (v) {
          return '<button class="sqt-pref-choice" type="button" data-pref="' + esc(key) + '" data-value="' + esc(v[0]) + '" aria-pressed="false">' + esc(v[1]) + '</button>';
        }).join("") +
      '</div>' +
    '</fieldset>';
  }

  function colorGroup(label, key, values, customValue) {
    return '<fieldset class="sqt-pref-group">' +
      '<legend>' + esc(label) + '</legend>' +
      '<div class="sqt-swatches">' +
        values.map(function (v) {
          return '<button class="sqt-pref-choice sqt-swatch" type="button" data-pref="' + esc(key) + '" data-value="' + esc(v[0]) + '" aria-pressed="false" aria-label="' + esc(v[1]) + '" title="' + esc(v[1]) + '" style="--sqt-swatch:' + esc(v[2]) + '"></button>';
        }).join("") +
        '<button class="sqt-pref-choice sqt-swatch sqt-swatch--custom" type="button" data-pref="' + esc(key) + '" data-value="custom" aria-pressed="false" aria-label="Custom ' + esc(label.toLowerCase()) + '" title="Custom ' + esc(label.toLowerCase()) + '" style="--sqt-swatch:' + esc(customValue || "#888888") + '"><span>+</span></button>' +
      '</div>' +
      '<div class="sqt-custom-color-row">' +
        '<label class="sqt-color-wheel"><span>Pick</span><input type="color" data-custom-color="' + esc(key) + '" value="' + esc(normalizeHex(customValue) || "#888888") + '"></label>' +
        '<label class="sqt-hex"><span>Hex</span><input class="sqt-hex-input" type="text" inputmode="text" maxlength="7" spellcheck="false" data-custom-color="' + esc(key) + '" value="' + esc(String(customValue || "").toUpperCase()) + '" placeholder="#0645AD"></label>' +
      '</div>' +
    '</fieldset>';
  }

  function openCustomizer() {
    var panel = makeCustomizer();
    panel.hidden = false;
    d.querySelectorAll(".sqt-customize").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    var close = panel.querySelector(".sqt-customizer__close");
    if (close) close.focus();
  }

  function closeCustomizer() {
    var panel = d.getElementById("sqt-customizer");
    if (!panel) return;
    panel.hidden = true;
    d.querySelectorAll(".sqt-customize").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }

  function toggleCustomizer() {
    var panel = makeCustomizer();
    if (panel.hidden) openCustomizer(); else closeCustomizer();
  }

  applyPrefs(false);

  if (window.matchMedia) {
    var scheme = matchMedia("(prefers-color-scheme: dark)");
    var schemeHandler = function () {
      if (appearancePrefs.mode === "auto") applyPrefs(false);
    };
    if (scheme.addEventListener) scheme.addEventListener("change", schemeHandler);
    else if (scheme.addListener) scheme.addListener(schemeHandler);
  }

  /* ========================== subscribe (Kit) ============================ */

  function subscribeForm(label) {
    var id = "sqt-em-" + Math.random().toString(36).slice(2, 7);
    return '<form class="sqt-subscribe" action="' + esc(C.kitAction) + '" method="post">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<div class="sqt-subscribe-row">' +
        '<input class="sqt-input" id="' + id + '" type="email" name="email_address" required autocomplete="email" placeholder="you@studio.com">' +
        '<button class="sqt-btn sqt-btn--ghost" type="submit">Subscribe</button>' +
      '</div>' +
      (C.readers ? '<span class="sqt-count">' + esc(C.readers) + '</span>' : '') +
      '<p class="sqt-subscribe-status" role="status" aria-live="polite"></p>' +
    '</form>';
  }

  // Submit in place; if Kit or the browser refuses, fall back to a normal submit.
  function wireSubscribe(root) {
    root.querySelectorAll(".sqt-subscribe").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        if (!form.action || /PASTE_|^\s*$/.test(form.getAttribute("action"))) return;
        e.preventDefault();
        var status = form.querySelector(".sqt-subscribe-status");
        var btn = form.querySelector("button");
        btn.disabled = true;
        status.textContent = "Subscribing…";
        fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.classList.add("is-done");
          status.textContent = "Check your inbox to confirm your subscription.";
        }).catch(function () {
          form.submit();
        });
      });
    });
  }

  /* ================================ search =============================== */

  var SECTION_LABELS = {
    "blog": "Article",
    "squarespace-template-reviews": "Template",
    "templates": "Template",
    "partner": "Partner",
    "best-squarespace-designers": "Designer"
  };

  function searchMarkup() {
    return '<div class="sqt-searchbar">' +
      '<form class="sqt-search" role="search" action="' + esc(C.searchUrl) + '" method="get">' +
        '<label class="sqt-sr" for="sqt-q">Search SQSPThemes</label>' +
        '<div class="sqt-search-field">' +
          '<input class="sqt-input" id="sqt-q" type="search" name="q" autocomplete="off" spellcheck="false" ' +
            'placeholder="What are you trying to do in Squarespace?">' +
          '<kbd class="sqt-kbd" id="sqt-q-hint" title="Press / to search">/</kbd>' +
        '</div>' +
        '<button class="sqt-btn" type="submit">Search</button>' +
      '</form>' +
    '</div>';
  }

  function wireSearch(root) {
    var form = root.querySelector(".sqt-search");
    var input = root.querySelector("#sqt-q");
    if (!form || !input) return;

    function openMonocle(q, attempt) {
      if (window.Monocle && typeof window.Monocle.showSearchWithQuery === "function") {
        window.Monocle.showSearchWithQuery(q);
        return;
      }

      // Monocle loads async from Code Injection. Give it a brief moment on
      // very fast submits, then fall back to the normal search URL.
      if ((attempt || 0) < 12) {
        setTimeout(function () { openMonocle(q, (attempt || 0) + 1); }, 100);
        return;
      }

      location.href = C.searchUrl + "?q=" + encodeURIComponent(q);
    }

    form.addEventListener("submit", function (e) {
      var q = input.value.trim();
      if (!q) {
        e.preventDefault();
        input.focus();
        return;
      }
      e.preventDefault();
      openMonocle(q, 0);
    });

    d.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      input.focus();
      input.select();
    });

    if (window.innerWidth < 640) {
      input.placeholder = "Search SQSPThemes…";
    }
  }

  /* ================================ header =============================== */

  function readNav(native) {
    if (!native) return [];
    var listEl = native.querySelector(".header-display-desktop .header-nav-list") ||
                 native.querySelector(".header-nav-list");
    if (!listEl) return [];
    return [].slice.call(listEl.children).map(function (item) {
      if (item.classList.contains("header-nav-item--folder")) {
        var title = item.querySelector(".header-nav-folder-title");
        var kids = [].slice.call(item.querySelectorAll(".header-nav-folder-content a")).map(function (a) {
          return { label: text(a), url: a.getAttribute("href"), target: a.getAttribute("target") };
        });
        return { label: text(title), children: kids };
      }
      var a = item.querySelector("a");
      return a ? { label: text(a), url: a.getAttribute("href"), target: a.getAttribute("target") } : null;
    }).filter(function (x) { return x && x.label; });
  }

  function navLink(n) {
    var current = n.url && n.url.charAt(0) === "/" && onPath([n.url.split("?")[0]]);
    var target = n.target && !isInternalUrl(n.url) ? ' target="' + esc(n.target) + '" rel="noopener"' : "";
    return '<a href="' + esc(n.url) + '"' + target +
      (current ? ' aria-current="page"' : "") + '>' + esc(n.label) + '</a>';
  }

  // A single wordmark renderer keeps the header and footer visually identical.
  function wordmarkMarkup(extraClass) {
    return '<a class="sqt-wordmark' + (extraClass ? ' ' + esc(extraClass) : '') + '" href="/" aria-label="SQSPThemes">' +
      '<span class="sqt-wordmark__sqsp">sqsp</span><span class="sqt-wordmark__themes">themes</span></a>';
  }

  function header() {
    if (d.getElementById("sqt-header")) return;
    var native = d.getElementById("header");
    var nav = readNav(native);
    if (!nav.length) nav = C.nav;
    // The native Squarespace navigation is authoritative: do not rename, insert or reorder CMS links.
    // This also preserves folder membership and positioning set in the Squarespace editor.
    var items = nav.map(function (n) {
      if (n.children && n.children.length) {
        return '<details class="sqt-folder"><summary>' + esc(n.label) + '</summary><ul>' +
          n.children.map(function (c) { return '<li>' + navLink(c) + '</li>'; }).join("") +
          '</ul></details>';
      }
      return navLink(n);
    });

    // Squarespace member link: clicking ours clicks the hidden original, so its pop-up still opens
    var acct = native && native.querySelector(".user-accounts-text-link");
    if (C.showLogin && acct) {
      var label = "Login";
      acct.querySelectorAll("span").forEach(function (s) {
        if (getComputedStyle(s).display !== "none" && text(s)) label = text(s);
      });
      items.push('<a href="#" class="sqt-login">' + esc(label) + '</a>');
    }

    var hd = make(
      '<header id="sqt-header" class="sqt">' +
        '<a class="sqt-skip" href="#sqt-content">Skip to content</a>' +
        '<div class="sqt-hd">' +
          '<div class="sqt-brand">' +
            wordmarkMarkup() +
            '<span class="sqt-tagline">' + esc(C.tagline) + '</span>' +
          '</div>' +
          '<div class="sqt-hd-tools">' +
            '<div id="sqt-modes" class="sqt-modes" role="group" aria-label="Display preferences">' +
              '<button class="sqt-tool sqt-customize" type="button" aria-expanded="false" aria-controls="sqt-customizer">Make it your own</button>' +
            '</div>' +
            '<button class="sqt-tool sqt-menu" type="button" aria-expanded="false" aria-controls="sqt-nav">Menu</button>' +
          '</div>' +
          '<nav class="sqt-nav" id="sqt-nav" aria-label="Main">' +
            items.join('<span class="sqt-pipe" aria-hidden="true">|</span>') +
          '</nav>' +
        '</div>' +
        searchMarkup() +
      '</header>'
    );

    var login = hd.querySelector(".sqt-login");
    if (login) login.addEventListener("click", function (e) { e.preventDefault(); acct.click(); });

    var menu = hd.querySelector(".sqt-menu");
    menu.addEventListener("click", function () {
      var openNow = hd.classList.toggle("is-menu-open");
      menu.setAttribute("aria-expanded", openNow ? "true" : "false");
      menu.textContent = openNow ? "Close" : "Menu";
    });

    var cbtn = hd.querySelector(".sqt-customize");
    if (cbtn) cbtn.addEventListener("click", toggleCustomizer);

    wireSearch(hd);

    if (native) native.parentNode.insertBefore(hd, native);
    else d.body.insertBefore(hd, d.body.firstChild);

    // Move the actual buttons outside the sticky header on mobile, so their
    // fixed position is relative to the viewport rather than backdrop-filter.
    var modes = hd.querySelector(".sqt-modes");
    var tools = hd.querySelector(".sqt-hd-tools");
    function placeModes() {
      if (window.matchMedia("(max-width: 760px)").matches) {
        if (modes.parentNode !== d.body) d.body.appendChild(modes);
      } else if (modes.parentNode !== tools) {
        tools.insertBefore(modes, menu);
      }
    }
    placeModes();
    window.addEventListener("resize", placeModes, { passive: true });

    applyPrefs(false);
  }


  /* ============================ sitewide footer ========================== */
  /* All published footer links and markup live here, not in a Code Block.
     Squarespace's native footer remains available if this site layer fails. */

  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCustomizer();
  });

  d.addEventListener("click", function (e) {
    var panel = d.getElementById("sqt-customizer");
    if (!panel || panel.hidden) return;
    if (panel.contains(e.target) || e.target.closest(".sqt-customize")) return;
    closeCustomizer();
  });

  function footer() {
    if (d.getElementById("sqt-footer")) return;
    var native = d.getElementById("footer-sections") || d.querySelector("footer.sections");
    var f = make(
      '<footer id="sqt-footer" class="sqt sqsp-footer" aria-label="SQSPThemes footer">' +
        '<div class="sqsp-footer__inner">' +
          '<div class="sqsp-footer__main">' +
            '<section class="sqsp-footer__brand">' +
              wordmarkMarkup("sqsp-footer__wordmark") +
              '<p class="sqsp-footer__tagline">Your guide through the Squarespace ecosystem.</p>' +
              '<p class="sqsp-footer__note">Tools, templates and opportunities for people building with Squarespace.</p>' +
              '<div class="sqsp-footer__signup">' +
                '<p class="sqsp-footer__signup-heading">Get the good stuff by email</p>' +
                subscribeForm("Email address") +
              '</div>' +
            '</section>' +
            '<nav class="sqsp-footer__nav" aria-label="Footer navigation">' +
              '<div class="sqsp-footer__column">' +
                '<h2>Explore</h2><ul>' +
                  '<li><a href="/templates">Browse Templates</a></li>' +
                  '<li><a href="/find-templates">Find Templates</a></li>' +
                  '<li><a href="/best-squarespace-designers">Designer Directory</a></li>' +
                  '<li><a href="/plugin-directory">Plugins &amp; Solutions</a></li>' +
                  '<li><a href="/squarespace-resources">Resources</a></li>' +
                '</ul>' +
              '</div>' +
              '<div class="sqsp-footer__column">' +
                '<h2>SQSPThemes</h2><ul>' +
                  '<li><a href="/blog">Blog</a></li>' +
                  '<li><a href="/newsletter">Newsletter</a></li>' +
                  '<li><a href="/our-story">Our Story</a></li>' +
                  '<li><a href="/contact">Contact</a></li>' +
                  '<li><a href="/privacy-policy">Privacy</a></li>' +
                '</ul>' +
              '</div>' +
            '</nav>' +
          '</div>' +
          '<div class="sqsp-footer__bottom">' +
            '<p class="sqsp-footer__asset">© ' + new Date().getFullYear() + ' SQSPThemes. Not affiliated with or endorsed by Squarespace.</p>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
    if (native && native.parentNode) native.parentNode.insertBefore(f, native.nextSibling);
    else d.body.appendChild(f);
    wireSubscribe(f);
  }


  /* =============================== homepage ============================== */

  function siteAssetUrl(name) {
    var script = [].slice.call(d.scripts).find(function (s) {
      return /\/sqspthemes\.js(?:\?|$)/.test(s.src || "");
    });
    if (script && script.src) return script.src.replace(/[^/?]+(?:\?.*)?$/, name);
    return "https://sqspthemes-assets.pages.dev/" + name;
  }

  function fetchAssetJSON(name) {
    return fetch(siteAssetUrl(name), { credentials: "omit" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function homeTrim(s, max) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    if (!s || s.length <= max) return s;
    return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function homeItemImage(it) {
    var direct = it && (
      it.assetUrl ||
      it.featuredImageUrl ||
      it.imageUrl ||
      (it.image && (it.image.assetUrl || it.image.url)) ||
      (it.thumbnail && (it.thumbnail.assetUrl || it.thumbnail.url))
    );
    if (direct) return direct;

    if (it && it.body) {
      var box = d.createElement("div");
      box.innerHTML = it.body;
      var img = box.querySelector("img");
      if (img) return img.getAttribute("data-src") || img.getAttribute("src") || "";
    }
    return "";
  }

  function homePost(it) {
    it = it || {};
    var tags = it.tags || [];
    return {
      title: stripHtml(it.title || "Untitled"),
      url: it.fullUrl || it.url || "#",
      excerpt: homeTrim(stripHtml(it.excerpt || it.body || ""), 190),
      date: it.publishOn ? new Date(it.publishOn) : null,
      topic: topicOf(it.categories || []),
      type: typeOf(tags),
      image: homeItemImage(it),
      featured: tags.some ? tags.some(function (t) { return String(t).toLowerCase() === "featured"; }) : false
    };
  }

  function homePostMeta(p) {
    var bits = [];
    if (p.topic) bits.push(p.topic);
    else if (p.type) bits.push(p.type);
    if (p.date) bits.push(fmtDate(p.date));
    return bits;
  }

  function homeFeatureMarkup(p) {
    if (!p) {
      return '<div class="sqt-home-empty">Latest Squarespace stories will appear here automatically from the Blog collection.</div>';
    }
    var meta = homePostMeta(p);
    return '<article class="sqt-home-feature-card' + (p.image ? ' has-image' : '') + '">' +
      (p.image ? '<a class="sqt-home-feature-media" href="' + esc(p.url) + '"><img src="' + esc(p.image) + '" alt="" loading="eager"></a>' : '') +
      '<div class="sqt-home-feature-copy">' +
        '<a class="sqt-home-feature-title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
        (p.excerpt ? '<p>' + esc(p.excerpt) + '</p>' : '') +
        '<a class="sqt-home-read" href="' + esc(p.url) + '">Read the full post →</a>' +
        (meta.length ? '<div class="sqt-home-meta sqt-meta-row">' + meta.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' : '') +
      '</div>' +
    '</article>';
  }

  function homeLatestMarkup(posts) {
    if (!posts.length) {
      return '<div class="sqt-home-empty">The latest articles will appear here automatically.</div>';
    }
    return posts.map(function (p) {
      var meta = homePostMeta(p);
      return '<article class="sqt-home-latest-row sqt-list-row' + (p.image ? ' has-image' : '') + '">' +
        (p.image ? '<a class="sqt-home-latest-media sqt-list-row__media" href="' + esc(p.url) + '"><img src="' + esc(p.image) + '" alt="" loading="lazy"></a>' : '') +
        '<div class="sqt-home-latest-copy sqt-list-row__body">' +
          '<a class="sqt-home-latest-title sqt-list-row__title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
          (p.excerpt ? '<p>' + esc(homeTrim(p.excerpt, 145)) + '</p>' : '') +
          (meta.length ? '<div class="sqt-home-meta sqt-meta-row">' + meta.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' : '') +
        '</div>' +
      '</article>';
    }).join("");
  }

  function homeTopicsMarkup() {
    var topics = C.topics && C.topics.length ? C.topics : [
      "Squarespace News", "Templates", "Customization", "Plugins & Integrations", "SEO", "Business & Marketing"
    ];
    return '<ol class="sqt-home-topic-list">' + topics.slice(0, 10).map(function (t, i) {
      return '<li><span>' + String(i + 1).padStart(2, "0") + '</span><a href="/blog?category=' + encodeURIComponent(t) + '">' + esc(t) + '</a></li>';
    }).join("") + '</ol>';
  }

  function homeExploreMarkup(templateCount, designerCount) {
    var items = [
      ["Templates", "/templates", templateCount ? templateCount + " Squarespace templates to browse." : "Standout Squarespace templates for every kind of project."],
      ["Designers", "/best-squarespace-designers", "Explore directory listings from independent designers and studios."],
      ["Plugins & Solutions", "/plugin-directory", "Tools and solutions that extend what Squarespace can do."],
      ["Resources", "/squarespace-resources", "Guides, tools, and freebies to help you do more with Squarespace."],
      ["Opportunities", (C.opportunity && C.opportunity.url) || "/rfps", "Bigger-budget website projects, RFPs, and opportunities."]
    ];
    return items.map(function (x) {
      return '<article class="sqt-home-explore-card">' +
        '<a class="sqt-home-explore-title" href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>' +
        '<p>' + esc(x[2]) + '</p>' +
        '<a class="sqt-home-explore-link" href="' + esc(x[1]) + '">Explore ' + esc(x[0].toLowerCase()) + ' →</a>' +
      '</article>';
    }).join("");
  }


  // A shuffled bag makes each spotlight different on consecutive homepage loads
  // and shows every eligible entry once before starting another cycle.
  function homeRotationPick(items, group, getKey) {
    if (!items.length) return null;
    if (items.length === 1) return items[0];

    var keys = items.map(getKey);
    var storageKey = "sqt-home-rotation-v1-" + group;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (e) {}
    var remaining = Array.isArray(saved.remaining) ? saved.remaining.filter(function (key, i, all) {
      return keys.indexOf(key) !== -1 && all.indexOf(key) === i;
    }) : [];

    if (!remaining.length || (remaining.length === 1 && remaining[0] === saved.last)) {
      remaining = keys.slice();
      for (var i = remaining.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = remaining[i];
        remaining[i] = remaining[j];
        remaining[j] = swap;
      }
    }

    // Avoid the last selection even at the boundary between two shuffled bags.
    if (remaining[0] === saved.last) {
      var alternative = remaining.findIndex(function (key) { return key !== saved.last; });
      if (alternative > 0) {
        var next = remaining[0];
        remaining[0] = remaining[alternative];
        remaining[alternative] = next;
      }
    }

    var chosen = remaining.shift();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ last: chosen, remaining: remaining }));
    } catch (e) {}
    return items[keys.indexOf(chosen)] || items[0];
  }

  function homeFeaturedResources() {
    // Edit this list to change the rotation; keep affiliate tracking intact.
    // window.SQT_CONFIG.homeFeaturedResources can optionally override the list.
    var defaults = [
      {
        id: "bigger-budget-projects",
        name: (C.opportunity && C.opportunity.name) || "Bigger Budget Projects",
        url: (C.opportunity && C.opportunity.url) || "/rfps",
        text: (C.opportunity && C.opportunity.text) || "Website RFPs and opportunities for independent designers and studios.",
        cta: "Explore opportunities →"
      },
      {
        id: "lightbox-anything",
        name: "Lightbox Anything",
        url: "https://www.creem.io/affiliate?code=AFFFM2BA5FQ6&p=lightbox",
        text: "Add popups and lightboxes for forms, videos, and other content on your Squarespace site.",
        cta: "Explore the plugin →",
        affiliate: true
      },
      {
        id: "squarekicker",
        name: "SquareKicker",
        url: "https://squarekicker.com/?ref=omariharebin16k",
        text: "A visual toolkit for customizing Squarespace designs without writing every line of code.",
        cta: "Explore SquareKicker →",
        affiliate: true
      },
      {
        id: "spark-plugin",
        name: "Spark Plugin",
        url: "https://sparkplugin.com/?via=omari",
        text: "More design and styling options for Squarespace websites.",
        cta: "Explore Spark →",
        affiliate: true
      }
    ];
    var resources = Array.isArray(C.homeFeaturedResources) ? C.homeFeaturedResources : defaults;
    return resources.filter(function (item) {
      return item && item.name && item.url &&
        (/^https?:\/\//i.test(item.url) || (/^\//.test(item.url) && !/^\/\//.test(item.url)));
    });
  }

  function homeResourceMarkup(resource) {
    if (!resource) return '<a href="/squarespace-resources">Browse Squarespace resources →</a>';
    var outside = !isInternalUrl(resource.url);
    var linkAttrs = outside ? ' target="_blank" rel="' + (resource.affiliate ? 'sponsored ' : '') + 'noopener noreferrer"' : '';
    return '<a class="sqt-home-side-title" href="' + esc(resource.url) + '"' + linkAttrs + '>' + esc(resource.name) + '</a>' +
      (resource.text ? '<p>' + esc(resource.text) + '</p>' : '') +
      '<a href="' + esc(resource.url) + '"' + linkAttrs + '>' + esc(resource.cta || "Explore resource →") + '</a>' +
      (resource.affiliate ? '<div class="sqt-meta-row"><span>Affiliate link</span></div>' : '');
  }


  function aroundWebAge(iso) {
    var days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
    if (days === 0) return "today";
    if (days < 7) return days + "d ago";
    if (days < 35) return Math.floor(days / 7) + "w ago";
    return Math.floor(days / 30) + "mo ago";
  }

  function loadAroundWeb(root) {
    var target = root.querySelector("[data-home-around-web]");
    if (!target) return;
    fetch("https://sqspthemes-assets.pages.dev/api/around-web", { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) throw new Error("RSS feed unavailable");
        return response.json();
      })
      .then(function (data) {
        var posts = Array.isArray(data.posts) ? data.posts : [];
        if (!posts.length) {
          target.innerHTML = '<div class="sqt-home-empty">No recent posts across the blogs we follow.</div>';
          return;
        }
        target.innerHTML = posts.slice(0, 9).map(function (item) {
          if (!/^https?:\/\//i.test(item.url || "")) return "";
          return '<article class="sqt-home-around-item">' +
            '<a class="sqt-home-around-title" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + '</a>' +
            '<div class="sqt-home-around-meta">' + esc(item.blog) + ' ↗ · ' + esc(aroundWebAge(item.publishedAt)) + '</div>' +
          '</article>';
        }).join("");
      })
      .catch(function () {
        target.innerHTML = '<div class="sqt-home-empty">Around the Square Web is temporarily unavailable.</div>';
      });
  }

  function mountHomepage() {
    var marker = d.getElementById("sqt-home-source");
    if (!marker) return false;

    var page = d.getElementById("page");
    var source = marker.closest("section.page-section") || page;
    var sourceHeading = source && source.querySelector(".sqs-html-content h1, .sqs-html-content h2, h1, h2");
    var sourcePara = source && source.querySelector(".sqs-html-content p, p");
    var title = text(sourceHeading) || "Do more with Squarespace.";
    var dek = "Tools, templates and opportunities for people building with Squarespace.";

    html.classList.add("sqt-home-active");

    var root = make(
      '<div id="sqt-home" class="sqt">' +
        '<main class="sqt-home-wrap sqt-page-shell" id="sqt-content" tabindex="-1">' +
          '<section class="sqt-home-intro sqt-page-intro">' +
            '<div class="sqt-home-intro-copy">' +
              '<h1>' + esc(title) + '</h1>' +
              '<p>' + esc(dek) + '</p>' +
            '</div>' +

          '</section>' +

          '<div class="sqt-home-layout sqt-layout">' +
            '<div class="sqt-home-main sqt-main sqt-stack">' +
              '<section class="sqt-home-box sqt-home-feature-box sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">Featured</div>' +
                '<div class="sqt-home-box-body sqt-panel__body" data-home-feature><div class="sqt-home-empty">Loading the latest from the ecosystem…</div></div>' +
              '</section>' +


              '<section class="sqt-home-box sqt-home-latest-box sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">Latest Articles</div>' +
                '<div class="sqt-home-latest" data-home-latest><div class="sqt-home-empty">Loading latest articles…</div></div>' +
                '<div class="sqt-home-box-foot sqt-panel__foot"><a href="/blog">See all articles →</a></div>' +
              '</section>' +

              '<section class="sqt-home-box sqt-home-bottom-newsletter sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">Get the Good Stuff by Email</div>' +
                '<div class="sqt-home-newsletter-wide sqt-form-panel">' +
                  '<div><strong>Useful Squarespace finds without having to go looking for them.</strong><p>Join 5,436 designers, business owners, and Squarespace pros getting the good stuff by email.</p></div>' +
                  subscribeForm("Email address") +
                '</div>' +
              '</section>' +

              '<section class="sqt-home-box sqt-home-explore-box sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">Explore More</div>' +
                '<div class="sqt-home-explore" data-home-explore>' + homeExploreMarkup(0, 0) + '</div>' +
              '</section>' +

            '</div>' +

            '<aside class="sqt-home-sidebar sqt-sidebar sqt-stack" aria-label="Explore SQSPThemes">' +
              '<section class="sqt-home-box sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">Start Here</div>' +
                '<div class="sqt-home-side-body sqt-panel__body"><ol class="sqt-home-start-list">' +
                  '<li><a href="/find-templates">Find a Template</a></li>' +
                  '<li><a href="/best-squarespace-designers">Hire a Squarespace Designer</a></li>' +
                  '<li><a href="/plugin-directory">Explore Plugins &amp; Solutions</a></li>' +
                '</ol></div>' +
              '</section>' +

              '<section class="sqt-home-box sqt-home-resource-box sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">Featured Resource</div>' +
                '<div class="sqt-home-side-body sqt-panel__body" data-home-resource></div>' +
              '</section>' +

              '<section class="sqt-home-box sqt-panel">' +
                '<div class="sqt-home-box-head sqt-panel__head">From the Directory</div>' +
                '<div class="sqt-home-side-body sqt-panel__body" data-home-designer><div class="sqt-home-empty">Loading a featured designer…</div></div>' +
              '</section>' +
              '<section class="sqt-home-box sqt-panel sqt-home-around-box">' +
                '<div class="sqt-home-box-head sqt-panel__head">Around the Square Web</div>' +
                '<div class="sqt-home-around-list" data-home-around-web><div class="sqt-home-empty">Loading from the Squarespace community…</div></div>' +
              '</section>' +
            '</aside>' +
          '</div>' +
        '</main>' +
      '</div>'
    );

    if (page && page.parentNode) page.parentNode.insertBefore(root, page.nextSibling);
    else marker.parentNode.insertBefore(root, marker.nextSibling);

    var skip = d.querySelector("#sqt-header .sqt-skip");
    if (skip) skip.href = "#sqt-content";

    wireSubscribe(root);
    loadAroundWeb(root);

    // Select once per homepage load, independently of slower directory/blog requests.
    var resource = homeRotationPick(homeFeaturedResources(), "resources", function (item) {
      return String(item.id || item.url);
    });
    root.querySelector("[data-home-resource]").innerHTML = homeResourceMarkup(resource);

    Promise.all([
      getJSON("/blog").catch(function () { return null; }),
      fetchAssetJSON("directory-data.json").catch(function () { return null; }),
      fetchAssetJSON("template-catalog.json").catch(function () { return null; })
    ]).then(function (results) {
      var blog = results[0];
      var directory = results[1];
      var catalog = results[2];

      var items = blog && blog.items ? blog.items.map(homePost).filter(function (p) {
        return p.title && p.url && p.url !== "#";
      }) : [];

      if (items.length) {
        var featured = items.find(function (p) { return p.featured; }) || items[0];
        var latest = items.filter(function (p) { return p.url !== featured.url; }).slice(0, 5);
        root.querySelector("[data-home-feature]").innerHTML = homeFeatureMarkup(featured);
        root.querySelector("[data-home-latest]").innerHTML = homeLatestMarkup(latest);
      } else {
        root.querySelector("[data-home-feature]").innerHTML = homeFeatureMarkup(null);
        root.querySelector("[data-home-latest]").innerHTML = homeLatestMarkup([]);
      }

      var designerCount = directory && (directory.count || (directory.designers && directory.designers.length)) || 0;
      var templateCount = catalog && (catalog.published_count || (catalog.templates && catalog.templates.length)) || 0;

      root.querySelector("[data-home-explore]").innerHTML = homeExploreMarkup(templateCount, designerCount);

      var designers = directory && directory.designers || [];
      var eligibleDesigners = designers.filter(function (x) {
        return x.avatarReady === "Yes" && x.image && (x.studio || x.person || x.name);
      });
      if (!eligibleDesigners.length) {
        eligibleDesigners = designers.filter(function (x) { return x.image && (x.studio || x.person || x.name); });
      }
      var designer = homeRotationPick(eligibleDesigners, "designers", function (item) {
        return String(item.name || item.studio || item.person);
      });
      var designerBox = root.querySelector("[data-home-designer]");
      if (designerBox) {
        if (designer) {
          designerBox.innerHTML =
            '<article class="sqt-home-designer">' +
              (designer.image ? '<img src="' + esc(designer.image) + '" alt="" loading="lazy">' : '') +
              '<div><a class="sqt-home-side-title" href="/best-squarespace-designers">' + esc(designer.studio || designer.person || designer.name) + '</a>' +
              '<p>' + esc(homeTrim(designer.description, 120)) + '</p>' +
              '<a href="/best-squarespace-designers">Browse the directory →</a></div>' +
            '</article>';
        } else {
          designerBox.innerHTML = '<a href="/best-squarespace-designers">Browse the Squarespace Designer Directory →</a>';
        }
      }
    });

    return true;
  }


  /* ============================== directory ============================== */

  function mountDirectory() {
    var mount = d.getElementById("sqt-directory-root");
    if (!mount) return false;

    var page = d.getElementById("page");
    if (page) page.classList.add("sqt-directory-page");

    var containingSection = mount.closest("section.page-section");
    if (page) {
      page.querySelectorAll("section.page-section").forEach(function (sec) {
        if (sec !== containingSection) sec.classList.add("sqt-directory-old");
      });
    }

    mount.innerHTML =
      '<div id="sqt-directory" class="sqt">' +
        '<div class="sqt-dir-wrap sqt-page-shell" id="sqt-content" tabindex="-1">' +
          '<section class="sqt-dir-hero sqt-page-intro">' +
            '<h1 class="sqt-page-title">Find the Right Squarespace Designer</h1>' +
            '<p class="sqt-dir-sub sqt-page-dek">Browse paid listings from Squarespace designers and studios. Compare their work, specialties, and project budgets to find a fit.</p>' +
          '</section>' +
          '<div id="sqt-dir-sticky-filters" class="sqt-dir-sticky-filters sqt-panel" role="group" aria-label="Filter directory listings">' +
            '<div class="sqt-dir-controls sqt-filterbar">' +
              '<label>Region<select id="sqt-dir-region">' +
                '<option value="">All regions</option>' +
                '<option value="us">United States</option>' +
                '<option value="canada">Canada</option>' +
                '<option value="uk-europe">UK &amp; Europe</option>' +
                '<option value="aus-nz">Australia &amp; New Zealand</option>' +
                '<option value="global">Global</option>' +
              '</select></label>' +
              '<label>Budget<select id="sqt-dir-budget">' +
                '<option value="">Any budget</option>' +
                '<option value="under2500">Under $2.5k</option>' +
                '<option value="2500to5000">$2.5k–$5k</option>' +
                '<option value="5000to10000">$5k–$10k</option>' +
                '<option value="10000plus">$10k+</option>' +
              '</select></label>' +
              '<label>Need<select id="sqt-dir-need">' +
                '<option value="">Anything</option>' +
                '<option value="new-site">New website</option>' +
                '<option value="redesign">Redesign</option>' +
                '<option value="seo">SEO</option>' +
                '<option value="branding">Branding</option>' +
                '<option value="development">Custom development</option>' +
                '<option value="ecommerce">Ecommerce</option>' +
                '<option value="support">Ongoing support</option>' +
              '</select></label>' +
            '</div>' +
            '<div class="sqt-dir-toolbar-actions">' +
              '<button id="sqt-dir-search-toggle" type="button" aria-expanded="false" aria-controls="sqt-dir-search-panel">Search</button>' +
              '<a class="sqt-dir-get-listed" href="/contact">Get listed →</a>' +
              '<button id="sqt-dir-clear" type="button">Clear filters</button>' +
            '</div>' +
            '<div class="sqt-dir-search-panel" id="sqt-dir-search-panel" hidden>' +
              '<label class="sqt-dir-search-label" for="sqt-dir-search">Search by name, studio or specialty' +
                '<input id="sqt-dir-search" type="search" placeholder="Search designers…" autocomplete="off">' +
              '</label>' +
            '</div>' +
            '<span id="sqt-dir-count" class="sqt-dir-visually-hidden" role="status" aria-live="polite">Loading listings…</span>' +
          '</div>' +
          '<section class="sqt-dir-results sqt-panel">' +
            '<div class="sqt-panel__head">Directory Listings</div>' +
            '<ol class="sqt-dir-list sqt-list-rows" id="sqt-dir-list"></ol>' +
            '<p class="sqt-dir-empty sqt-empty" id="sqt-dir-empty" hidden>No designers match those filters.</p>' +
          '</section>' +
        '</div>' +
      '</div>';

    var list = mount.querySelector("#sqt-dir-list");
    var count = mount.querySelector("#sqt-dir-count");
    var empty = mount.querySelector("#sqt-dir-empty");
    var search = mount.querySelector("#sqt-dir-search");
    var region = mount.querySelector("#sqt-dir-region");
    var budget = mount.querySelector("#sqt-dir-budget");
    var need = mount.querySelector("#sqt-dir-need");
    var clear = mount.querySelector("#sqt-dir-clear");
    var searchToggle = mount.querySelector("#sqt-dir-search-toggle");
    var searchPanel = mount.querySelector("#sqt-dir-search-panel");
    var toolbar = mount.querySelector("#sqt-dir-sticky-filters");
    var designers = [];

    searchToggle.addEventListener("click", function () {
      var opening = searchPanel.hidden;
      searchPanel.hidden = !opening;
      searchToggle.setAttribute("aria-expanded", opening ? "true" : "false");
      searchToggle.textContent = opening ? "Close search" : "Search";
      if (opening) search.focus();
    });

    // On phones the filter bar belongs immediately below the site header
    // from the first frame, rather than appearing only after scrolling
    // past the directory intro. On desktop it returns to its source position.
    var toolbarSlot = d.createComment("SQSPThemes directory filter position");
    toolbar.parentNode.insertBefore(toolbarSlot, toolbar);
    function positionDirectoryToolbar() {
      var siteHeader = d.getElementById("sqt-header");
      if (!siteHeader) return;
      if (window.matchMedia("(max-width: 760px)").matches) {
        if (toolbar.previousElementSibling !== siteHeader ||
            toolbar.parentNode !== siteHeader.parentNode) {
          siteHeader.parentNode.insertBefore(toolbar, siteHeader.nextSibling);
        }
      } else if (toolbarSlot.parentNode &&
                 (toolbar.parentNode !== toolbarSlot.parentNode ||
                  toolbar.previousSibling !== toolbarSlot)) {
        toolbarSlot.parentNode.insertBefore(toolbar, toolbarSlot.nextSibling);
      }
    }
    positionDirectoryToolbar();
    window.addEventListener("resize", positionDirectoryToolbar, { passive: true });

    function profileUrl(x) {
      return x.profileUrl || x.portfolio || x.contact || "#";
    }

    function renderRow(x, i) {
      var img = x.image
        ? '<a class="sqt-dir-thumb" href="' + esc(profileUrl(x)) + '"><img src="' + esc(x.image) + '" alt="" loading="lazy"></a>'
        : '<span class="sqt-dir-thumb sqt-dir-thumb--empty" aria-hidden="true"></span>';

      var tags = (x.needs || []).slice(0,5).map(function (n) {
        return '<span>' + esc(n.replace(/-/g," ")) + '</span>';
      }).join("");

      return '<li class="sqt-dir-row sqt-list-row">' +
        '<div class="sqt-dir-num">' + String(i + 1).padStart(2,"0") + '</div>' +
        img +
        '<div class="sqt-dir-main sqt-list-row__body">' +
          '<h2><a href="' + esc(profileUrl(x)) + '">' + esc(x.name) + '</a></h2>' +
          '<div class="sqt-dir-meta sqt-meta-row">' +
            (x.location ? '<span>' + esc(x.location) + '</span>' : '') +
            (x.projectRange ? '<span>' + esc(x.projectRange) + '</span>' : '') +
          '</div>' +
          (x.description ? '<p class="sqt-dir-desc">' + esc(x.description) + '</p>' : '') +
          (tags ? '<div class="sqt-dir-tags">' + tags + '</div>' : '') +
          '<p class="sqt-dir-links">' +
            (x.portfolio ? '<a href="' + esc(x.portfolio) + '">View portfolio</a>' : '') +
            (x.portfolio && x.contact ? ' <span>·</span> ' : '') +
            (x.contact ? '<a href="' + esc(x.contact) + '">Contact designer</a>' : '') +
          '</p>' +
        '</div>' +
      '</li>';
    }

    function apply() {
      var q = search.value.trim().toLowerCase();
      var r = region.value;
      var b = budget.value;
      var n = need.value;

      var visible = designers.filter(function (x) {
        var hay = [
          x.name, x.person, x.studio, x.location, x.projectRange, x.description,
          (x.clientTypes || []).join(" "), (x.needs || []).join(" ")
        ].join(" ").toLowerCase();

        if (q && hay.indexOf(q) === -1) return false;
        if (r && x.region !== r) return false;
        if (b && (x.budgets || []).indexOf(b) === -1) return false;
        if (n && (x.needs || []).indexOf(n) === -1) return false;
        return true;
      });

      list.innerHTML = visible.map(renderRow).join("");
      count.textContent = visible.length + (visible.length === 1 ? " designer" : " designers");
      empty.hidden = visible.length !== 0;
      normalizeInternalLinks(mount);
    }

    [search, region, budget, need].forEach(function (el) {
      el.addEventListener(el === search ? "input" : "change", apply);
    });

    clear.addEventListener("click", function () {
      search.value = "";
      region.value = "";
      budget.value = "";
      need.value = "";
      apply();
      clear.focus();
    });

    fetch("https://sqspthemes-assets.pages.dev/directory-data.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (data) {
        designers = (data.designers || []).slice().sort(function (a,b) {
          return (a.order || 999) - (b.order || 999);
        });
        apply();
      })
      .catch(function () {
        count.textContent = "Directory data could not load.";
        empty.hidden = false;
        empty.textContent = "Please refresh the page in a moment.";
      });

    return true;
  }

  /* ============================== blog list ============================== */

  function rowsHtml(posts, start) {
    return posts.map(function (p, i) {
      var meta = [];
      if (p.type) meta.push('<span>' + esc(p.type) + '</span>');
      if (p.topic) meta.push('<a href="' + esc(blogBase()) + '?category=' + encodeURIComponent(p.topic) + '">' + esc(p.topic) + '</a>');
      if (p.date) meta.push('<span>' + esc(fmtDate(p.date)) + '</span>');
      return '<li class="sqt-row sqt-list-row">' +
        '<span class="sqt-num" aria-hidden="true">' + String(start + i).padStart(2, "0") + '</span>' +
        '<div class="sqt-row-body sqt-list-row__body">' +
          '<a class="sqt-row-title sqt-list-row__title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
          (p.excerpt ? '<p class="sqt-row-dek sqt-list-row__dek">' + esc(p.excerpt) + '</p>' : '') +
          '<div class="sqt-meta sqt-meta-row">' + meta.join("") + '</div>' +
        '</div></li>';
    }).join("");
  }

  function featuredHtml(p) {
    if (!p) return "";
    var meta = [];
    if (p.topic) meta.push(p.topic);
    if (p.type) meta.push(p.type);
    if (p.date) meta.push(fmtDate(p.date));
    return '<section class="sqt-featured sqt-panel" aria-label="Featured story">' +
      '<div class="sqt-panel__head">Featured</div>' +
      '<div class="sqt-panel__body sqt-featured-body">' +
        '<a class="sqt-featured-title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
        (p.excerpt ? '<p class="sqt-featured-dek">' + esc(p.excerpt) + '</p>' : '') +
        (meta.length ? '<div class="sqt-featured-meta sqt-meta-row">' + meta.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' : '') +
        '<a class="sqt-featured-link" href="' + esc(p.url) + '">Read story →</a>' +
      '</div>' +
    '</section>';
  }

  function listPage(sec) {
    var params = new URLSearchParams(location.search);
    var cat = params.get("category");
    var tag = params.get("tag");
    var start = Math.max(1, parseInt(params.get("n"), 10) || 1);
    var base = blogBase();

    var posts = [].map.call(sec.querySelectorAll("article.blog-item"), function (a) {
      var link = a.querySelector(".blog-title a");
      return {
        title: text(link),
        url: link ? link.getAttribute("href") : "#",
        date: parseListDate(text(a.querySelector("time.blog-date"))),
        excerpt: text(a.querySelector(".blog-excerpt-wrapper")),
        type: "",
        topic: ""
      };
    });

    function pagerHref(a, n) {
      if (!a) return "";
      var u = new URL(a.getAttribute("href"), location.origin);
      if (n > 1) u.searchParams.set("n", n); else u.searchParams.delete("n");
      return u.pathname + u.search;
    }

    var olderA = sec.querySelector(".blog-list-pagination .older a");
    var newerA = sec.querySelector(".blog-list-pagination .newer a");

    var archiveHeading = cat ? "Articles: " + cat : tag ? "Articles: " + tag : "All Articles";

    var side = '<aside class="sqt-side sqt-sidebar sqt-stack" aria-label="Article tools">' +
      (C.types.length ? '<section class="sqt-panel"><div class="sqt-panel__head">Browse by type</div><div class="sqt-panel__body"><ul>' + C.types.map(function (t) {
        return '<li><a href="' + base + '?tag=' + encodeURIComponent(t) + '"' +
          (tag && tag.toLowerCase() === t.toLowerCase() ? ' aria-current="page"' : '') + '>' + esc(t) + '</a></li>';
      }).join("") + '</ul></div></section>' : '') +
      (C.kitAction ? '<section class="sqt-panel sqt-archive-newsletter"><div class="sqt-panel__head">Get the Good Stuff by Email</div><div class="sqt-panel__body"><strong>Useful Squarespace finds without having to go looking for them.</strong><p>Join 5,436 designers, business owners, and Squarespace pros getting the good stuff by email.</p>' + subscribeForm("Email address") + '</div></section>' : '') +
    '</aside>';

    var root = make(
      '<div id="sqt-blog" class="sqt sqt-blog-archive">' +
        '<div class="sqt-wrap sqt-page-shell" id="sqt-content" tabindex="-1">' +
          '<div class="sqt-index-intro sqt-page-intro">' +
            '<h1 class="sqt-h1 sqt-page-title">Articles</h1>' +
            '<p class="sqt-sub sqt-page-dek">News, practical solutions, tools, and ideas for people building with Squarespace.</p>' +
          '</div>' +
          '<div class="sqt-cols sqt-layout">' +
            '<div class="sqt-main sqt-stack">' +
              '<section class="sqt-panel sqt-blog-list-panel">' +
                '<div class="sqt-panel__head">' + esc(archiveHeading) + '</div>' +
                '<ol class="sqt-list sqt-list-rows" start="' + start + '">' + rowsHtml(posts, start) + '</ol>' +
                '<nav class="sqt-pager sqt-pagination sqt-panel__foot" aria-label="Pages">' +
                  (newerA ? '<a href="' + esc(pagerHref(newerA, Math.max(1, start - posts.length))) + '">← Newer</a>' : '<span></span>') +
                  (olderA ? '<a href="' + esc(pagerHref(olderA, start + posts.length)) + '">Older →</a>' : '<span></span>') +
                '</nav>' +
              '</section>' +
            '</div>' +
            side +
          '</div>' +
        '</div>' +
      '</div>'
    );

    sec.parentNode.insertBefore(root, sec.nextSibling);
    wireSubscribe(root);

    getJSON(location.pathname + location.search).then(function (data) {
      var byUrl = {};
      (data.items || []).forEach(function (it) { byUrl[it.fullUrl] = it; });
      posts.forEach(function (p) {
        var it = byUrl[p.url];
        if (!it) return;
        p.type = typeOf(it.tags);
        p.topic = topicOf(it.categories);
        if (it.excerpt) p.excerpt = stripHtml(it.excerpt);
        if (it.publishOn) p.date = new Date(it.publishOn);
      });
      root.querySelector(".sqt-list").innerHTML = rowsHtml(posts, start);
    }).catch(function () {});
  }

  /* ============================== blog post ============================== */

  function copyText(str, btn) {
    var original = btn.getAttribute("data-copy-label") || btn.textContent || "Copy";
    function done() {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = original; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).then(done, function () {});
    } else {
      var ta = d.createElement("textarea");
      ta.value = str;
      d.body.appendChild(ta);
      ta.select();
      try { d.execCommand("copy"); done(); } catch (e) {}
      ta.remove();
    }
  }

  var CODE_PREVIEW_LINES = 24;

  function enhanceCode(body) {
    var blocks = [];
    body.querySelectorAll("pre, .sqs-block-code code, .sqs-code-container code").forEach(function (node) {
      if (node.tagName === "CODE" && node.closest("pre")) return;
      if (blocks.indexOf(node) === -1) blocks.push(node);
    });

    blocks.forEach(function (source, i) {
      var box = source.closest(".sqs-code-container, .sqs-block-code") || source;
      if (box.classList.contains("sqt-code-ready")) return;
      box.classList.add("sqt-code", "sqt-code-ready");

      var raw = source.textContent.replace(/\s+$/, "");
      var lines = raw ? raw.split("\n").length : 0;
      var context = "";
      var prev = box.previousElementSibling;
      if (prev) context = text(prev);
      var kind = /prompt/i.test(context) ? "Prompt" : "Code";

      var bar = make('<div class="sqt-codebar"><span>' + kind + (lines > 1 ? ' · ' + lines + ' lines' : '') + '</span></div>');
      if (i === 0) bar.id = "get-the-code";

      var btn = make('<button class="sqt-btn sqt-btn--ghost" type="button" data-copy-label="Copy">Copy</button>');
      btn.addEventListener("click", function () { copyText(raw, btn); });
      bar.appendChild(btn);
      box.parentNode.insertBefore(bar, box);

      if (source.tagName === "PRE" && lines > CODE_PREVIEW_LINES + 6) {
        box.classList.add("is-collapsed");
        var more = make('<button class="sqt-code-more" type="button" aria-expanded="false">Show all ' + lines + ' lines</button>');
        more.addEventListener("click", function () {
          var collapsed = box.classList.toggle("is-collapsed");
          more.setAttribute("aria-expanded", collapsed ? "false" : "true");
          more.textContent = collapsed ? "Show all " + lines + " lines" : "Show fewer lines";
        });
        box.parentNode.insertBefore(more, box.nextSibling);
      }
    });
  }

  function postPage(wrap) {
    var sec = wrap.closest("section");
    var body = wrap.querySelector(".blog-item-content");
    var base = blogBase();
    var title = text(wrap.querySelector(".entry-title"));
    var dateText = text(wrap.querySelector("time.blog-meta-item--date"));
    var author = text(wrap.querySelector(".blog-author-name")) || C.author;
    var bio = text(wrap.querySelector(".author-bio"));
    var av = wrap.querySelector(".author-avatar-image");
    var avatar = av ? (av.getAttribute("data-src") || av.getAttribute("src")) : "";
    var site = wrap.querySelector(".author-website");
    var siteUrl = site ? site.getAttribute("href") : "";
    var prevA = d.querySelector(".item-pagination-link--prev");
    var nextA = d.querySelector(".item-pagination-link--next");

    var glance = body.querySelector(".sqt-glance");
    if (glance) {
      var gb = glance.closest(".sqs-block");
      glance.remove();
      if (gb && !text(gb)) gb.remove();
    }
    var hasCode = !!body.querySelector("pre, .sqs-block-code code, .sqs-code-container code");

    function pag(a, dir) {
      if (!a) return '<span></span>';
      var t = text(a.querySelector(".item-pagination-title"));
      return '<a class="sqt-next-' + dir + '" href="' + esc(a.getAttribute("href")) + '">' +
        '<span class="sqt-label">' + (dir === "prev" ? "← Newer" : "Older →") + '</span>' + esc(t) + '</a>';
    }

    var root = make(
      '<div id="sqt-blog" class="sqt">' +
        '<div class="sqt-wrap sqt-wrap--post sqt-page-shell" id="sqt-content" tabindex="-1">' +
          '<nav class="sqt-crumbs" aria-label="Breadcrumb"><a href="' + base + '">Blog</a></nav>' +
          '<div class="sqt-post sqt-layout">' +
            '<div class="sqt-head sqt-page-intro">' +
              '<h1 class="sqt-title sqt-page-title">' + esc(title) + '</h1>' +
              '<div class="sqt-meta sqt-meta-row"><span class="sqt-type" hidden></span>' +
                '<span class="sqt-date">' + esc(dateText) + '</span><span>By ' + esc(author) + '</span></div>' +
              (hasCode ? '<a class="sqt-btn" href="#get-the-code">Skip to the code ↓</a>' : '') +
            '</div>' +
            '<article class="sqt-article"><div class="sqt-body"></div>' +
              '<div class="sqt-author">' +
                (avatar ? '<img class="sqt-avatar" src="' + esc(avatar) + '" alt="" width="56" height="56">' : '<span class="sqt-avatar" aria-hidden="true"></span>') +
                '<div><div class="sqt-author-name">' + esc(author) + '</div><p>' + esc(bio) +
                  (siteUrl ? ' <a href="' + esc(siteUrl) + '">' + esc(siteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + '</a>' : '') +
                '</p></div>' +
              '</div>' +
              '<nav class="sqt-next" aria-label="More posts">' + pag(prevA, "prev") + pag(nextA, "next") + '</nav>' +
            '</article>' +
            '<div class="sqt-rail sqt-sidebar sqt-stack">' +
              (glance ? '<div class="sqt-rail-glance"></div>' : '') +
              '<aside class="sqt-side sqt-post-side sqt-stack" aria-label="More">' +
                '<nav class="sqt-post-toc sqt-panel" aria-label="Contents" hidden><div class="sqt-panel__head">Contents</div><div class="sqt-panel__body"><ol></ol></div></nav>' +
                (C.kitAction ? '<section class="sqt-side-newsletter sqt-panel"><div class="sqt-panel__head">Get the Good Stuff by Email</div><div class="sqt-panel__body"><h2>Useful Squarespace finds without having to go looking for them.</h2><p>Join 5,436 designers, business owners, and Squarespace pros getting the good stuff by email.</p>' + subscribeForm("Email address") + '</div></section>' : '') +
                '<section class="sqt-related sqt-panel" hidden><div class="sqt-panel__head">More like this</div><div class="sqt-panel__body"><ul></ul></div></section>' +
                '<section class="sqt-topic sqt-panel" hidden><div class="sqt-panel__head">Browse this topic</div><div class="sqt-panel__body"><a class="sqt-feature" href="#"></a></div></section>' +
                '<section class="sqt-next-step sqt-panel" hidden><div class="sqt-panel__head">Keep going</div><div class="sqt-panel__body"><a class="sqt-feature" href="#"></a><p></p></div></section>' +
              '</aside>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    root.querySelector(".sqt-body").appendChild(body);
    if (glance) root.querySelector(".sqt-rail-glance").appendChild(glance);

    // images moved out of Squarespace's wrapper: make sure they load
    body.querySelectorAll("img[data-src]").forEach(function (img) {
      if (!img.getAttribute("src")) {
        var s = img.getAttribute("data-src");
        img.setAttribute("src", s + (s.indexOf("?") > -1 ? "" : "?format=1000w"));
      }
    });

    var firstP = body.querySelector(".sqs-html-content p");
    if (firstP && text(firstP)) firstP.classList.add("sqt-dek");

    enhanceCode(body);

    var hs = body.querySelectorAll("h2");
    var sideToc = root.querySelector(".sqt-post-toc");
    if (sideToc && hs.length >= 2) {
      var tocList = sideToc.querySelector("ol");
      hs.forEach(function (h, i) {
        if (!h.id) h.id = slug(text(h)) || ("section-" + (i + 1));
        tocList.insertAdjacentHTML("beforeend", '<li><a href="#' + esc(h.id) + '">' + esc(text(h)) + '</a></li>');
      });
      sideToc.hidden = false;
    }

    sec.parentNode.insertBefore(root, sec);
    wireSubscribe(root);

    getJSON(location.pathname).then(function (data) {
      var it = data.item || {};
      var feed = (data.collection && data.collection.fullUrl) || base;
      if (it.publishOn) root.querySelector(".sqt-date").textContent = fmtDate(it.publishOn);
      var type = typeOf(it.tags);
      if (type) {
        var te = root.querySelector(".sqt-type");
        te.textContent = type;
        te.hidden = false;
      }

      var nextStep = root.querySelector(".sqt-next-step");
      var haystack = (title + " " + (it.excerpt || "") + " " + (it.tags || []).join(" ") + " " + (it.categories || []).join(" ")).toLowerCase();
      var nextLink = nextStep && nextStep.querySelector("a");
      var nextCopy = nextStep && nextStep.querySelector("p");
      if (nextStep && nextLink && nextCopy) {
        if (type === "Opportunities" || /\brfp\b|request for proposal|bigger budget|web project/.test(haystack)) {
          nextLink.textContent = "Bigger Budget Projects";
          nextLink.href = "/rfps";
          nextCopy.textContent = "Browse current website projects and opportunities with real budgets.";
          nextStep.hidden = false;
        } else if (/template/.test(haystack)) {
          nextLink.textContent = "Browse Squarespace Templates";
          nextLink.href = "/templates";
          nextCopy.textContent = "Explore the template directory and find a stronger starting point.";
          nextStep.hidden = false;
        } else if (/designer|agency|studio/.test(haystack)) {
          nextLink.textContent = "Find a Squarespace Designer";
          nextLink.href = "/best-squarespace-designers";
          nextCopy.textContent = "Explore listed Squarespace designers and studios.";
          nextStep.hidden = false;
        }
      }

      var topic = topicOf(it.categories);
      if (!topic) return;
      var q = "?category=" + encodeURIComponent(topic);
      root.querySelector(".sqt-crumbs").insertAdjacentHTML("beforeend",
        '<span aria-hidden="true">/</span><a href="' + esc(feed + q) + '">' + esc(topic) + '</a>');
      var tp = root.querySelector(".sqt-topic");
      tp.querySelector("a").textContent = topic;
      tp.querySelector("a").href = feed + q;
      tp.hidden = false;
      return getJSON(feed + q).then(function (l) {
        var rel = (l.items || []).filter(function (x) { return x.fullUrl !== it.fullUrl; }).slice(0, 5);
        if (!rel.length) return;
        var box = root.querySelector(".sqt-related");
        box.querySelector("ul").innerHTML = rel.map(function (x) {
          return '<li><a href="' + esc(x.fullUrl) + '">' + esc(x.title) + '</a></li>';
        }).join("");
        box.hidden = false;
      });
    }).catch(function () {});
  }

  function syncStickyOffset() {
    var hd = d.getElementById("sqt-header");
    if (!hd) return;

    function update() {
      var h = Math.ceil(hd.getBoundingClientRect().height || 0);
      html.style.setProperty("--sqt-sticky-top", (h + 12) + "px");
      html.style.setProperty("--sqt-sticky-room", (h + 24) + "px");
    }

    update();

    if (window.ResizeObserver) {
      if (window.__sqtHeaderObserver) window.__sqtHeaderObserver.disconnect();
      window.__sqtHeaderObserver = new ResizeObserver(update);
      window.__sqtHeaderObserver.observe(hd);
    } else {
      window.addEventListener("resize", update, { passive: true });
    }
  }

  /* ======================= plugins directory route ======================= */
  // Squarespace owns the blank /plugin-directory page, but the actual finder
  // lives in this repository. No Code Block or page-specific injection needed.
  function mountPluginDirectory() {
    if (location.pathname.replace(/\/+$/, "") !== "/plugin-directory") return false;
    var page = d.getElementById("page");
    var root = d.getElementById("sqt-plugin-finder");
    var shell = d.getElementById("sqt-plugin-directory-shell");
    // A Squarespace Code Block often starts several empty Fluid Engine grid
    // rows below the nav. Reuse its live node in our native homepage shell.
    if (!shell) {
      shell = d.createElement("main");
      shell.id = "sqt-plugin-directory-shell";
      shell.setAttribute("aria-label", "Squarespace plugin and solution directory");
      if (page) page.insertBefore(shell, page.firstChild);
      else {
        var anchor = d.getElementById("footer-sections") || d.querySelector("footer.sections");
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(shell, anchor);
        else d.body.appendChild(shell);
      }
    }
    if (root) {
      if (root.parentNode !== shell) shell.appendChild(root);
    } else {
      root = d.createElement("div");
      root.id = "sqt-plugin-finder";
      root.dataset.catalogUrl = "https://sqspthemes-assets.pages.dev/plugin-solutions.json";
      root.dataset.mediaUrl = "https://sqspthemes-assets.pages.dev/plugin-media.json";
      root.innerHTML = '<p role="status">Loading Squarespace solutions…</p>';
      shell.appendChild(root);
    }
    root.setAttribute("tabindex", "-1");
    html.classList.add("sqt-plugin-directory-autoload");
    var skip = d.querySelector("#sqt-header .sqt-skip");
    if (skip) skip.href = "#sqt-plugin-finder";
    if (!d.querySelector('link[href*="plugin-finder.css"]')) {
      var style = d.createElement("link");
      style.rel = "stylesheet";
      style.href = "https://sqspthemes-assets.pages.dev/plugin-finder.css";
      d.head.appendChild(style);
    }
    if (!root.dataset.initialized && !d.querySelector('script[src*="plugin-finder.js"]')) {
      var script = d.createElement("script");
      script.src = "https://sqspthemes-assets.pages.dev/plugin-finder.js";
      script.defer = true;
      script.onerror = function () {
        root.innerHTML = '<p role="alert">The plugin finder could not load. Please refresh this page.</p>';
      };
      d.body.appendChild(script);
    }
    return true;
  }

  /* ================================= run ================================= */

  function fallback(err) {
    ["sqt-header", "sqt-modes", "sqt-dir-sticky-filters", "sqt-home", "sqt-blog", "sqt-footer"].forEach(function (id) {
      var el = d.getElementById(id);
      if (el) el.remove();
    });
    html.classList.remove("sqt-on", "sqt-ready", "sqt-home-active");
    if (window.console) console.warn("SQSPThemes layer turned itself off:", err);
  }

  function run() {
    // The Code Injection guard turns the layer on (html.sqt-on). It stays off
    // inside Squarespace's editor and if this file took too long to load.
    if (!html.classList.contains("sqt-on")) return;
    try {
      header();
      syncStickyOffset();
      styleNativePage();
      var list = d.querySelector('section[data-sqsp-section="blog-list"]');
      var post = d.querySelector(".blog-item-wrapper");
      if (mountHomepage()) {}
      else if (mountDirectory()) {}
      else if (mountPluginDirectory()) {}
      else if (list && list.querySelector("article.blog-item")) listPage(list);
      else if (post && post.querySelector(".blog-item-content")) postPage(post);
      else {
        var page = d.getElementById("page");
        if (page) { page.id = page.id || "page"; page.setAttribute("tabindex", "-1"); }
        var skip = d.querySelector("#sqt-header .sqt-skip");
        if (skip && page) skip.href = "#" + page.id;
      }
      footer();
      normalizeInternalLinks(d);
      enforceInternalSameTab();
      html.classList.add("sqt-ready");
    } catch (e) {
      fallback(e);
    }
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", run);
  else run();
})();
