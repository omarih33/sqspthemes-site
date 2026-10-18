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

  var DEFAULTS = {
    wordmark: "SQSPThemes",
    tagline: "Do more with Squarespace.",
    headline: "What's New Across the Squarespace Ecosystem",
    subhead: "Practical fixes, useful tools, design ideas, and Squarespace news worth your attention.",
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
    footerNote: "An independent guide to everything you can accomplish with Squarespace. Not affiliated with Squarespace.",
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
      subhead = "Practical fixes, useful tools, design ideas, and Squarespace news worth your attention.";
    }
    return { headline: headline, subhead: subhead };
  }

  /* ================================ theme ================================ */

  var themeOK = C.themePaths.indexOf("*") > -1 || onPath(C.themePaths);

  function theme() {
    return html.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function setTheme(t) {
    html.setAttribute("data-theme", t);
    try { localStorage.setItem("sqt-theme", t); } catch (e) {}
    d.querySelectorAll(".sqt-theme").forEach(function (b) {
      b.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      b.textContent = t === "dark" ? "Dark: on" : "Dark: off";
    });
  }

  function styleMode() {
    return html.getAttribute("data-sqt-style") === "editorial" ? "editorial" : "2010";
  }

  function setStyleMode(mode) {
    mode = mode === "editorial" ? "editorial" : "2010";
    html.setAttribute("data-sqt-style", mode);
    try { localStorage.setItem("sqt-style", mode); } catch (e) {}
    d.querySelectorAll(".sqt-style").forEach(function (b) {
      b.setAttribute("aria-pressed", mode === "editorial" ? "true" : "false");
      b.textContent = mode === "editorial" ? "View: Modern Editorial" : "View: 2010 Blog";
      b.setAttribute("title", mode === "editorial" ? "Switch to 2010 Blog" : "Switch to Modern Editorial");
    });
  }

  (function initStyleMode() {
    var saved = "";
    try { saved = localStorage.getItem("sqt-style") || ""; } catch (e) {}
    setStyleMode(saved === "editorial" ? "editorial" : "2010");
  })();

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
            'placeholder="Search articles, templates, designers, and Squarespace resources…">' +
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

  function header() {
    if (d.getElementById("sqt-header")) return;
    var native = d.getElementById("header");
    var nav = readNav(native);
    if (!nav.length) nav = C.nav;

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
            '<a class="sqt-wordmark" href="/">' + esc(C.wordmark) + '</a>' +
            '<span class="sqt-tagline">' + esc(C.tagline) + '</span>' +
          '</div>' +
          '<div class="sqt-hd-tools">' +
            '<button class="sqt-tool sqt-style" type="button" aria-pressed="false" title="Switch visual style">View: 2010 Blog</button>' +
            (themeOK ? '<button class="sqt-tool sqt-theme" type="button" aria-pressed="false">Dark: off</button>' : '') +
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

    var sbtn = hd.querySelector(".sqt-style");
    if (sbtn) sbtn.addEventListener("click", function () {
      setStyleMode(styleMode() === "editorial" ? "2010" : "editorial");
    });

    var tbtn = hd.querySelector(".sqt-theme");
    if (tbtn) tbtn.addEventListener("click", function () {
      setTheme(theme() === "dark" ? "light" : "dark");
    });

    wireSearch(hd);

    if (native) native.parentNode.insertBefore(hd, native);
    else d.body.insertBefore(hd, d.body.firstChild);

    setStyleMode(styleMode());
    if (themeOK) setTheme(theme());
  }

  /* ================================ footer =============================== */

  function footer() {
    var existing = d.querySelector(".sqsp-footer");
    if (existing) {
      existing.classList.add("sqt-existing-footer");

      if (!existing.hasAttribute("data-sqt-footer-upgraded")) {
        existing.setAttribute("data-sqt-footer-upgraded", "true");

        var desc = existing.querySelector(".sqsp-footer__description");
        if (desc) desc.textContent = "Do more with Squarespace.";

        var brand = existing.querySelector(".sqsp-footer__brand");
        if (brand && !brand.querySelector(".sqsp-footer__note")) {
          var note = d.createElement("p");
          note.className = "sqsp-footer__note";
          note.textContent = "Tools, designers, templates, and opportunities for people building with Squarespace.";
          if (desc && desc.nextSibling) brand.insertBefore(note, desc.nextSibling);
          else brand.appendChild(note);
        }

        var newsletter = existing.querySelector(".sqsp-footer__brand-link a");
        if (newsletter) newsletter.textContent = "Get the SQSPThemes newsletter →";
      }
      return;
    }
    if (d.getElementById("sqt-footer")) return;
    var native = d.getElementById("footer-sections") || d.querySelector("footer.sections");
    var cols = [];
    if (C.topics.length) {
      cols.push({ title: "Topics", links: C.topics.map(function (t) {
        return [t, "/blog?category=" + encodeURIComponent(t)];
      }) });
    }
    cols = cols.concat(C.footer || []);
    var f = make(
      '<footer id="sqt-footer" class="sqt">' +
        '<div class="sqt-ft">' +
          '<div class="sqt-ft-cols">' +
            cols.map(function (c) {
              return '<section><h2>' + esc(c.title) + '</h2><ul>' +
                c.links.map(function (l) { return '<li><a href="' + esc(l[1]) + '">' + esc(l[0]) + '</a></li>'; }).join("") +
                '</ul></section>';
            }).join("") +
            (C.kitAction ? '<section class="sqt-ft-sub">' + subscribeForm("The newsletter") + '</section>' : '') +
          '</div>' +
          '<div class="sqt-ft-base">' +
            '<span>' + esc(C.wordmark) + ' — ' + esc(C.footerNote) + '</span>' +
            '<span>© ' + new Date().getFullYear() + (C.owner ? " " + esc(C.owner) : "") + '</span>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
    if (native) native.parentNode.insertBefore(f, native.nextSibling);
    else d.body.appendChild(f);
    wireSubscribe(f);
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
        '<div class="sqt-dir-wrap" id="sqt-content" tabindex="-1">' +
          '<section class="sqt-dir-hero">' +
            '<p class="sqt-dir-badge">Premium Squarespace Designer Directory</p>' +
            '<h1>Find the Best Squarespace Designer</h1>' +
            '<p class="sqt-dir-sub">Connect with hand-picked, professional Squarespace designers and agencies who create standout websites for businesses of all kinds.</p>' +

          '</section>' +
          '<section class="sqt-dir-controls-shell">' +
            '<div class="sqt-dir-controls-head">' +
              '<h2>Browse the Directory</h2>' +
              '<p>Filter by location, budget, and the kind of help you need.</p>' +
            '</div>' +
            '<div class="sqt-dir-controls">' +
              '<label>Search<input id="sqt-dir-search" type="search" placeholder="Name, studio, location, specialty"></label>' +
              '<label>Region<select id="sqt-dir-region">' +
                '<option value="">All regions</option>' +
                '<option value="us">United States</option>' +
                '<option value="canada">Canada</option>' +
                '<option value="uk-europe">UK & Europe</option>' +
                '<option value="aus-nz">Australia & New Zealand</option>' +
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
            '<div class="sqt-dir-status"><span id="sqt-dir-count">Loading listings…</span><button id="sqt-dir-clear" type="button">Clear filters</button></div>' +
          '</section>' +
          '<ol class="sqt-dir-list" id="sqt-dir-list"></ol>' +
          '<p class="sqt-dir-empty" id="sqt-dir-empty" hidden>No designers match those filters.</p>' +
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
    var designers = [];

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

      return '<li class="sqt-dir-row">' +
        '<div class="sqt-dir-num">' + String(i + 1).padStart(2,"0") + '</div>' +
        img +
        '<div class="sqt-dir-main">' +
          '<h2><a href="' + esc(profileUrl(x)) + '">' + esc(x.name) + '</a></h2>' +
          '<div class="sqt-dir-meta">' +
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
      search.focus();
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
      return '<li class="sqt-row">' +
        '<span class="sqt-num" aria-hidden="true">' + String(start + i).padStart(2, "0") + '</span>' +
        '<div class="sqt-row-body">' +
          '<a class="sqt-row-title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
          (p.excerpt ? '<p class="sqt-row-dek">' + esc(p.excerpt) + '</p>' : '') +
          '<div class="sqt-meta">' + meta.join("") + '</div>' +
        '</div></li>';
    }).join("");
  }

  function featuredHtml(p) {
    if (!p) return "";
    var meta = [];
    if (p.topic) meta.push(p.topic);
    if (p.type) meta.push(p.type);
    if (p.date) meta.push(fmtDate(p.date));
    return '<section class="sqt-featured" aria-label="Featured story">' +
      '<div class="sqt-featured-kicker">Featured</div>' +
      '<a class="sqt-featured-title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
      (p.excerpt ? '<p class="sqt-featured-dek">' + esc(p.excerpt) + '</p>' : '') +
      (meta.length ? '<div class="sqt-featured-meta">' + meta.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' : '') +
      '<a class="sqt-featured-link" href="' + esc(p.url) + '">Read story →</a>' +
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

    var filters = '<a href="' + base + '"' + (!cat && !tag ? ' aria-current="page"' : '') + '>All</a>' +
      C.topics.map(function (t) {
        return '<a href="' + base + '?category=' + encodeURIComponent(t) + '"' +
          (cat && cat.toLowerCase() === t.toLowerCase() ? ' aria-current="page"' : '') + '>' + esc(t) + '</a>';
      }).join("");

    var heading = cat ? "Topic: " + cat : tag ? "Type: " + tag : "Latest";
    var intro = readBlogIntro(sec);

    var side = '<aside class="sqt-side" aria-label="More">' +
      (C.types.length ? '<section><h2>Browse by type</h2><ul>' + C.types.map(function (t) {
        return '<li><a href="' + base + '?tag=' + encodeURIComponent(t) + '"' +
          (tag && tag.toLowerCase() === t.toLowerCase() ? ' aria-current="page"' : '') + '>' + esc(t) + '</a></li>';
      }).join("") + '</ul></section>' : '') +
      (C.opportunity ? '<section><h2>Opportunities</h2><a class="sqt-feature" href="' + esc(C.opportunity.url) + '">' +
        esc(C.opportunity.name) + '</a><p>' + esc(C.opportunity.text) + '</p></section>' : '') +
      '<section><h2>Send a tip</h2><p>Spotted a release, a new tool, or a fix worth sharing?</p>' +
        '<a href="' + esc(C.tipUrl) + '">Tell us →</a></section>' +
    '</aside>';

    var showFeatured = !cat && !tag && posts.length > 0;
    var archivePosts = showFeatured ? posts.slice(1) : posts;
    var archiveStart = showFeatured ? start + 1 : start;

    var root = make(
      '<div id="sqt-blog" class="sqt">' +
        '<div class="sqt-wrap" id="sqt-content" tabindex="-1">' +
          '<div class="sqt-index-intro">' +
            '<h1 class="sqt-h1">' + esc(intro.headline) + '</h1>' +
            '<p class="sqt-sub">' + esc(intro.subhead) + '</p>' +
          '</div>' +
          (C.kitAction ? '<section class="sqt-index-newsletter"><div><span class="sqt-index-newsletter-kicker">The SQSPThemes newsletter</span><h2>Get the good stuff by email.</h2><p>New tools, useful fixes, standout Squarespace work, and opportunities worth knowing about.</p></div>' + subscribeForm("Email address") + '</section>' : '') +
          (showFeatured ? featuredHtml(posts[0]) : '') +
          (C.topics.length ? '<nav class="sqt-filter" aria-label="Topics">' + filters + '</nav>' : '') +
          '<div class="sqt-cols">' +
            '<div class="sqt-main">' +
              '<h2 class="sqt-label">' + esc(showFeatured ? "Latest" : heading) + '</h2>' +
              '<ol class="sqt-list" start="' + archiveStart + '">' + rowsHtml(archivePosts, archiveStart) + '</ol>' +
              '<nav class="sqt-pager" aria-label="Pages">' +
                (newerA ? '<a href="' + esc(pagerHref(newerA, Math.max(1, start - posts.length))) + '">← Newer</a>' : '<span></span>') +
                (olderA ? '<a href="' + esc(pagerHref(olderA, start + posts.length)) + '">Older →</a>' : '<span></span>') +
              '</nav>' +
            '</div>' +
            side +
          '</div>' +
        '</div>' +
      '</div>'
    );

    // insert AFTER Squarespace's blog section, so the CSS that hides the old
    // intro section (the one directly before the blog) keeps matching
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
      if (showFeatured) {
        var feature = root.querySelector(".sqt-featured");
        if (feature) feature.outerHTML = featuredHtml(posts[0]);
        root.querySelector(".sqt-list").innerHTML = rowsHtml(posts.slice(1), start + 1);
      } else {
        root.querySelector(".sqt-list").innerHTML = rowsHtml(posts, start);
      }
    }).catch(function () {});
  }

  /* ============================== blog post ============================== */

  function copyText(str, btn) {
    function done() {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy code"; }, 2000);
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
    body.querySelectorAll("pre.source-code").forEach(function (pre, i) {
      var box = pre.closest(".sqs-code-container") || pre;
      box.classList.add("sqt-code");
      var lines = pre.textContent.replace(/\s+$/, "").split("\n").length;
      var bar = make('<div class="sqt-codebar"><span>Code · ' + lines + ' lines</span></div>');
      if (i === 0) bar.id = "get-the-code";
      var btn = make('<button class="sqt-btn sqt-btn--ghost" type="button">Copy code</button>');
      btn.addEventListener("click", function () { copyText(pre.textContent, btn); });
      bar.appendChild(btn);
      box.parentNode.insertBefore(bar, box);

      if (lines > CODE_PREVIEW_LINES + 6) {
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
    var hasCode = !!body.querySelector("pre.source-code");

    function pag(a, dir) {
      if (!a) return '<span></span>';
      var t = text(a.querySelector(".item-pagination-title"));
      return '<a class="sqt-next-' + dir + '" href="' + esc(a.getAttribute("href")) + '">' +
        '<span class="sqt-label">' + (dir === "prev" ? "← Newer" : "Older →") + '</span>' + esc(t) + '</a>';
    }

    var root = make(
      '<div id="sqt-blog" class="sqt">' +
        '<div class="sqt-wrap sqt-wrap--post" id="sqt-content" tabindex="-1">' +
          '<nav class="sqt-crumbs" aria-label="Breadcrumb"><a href="' + base + '">Blog</a></nav>' +
          '<div class="sqt-post">' +
            '<div class="sqt-head">' +
              '<h1 class="sqt-title">' + esc(title) + '</h1>' +
              '<div class="sqt-meta"><span class="sqt-type" hidden></span>' +
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
            '<div class="sqt-rail">' +
              (glance ? '<div class="sqt-rail-glance"></div>' : '') +
              '<aside class="sqt-side sqt-post-side" aria-label="More">' +
                '<section class="sqt-side-search"><h2>Looking for something specific?</h2><p>Search 10+ years of Squarespace articles, tools, templates, and resources.</p><button class="sqt-side-action sqt-open-search" type="button">Search SQSPThemes →</button></section>' +
                (C.kitAction ? '<section class="sqt-side-newsletter"><h2>Get the good stuff by email.</h2><p>Useful Squarespace finds without having to go looking for them.</p>' + subscribeForm("Email address") + '</section>' : '') +
                '<section class="sqt-related" hidden><h2>More like this</h2><ul></ul></section>' +
                '<section class="sqt-topic" hidden><h2>Browse this topic</h2><a class="sqt-feature" href="#"></a></section>' +
                '<section class="sqt-next-step" hidden><h2>Keep going</h2><a class="sqt-feature" href="#"></a><p></p></section>' +
              '</aside>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    root.querySelector(".sqt-body").appendChild(body);
    if (glance) root.querySelector(".sqt-rail-glance").appendChild(glance);

    var openSearch = root.querySelector(".sqt-open-search");
    if (openSearch) openSearch.addEventListener("click", function () {
      if (window.Monocle && typeof window.Monocle.showSearch === "function") {
        window.Monocle.showSearch();
      } else {
        var headerSearch = d.querySelector("#sqt-q");
        if (headerSearch) {
          headerSearch.focus();
          headerSearch.select();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    });

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
    if (hs.length >= 3) {
      var toc = make('<nav class="sqt-toc" aria-label="Contents"><div class="sqt-toc-title">Contents</div><ol></ol></nav>');
      hs.forEach(function (h) {
        if (!h.id) h.id = slug(text(h));
        toc.querySelector("ol").insertAdjacentHTML("beforeend", '<li><a href="#' + h.id + '">' + esc(text(h)) + '</a></li>');
      });
      hs[0].parentNode.insertBefore(toc, hs[0]);
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
          nextCopy.textContent = "Browse hand-picked Squarespace designers and studios.";
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

  /* ================================= run ================================= */

  function fallback(err) {
    ["sqt-header", "sqt-blog", "sqt-footer"].forEach(function (id) {
      var el = d.getElementById(id);
      if (el) el.remove();
    });
    html.classList.remove("sqt-on", "sqt-ready");
    if (window.console) console.warn("SQSPThemes layer turned itself off:", err);
  }

  function run() {
    // The Code Injection guard turns the layer on (html.sqt-on). It stays off
    // inside Squarespace's editor and if this file took too long to load.
    if (!html.classList.contains("sqt-on")) return;
    try {
      header();
      styleNativePage();
      var list = d.querySelector('section[data-sqsp-section="blog-list"]');
      var post = d.querySelector(".blog-item-wrapper");
      if (mountDirectory()) {}
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
