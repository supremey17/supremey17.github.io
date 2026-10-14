/*
 * Panel: the record sleeve for the selected track (#panel) and the liner notes / resume (#resume).
 * All content comes from window.PORTFOLIO (js/data.js). Listens for deck:select / deck:eject,
 * fires deck:select from its own tracklist, deck:eject from the Eject button, and panel:ready once.
 */
(function () {
  "use strict";

  var DATA = window.PORTFOLIO || { owner: {}, tracks: [] };
  var OWNER = DATA.owner || {};
  var TRACKS = Array.isArray(DATA.tracks) ? DATA.tracks : [];
  var SVGNS = "http://www.w3.org/2000/svg";
  var PH_RE = /\[[^\]]*\]/g;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  var panelEl, resumeEl, statusEl;
  var currentId = null;
  var readyFired = false;

  /* ---------- helpers ---------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "style") node.setAttribute("style", v);
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children === null || children === undefined) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svg(tag, attrs, children) {
    var node = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function isPlaceholder(v) {
    return typeof v === "string" && /^\s*\[[^\]]*\]\s*$/.test(v);
  }
  function hasPlaceholder(v) {
    return typeof v === "string" && v.indexOf("[") !== -1 && /\[[^\]]*\]/.test(v);
  }
  function stripBrackets(v) {
    return String(v || "").replace(/^\s*\[|\]\s*$/g, "");
  }

  /* Text with [placeholders] wrapped in <span class="ph"> so the owner notices them. */
  function rich(text) {
    var frag = document.createDocumentFragment();
    var s = String(text === undefined || text === null ? "" : text);
    var last = 0;
    s.replace(PH_RE, function (m, idx) {
      if (idx > last) frag.appendChild(document.createTextNode(s.slice(last, idx)));
      frag.appendChild(el("span", { class: "ph", title: "Placeholder: edit js/data.js", text: m }));
      last = idx + m.length;
      return m;
    });
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    return frag;
  }

  function trackById(id) {
    for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i];
    return null;
  }

  /* Pad-style label: A1, A2, B1 ... counted within each side, in data order. */
  function positionLabel(track) {
    var side = track.side || "A";
    var n = 0;
    for (var i = 0; i < TRACKS.length; i++) {
      if ((TRACKS[i].side || "A") === side) n++;
      if (TRACKS[i] === track) break;
    }
    return side + n;
  }

  function catalogNo(track) {
    var handle = String(OWNER.githubHandle || OWNER.name || "REC").replace(/[^a-z]/gi, "");
    var prefix = (handle.slice(0, 3) || "REC").toUpperCase();
    var n = TRACKS.indexOf(track) + 1;
    return prefix + "-" + ("00" + n).slice(-3);
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    if (!/^[0-9a-f]{6}$/i.test(h)) return { r: 255, g: 181, b: 71 };
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  function safeColor(hex) {
    var c = hexToRgb(hex);
    return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
  }
  /* Ink that reads on the sleeve color: near-black on light covers, warm white on dark ones. */
  function coverInk(hex) {
    return luminance(hexToRgb(hex)) > 0.28 ? "#14110f" : "#efe8de";
  }

  function githubMark(size) {
    var s = svg("svg", { viewBox: "0 0 16 16", width: size, height: size, "aria-hidden": "true", focusable: "false", class: "gh-mark" }, [
      svg("path", { fill: "currentColor", d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" })
    ]);
    return s;
  }

  function lockIcon() {
    return svg("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false" }, [
      svg("path", { fill: "currentColor", d: "M4 7V5a4 4 0 118 0v2h.5A1.5 1.5 0 0114 8.5v6A1.5 1.5 0 0112.5 16h-9A1.5 1.5 0 012 14.5v-6A1.5 1.5 0 013.5 7H4zm1.5 0h5V5a2.5 2.5 0 00-5 0v2z" })
    ]);
  }

  function fire(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function announce(msg) {
    if (!statusEl) return;
    statusEl.textContent = "";
    // Give screen readers a tick to notice the change.
    setTimeout(function () { statusEl.textContent = msg; }, 30);
  }

  /* ---------- sleeve art (SVG) ---------- */

  function sleeveArt(track) {
    var color = safeColor(track.color);
    var ink = coverInk(track.color);
    var title = String(track.title || "Untitled").replace(PH_RE, function (m) { return stripBrackets(m); });
    var words = title.toUpperCase().split(/\s+/).filter(Boolean);
    // Greedy line breaking into at most 4 lines of ~10 chars.
    var lines = [];
    words.forEach(function (w) {
      var cur = lines[lines.length - 1];
      if (cur !== undefined && (cur + " " + w).length <= 10) lines[lines.length - 1] = cur + " " + w;
      else lines.push(w);
    });
    if (lines.length > 4) lines = lines.slice(0, 3).concat([lines.slice(3).join(" ")]);
    var longest = lines.reduce(function (m, l) { return Math.max(m, l.length); }, 1);
    var fs = Math.min(78, Math.floor(250 / (longest * 0.52)), Math.floor(170 / lines.length));
    var startY = 236 - (lines.length - 1) * fs * 0.92;

    var uid = "sl-" + String(track.id || "x").replace(/[^a-z0-9_-]/gi, "");
    var textNodes = lines.map(function (line, i) {
      var t = svg("text", {
        x: "24", y: String(Math.round(startY + i * fs * 0.92)),
        "font-family": "Big Shoulders Display, Arial Narrow, Impact, sans-serif",
        "font-weight": "900", "font-size": String(fs), fill: ink, "letter-spacing": "1"
      });
      if (line.length > 6) { t.setAttribute("textLength", "252"); t.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
      t.textContent = line;
      return t;
    });

    var grooves = [];
    for (var r = 40; r <= 150; r += 10) {
      grooves.push(svg("circle", { cx: "230", cy: "70", r: String(r), fill: "none", stroke: ink, "stroke-opacity": r % 30 === 0 ? ".22" : ".1", "stroke-width": "1.5" }));
    }

    function small(x, y, txt, anchor, size, op) {
      var t = svg("text", { x: String(x), y: String(y), "font-family": "Share Tech Mono, Courier New, monospace", "font-size": String(size || 13), fill: ink, "fill-opacity": op || "1", "text-anchor": anchor || "start", "letter-spacing": "1.5" });
      t.textContent = txt;
      return t;
    }

    var art = svg("svg", { viewBox: "0 0 300 300", class: "sleeve-art", role: "img", "aria-label": "Sleeve art for " + title + ", catalog number " + catalogNo(track) }, [
      svg("defs", {}, [
        svg("clipPath", { id: uid + "-clip" }, [svg("rect", { x: "0", y: "0", width: "300", height: "300" })]),
        svg("linearGradient", { id: uid + "-sheen", x1: "0", y1: "0", x2: "1", y2: "1" }, [
          svg("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": ".18" }),
          svg("stop", { offset: ".55", "stop-color": "#fff", "stop-opacity": "0" }),
          svg("stop", { offset: "1", "stop-color": "#000", "stop-opacity": ".25" })
        ])
      ]),
      svg("g", { "clip-path": "url(#" + uid + "-clip)" }, [
        svg("rect", { width: "300", height: "300", fill: color }),
        svg("g", {}, grooves),
        svg("circle", { cx: "230", cy: "70", r: "24", fill: ink, "fill-opacity": ".9" }),
        svg("circle", { cx: "230", cy: "70", r: "4", fill: color }),
        svg("rect", { x: "0", y: "268", width: "300", height: "32", fill: ink, "fill-opacity": ".92" }),
        svg("rect", { width: "300", height: "300", fill: "url(#" + uid + "-sheen)" })
      ]),
      small(24, 34, catalogNo(track), "start", 14),
      small(24, 52, "SIDE " + (track.side || "A") + " · " + positionLabel(track), "start", 11, ".75"),
      svg("g", {}, textNodes),
      small(24, 289, String(track.artist || "").toUpperCase().replace(PH_RE, function (m) { return stripBrackets(m); }).slice(0, 26), "start", 11)
    ]);
    // Footer strip text uses the sleeve color so it reads on the ink band.
    art.lastChild.setAttribute("fill", color);
    var yearT = small(276, 289, String(track.bpm ? track.bpm + " BPM" : track.year || ""), "end", 11);
    yearT.setAttribute("fill", color);
    art.appendChild(yearT);
    return art;
  }

  /* ---------- idle state ---------- */

  function renderIdle() {
    var stack = el("div", { class: "crate", "aria-hidden": "true" });
    TRACKS.slice(0, 5).forEach(function (t, i) {
      var s = el("span", { class: "crate-sleeve", style: "--sleeve:" + safeColor(t.color) + ";--i:" + i });
      s.appendChild(el("span", { class: "crate-tab", text: positionLabel(t) }));
      stack.appendChild(s);
    });
    if (!TRACKS.length) stack.appendChild(el("span", { class: "crate-sleeve", style: "--sleeve:var(--walnut-hi);--i:0" }));

    var list = el("ol", { class: "tracklist", role: "list" });
    TRACKS.forEach(function (t) {
      var btn = el("button", { type: "button", class: "tl-btn", "data-id": t.id, style: "--sleeve:" + safeColor(t.color) }, [
        el("span", { class: "tl-pos", text: positionLabel(t) }),
        el("span", { class: "tl-main" }, [
          el("span", { class: "tl-title" }, rich(t.title)),
          el("span", { class: "tl-tag" }, rich(t.tagline))
        ]),
        el("span", { class: "tl-dur", text: t.private ? "PRIVATE" : (t.year || "") })
      ]);
      btn.addEventListener("click", function () { selectFromPanel(t.id); });
      list.appendChild(el("li", null, btn));
    });

    var heading = el("h2", { class: "panel-title", id: "panel-title", tabindex: "-1" }, "Pick a record");
    return el("div", { class: "panel-idle" }, [
      el("div", { class: "idle-head" }, [
        stack,
        el("div", { class: "idle-copy" }, [
          el("p", { class: "kicker", text: "The crate · " + TRACKS.length + " record" + (TRACKS.length === 1 ? "" : "s") }),
          heading,
          el("p", { class: "idle-hint", text: "Press a pad on the deck to drop the needle, or pull a record straight from the tracklist below." })
        ])
      ]),
      el("h3", { class: "tl-head", id: "panel-tracklist-title", text: "Tracklist" }),
      list
    ]);
  }

  /* ---------- selected state ---------- */

  function renderTrack(track) {
    var color = safeColor(track.color);
    var meta = [track.year, track.duration, track.bpm ? track.bpm + " BPM" : null, "Side " + (track.side || "A")]
      .filter(function (x) { return x !== null && x !== undefined && x !== ""; });

    var metaEl = el("p", { class: "sl-meta" });
    meta.forEach(function (m, i) {
      if (i) metaEl.appendChild(el("span", { class: "sep", "aria-hidden": "true", text: "/" }));
      metaEl.appendChild(el("span", null, rich(m)));
    });

    var highlights = el("ol", { class: "sl-highlights", role: "list" });
    (track.highlights || []).forEach(function (h, i) {
      highlights.appendChild(el("li", null, [
        el("span", { class: "hl-no", "aria-hidden": "true", text: ("0" + (i + 1)).slice(-2) }),
        el("span", { class: "hl-text" }, rich(h))
      ]));
    });

    var chips = el("ul", { class: "chips", role: "list", "aria-label": "Built with" });
    (track.tech || []).forEach(function (t) { chips.appendChild(el("li", { class: "chip" }, rich(t))); });

    var cta;
    if (track.private || !track.repo || isPlaceholder(track.repo)) {
      cta = el("p", { class: "gh-private", "aria-disabled": "true" }, [
        lockIcon(),
        el("span", null, [el("strong", { text: "Private repository" }), " · source not public yet"])
      ]);
    } else {
      cta = el("a", { class: "gh-link", href: track.repo, target: "_blank", rel: "noopener" }, [
        githubMark("20"),
        el("span", null, "Open on GitHub"),
        el("span", { class: "sr-only", text: " (opens in a new tab)" }),
        el("span", { class: "gh-arrow", "aria-hidden": "true", text: "↗" })
      ]);
    }

    var eject = el("button", { type: "button", class: "eject", "aria-label": "Eject record and close details" }, [
      svg("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", focusable: "false" }, [
        svg("path", { fill: "currentColor", d: "M8 2l6 7H2zM2 11h12v3H2z" })
      ]),
      el("span", { text: "Eject" })
    ]);
    eject.addEventListener("click", function () {
      fire("deck:eject", {});
      // If the deck does not exist or ignores it, our own listener still handles it (same event).
      var h = document.getElementById("panel-title");
      if (h) h.focus({ preventScroll: true });
    });

    var heading = el("h2", { class: "panel-title sl-title", id: "panel-title", tabindex: "-1" }, rich(track.title));

    return el("article", { class: "sleeve", style: "--sleeve:" + color, "aria-labelledby": "panel-title" }, [
      el("div", { class: "sl-cover" }, [
        el("div", { class: "sl-disc", "aria-hidden": "true" }, el("span", { class: "sl-label" })),
        el("div", { class: "sl-jacket" }, sleeveArt(track))
      ]),
      el("div", { class: "sl-body" }, [
        el("div", { class: "sl-top" }, [
          el("p", { class: "kicker" }, [
            el("span", { class: "now-dot", "aria-hidden": "true" }),
            "Now playing · " + positionLabel(track) + " · " + catalogNo(track)
          ]),
          eject
        ]),
        heading,
        el("p", { class: "sl-artist" }, rich(track.artist)),
        metaEl,
        el("p", { class: "sl-tagline" }, rich(track.tagline)),
        cta,
        el("p", { class: "sl-desc" }, rich(track.description)),
        (track.highlights && track.highlights.length) ? el("h3", { class: "sl-sub", text: "Tracklist" }) : null,
        (track.highlights && track.highlights.length) ? highlights : null,
        (track.tech && track.tech.length) ? el("h3", { class: "sl-sub", text: "Credits" }) : null,
        (track.tech && track.tech.length) ? chips : null
      ])
    ]);
  }

  /* ---------- state changes ---------- */

  function animateIn(node) {
    if (reduceMotion && reduceMotion.matches) return;
    node.classList.add("is-entering");
    // Two frames so the start state paints before the transition.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { node.classList.remove("is-entering"); });
    });
  }

  function show(id, opts) {
    opts = opts || {};
    var track = trackById(id);
    if (!track) return;
    if (id === currentId && !opts.force) return; // same record already out: no re-render
    currentId = id;
    var view = renderTrack(track);
    panelEl.replaceChildren(view);
    panelEl.setAttribute("data-state", "selected");
    panelEl.style.setProperty("--sleeve", safeColor(track.color));
    animateIn(view);
    announce("Now playing: " + String(track.title || "").replace(PH_RE, function (m) { return stripBrackets(m); }));
    if (opts.focus) {
      var h = document.getElementById("panel-title");
      if (h) h.focus({ preventScroll: true });
      scrollIntoViewIfNeeded(panelEl);
    }
  }

  function idle(opts) {
    opts = opts || {};
    var wasSelected = currentId !== null;
    currentId = null;
    var view = renderIdle();
    panelEl.replaceChildren(view);
    panelEl.setAttribute("data-state", "idle");
    panelEl.style.removeProperty("--sleeve");
    if (wasSelected) {
      animateIn(view);
      announce("Record ejected.");
    }
    if (opts.focus) {
      var h = document.getElementById("panel-title");
      if (h) h.focus({ preventScroll: true });
    }
  }

  function scrollIntoViewIfNeeded(node) {
    var r = node.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      node.scrollIntoView({ behavior: reduceMotion && reduceMotion.matches ? "auto" : "smooth", block: "start" });
    }
  }

  /* Tracklist click: fire deck:select so the deck spins up too. Our own deck:select listener
     renders it; this flag only decides focus (the tracklist button is about to disappear). */
  var pendingFocus = false;
  function selectFromPanel(id) {
    pendingFocus = true;
    fire("deck:select", { id: id });
    // If nothing rendered it (shouldn't happen, our listener is synchronous), render directly.
    if (currentId !== id) show(id, { focus: true });
    pendingFocus = false;
  }

  function onSelect(e) {
    var id = e && e.detail && e.detail.id;
    if (!id) return;
    show(id, { focus: pendingFocus });
  }

  function onEject() {
    // Eject from the deck should not move focus; Eject from our button focuses the heading itself.
    var active = document.activeElement;
    var focusWasInPanel = active && panelEl.contains(active);
    if (currentId === null) return;
    idle({ focus: focusWasInPanel });
  }

  /* ---------- resume / liner notes ---------- */

  function linkOrText(value, label, cls) {
    if (!value) return null;
    if (hasPlaceholder(value)) {
      return el("span", { class: "rs-link is-ph " + (cls || "") }, [el("span", { class: "rs-link-label", text: label }), " ", el("span", null, rich(value))]);
    }
    var href = value;
    var shown = value.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    return el("a", { class: "rs-link " + (cls || ""), href: href, target: "_blank", rel: "noopener" }, [
      el("span", { class: "rs-link-label", text: label }),
      " ",
      el("span", { class: "rs-link-url", text: shown }),
      el("span", { class: "sr-only", text: " (opens in a new tab)" })
    ]);
  }

  function copyText(text, sourceEl, btn) {
    function done(ok) {
      var label = btn.querySelector(".copy-label");
      label.textContent = ok ? "Copied" : "Selected, press Ctrl+C";
      btn.classList.toggle("is-done", ok);
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { label.textContent = "Copy"; btn.classList.remove("is-done"); }, 2200);
    }
    function selectFallback() {
      try {
        var range = document.createRange();
        range.selectNodeContents(sourceEl);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) { /* ignore */ }
      done(false);
    }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, selectFallback);
    } else {
      selectFallback();
    }
  }

  function renderResume() {
    var o = OWNER;
    var nodes = [];

    var head = el("header", { class: "rs-head" }, [
      el("p", { class: "kicker", text: "Liner notes · Resume" }),
      el("h2", { id: "resume-title", class: "rs-name" }, rich(o.name || "")),
      el("p", { class: "rs-role" }, [
        el("span", null, rich(o.title || "")),
        o.location ? el("span", { class: "sep", "aria-hidden": "true", text: "/" }) : null,
        o.location ? el("span", null, rich(o.location)) : null
      ])
    ]);
    nodes.push(head);

    // Contact
    var contact = el("ul", { class: "rs-contact", role: "list", "aria-label": "Contact" });
    if (o.email) {
      if (hasPlaceholder(o.email)) {
        contact.appendChild(el("li", { class: "rs-email" }, [el("span", { class: "rs-link-label", text: "Email" }), " ", el("span", null, rich(o.email))]));
      } else {
        var addr = el("a", { class: "rs-email-text", href: "mailto:" + o.email, text: o.email });
        var btn = el("button", { type: "button", class: "copy-btn", "aria-label": "Copy email address" }, [
          svg("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", focusable: "false" }, [
            svg("path", { fill: "currentColor", d: "M5 1h8a2 2 0 012 2v8h-2V3H5zM1 5a2 2 0 012-2h7a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2zm2 0v9h7V5z" })
          ]),
          el("span", { class: "copy-label", "aria-live": "polite", text: "Copy" })
        ]);
        btn.addEventListener("click", function () { copyText(o.email, addr, btn); });
        contact.appendChild(el("li", { class: "rs-email" }, [el("span", { class: "rs-link-label", text: "Email" }), " ", addr, btn]));
      }
    }
    var gh = linkOrText(o.github, "GitHub");
    if (gh) contact.appendChild(el("li", null, gh));
    var li = linkOrText(o.linkedin, "LinkedIn");
    if (li) contact.appendChild(el("li", null, li));

    var actions = null;
    if (o.resumePdf && String(o.resumePdf).trim() && !hasPlaceholder(o.resumePdf)) {
      actions = el("a", { class: "rs-pdf", href: o.resumePdf, download: "" }, [
        svg("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false" }, [
          svg("path", { fill: "currentColor", d: "M7 1h2v7.6l2.3-2.3 1.4 1.4L8 12.4 3.3 7.7l1.4-1.4L7 8.6zM2 13h12v2H2z" })
        ]),
        el("span", { text: "Download resume (PDF)" })
      ]);
    }

    var about = el("div", { class: "rs-col rs-about" }, [
      el("h3", { class: "rs-sub", text: "About" }),
      el("p", { class: "rs-bio" }, rich(o.bio || "")),
      el("h3", { class: "rs-sub", text: "Contact" }),
      contact,
      actions
    ]);

    // Skills as credits
    var credits = el("dl", { class: "credits" });
    (o.skills || []).forEach(function (g) {
      credits.appendChild(el("div", { class: "credit" }, [
        el("dt", null, rich(g.group)),
        el("dd", null, (g.items || []).map(function (it, i) {
          return el("span", { class: "credit-item" }, [rich(it), i < g.items.length - 1 ? el("span", { class: "dot", "aria-hidden": "true", text: " · " }) : null]);
        }))
      ]));
    });
    var skillsCol = el("div", { class: "rs-col rs-skills" }, [el("h3", { class: "rs-sub", text: "Credits · Skills" }), credits]);

    // Experience + education as sides
    function entries(list, kind) {
      var ol = el("ol", { class: "rs-entries", role: "list" });
      (list || []).forEach(function (x) {
        var titleBits = kind === "exp" ? [x.role, x.org] : [x.degree, x.school];
        ol.appendChild(el("li", { class: "rs-entry" }, [
          el("div", { class: "rs-entry-head" }, [
            el("p", { class: "rs-entry-title" }, [
              el("strong", null, rich(titleBits[0] || "")),
              titleBits[1] ? el("span", { class: "rs-at" }, [" · ", rich(titleBits[1])]) : null
            ]),
            x.years ? el("p", { class: "rs-years" }, rich(x.years)) : null
          ]),
          x.summary ? el("p", { class: "rs-entry-sum" }, rich(x.summary)) : null
        ]));
      });
      return ol;
    }
    var history = el("div", { class: "rs-col rs-history" }, [
      (o.experience && o.experience.length) ? el("h3", { class: "rs-sub", text: "Side A · Experience" }) : null,
      (o.experience && o.experience.length) ? entries(o.experience, "exp") : null,
      (o.education && o.education.length) ? el("h3", { class: "rs-sub", text: "Side B · Education" }) : null,
      (o.education && o.education.length) ? entries(o.education, "edu") : null
    ]);

    // Selected works: compact list of tracks (resume "projects" section), each opens on the deck.
    var works = el("ol", { class: "rs-works", role: "list" });
    TRACKS.forEach(function (t) {
      var b = el("button", { type: "button", class: "rs-work", "data-id": t.id, style: "--sleeve:" + safeColor(t.color) }, [
        el("span", { class: "rs-work-pos", text: positionLabel(t) }),
        el("span", { class: "rs-work-title" }, rich(t.title)),
        el("span", { class: "rs-work-tag" }, rich(t.tagline))
      ]);
      b.addEventListener("click", function () { selectFromPanel(t.id); });
      works.appendChild(el("li", null, b));
    });
    var worksCol = TRACKS.length ? el("div", { class: "rs-col rs-projects" }, [el("h3", { class: "rs-sub", text: "Selected projects" }), works]) : null;

    nodes.push(el("div", { class: "rs-grid" }, [about, history, skillsCol, worksCol]));
    resumeEl.replaceChildren.apply(resumeEl, nodes);
  }

  /* ---------- init ---------- */

  function init() {
    panelEl = document.getElementById("panel");
    resumeEl = document.getElementById("resume");
    if (panelEl) {
      // The whole sleeve is too much for a live region to re-read; announce a short status instead.
      panelEl.setAttribute("aria-live", "off");
      panelEl.setAttribute("aria-labelledby", "panel-title");
      panelEl.removeAttribute("aria-label");
      statusEl = el("p", { class: "sr-only", role: "status", "aria-live": "polite" });
      panelEl.parentNode.insertBefore(statusEl, panelEl.nextSibling);
      idle();
      document.addEventListener("deck:select", onSelect);
      document.addEventListener("deck:eject", onEject);
    }
    if (resumeEl) renderResume();
    if (!readyFired) {
      readyFired = true;
      fire("panel:ready", {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
