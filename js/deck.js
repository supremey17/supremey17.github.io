/* Deck: interactive direct-drive turntable. Owned by css/deck.css + js/deck.js.
   Contract (see CONTRACT.md):
     fires   deck:select {id}  when a track is chosen (pad, prev/next, start with no record, hash on load)
     fires   deck:eject  {}    from the Eject button
     listens deck:eject        (from anywhere) -> stop, lift arm, clear pads
     listens panel:ready       -> apply #hash on load, or re-announce the current track
   All project text comes from window.PORTFOLIO (js/data.js). */
(function () {
  "use strict";

  var root = document.getElementById("deck");
  if (!root) return;

  var data = window.PORTFOLIO || {};
  var owner = data.owner || {};
  var tracks = Array.isArray(data.tracks) ? data.tracks.filter(function (t) { return t && t.id; }) : [];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function validColor(c) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || "")) ? c : ""; }
  function inkFor(hex) {
    hex = validColor(hex);
    if (!hex) return "#1a120c";
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var rgb = [0, 2, 4].map(function (i) {
      var v = parseInt(h.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var L = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return L > 0.18 ? "#1a120c" : "#f6efe4";
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }

  // side + index codes: A1, A2, B1 ...
  var codes = [];
  (function () {
    var counts = {};
    tracks.forEach(function (t) {
      var s = String(t.side || "A").toUpperCase().slice(0, 2);
      counts[s] = (counts[s] || 0) + 1;
      codes.push(s + counts[s]);
    });
  })();
  var sides = [];
  tracks.forEach(function (t) { var s = String(t.side || "A").toUpperCase(); if (sides.indexOf(s) < 0) sides.push(s); });

  function indexOf(id) {
    for (var i = 0; i < tracks.length; i++) if (tracks[i].id === id) return i;
    return -1;
  }

  /* ---------- tonearm geometry (stage viewBox 118 x 100) ---------- */
  var PIVOT = { x: 102, y: 18 };
  var CENTER = { x: 42, y: 50 };
  var ARM_L = 66;
  var R_OUT = 34.2, R_IN = 21.5;   // lead-in groove and run-out groove radii
  var DRIFT_SECONDS = 420;          // how long the needle takes to cross the record
  function angleForPoint(px, py) {
    var vx = px - PIVOT.x, vy = py - PIVOT.y;
    return Math.atan2(-vx, vy) * 180 / Math.PI;
  }
  function angleForRadius(r) {
    var dx = CENTER.x - PIVOT.x, dy = CENTER.y - PIVOT.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var a = (ARM_L * ARM_L - r * r + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, ARM_L * ARM_L - a * a));
    var ux = dx / d, uy = dy / d;
    var bx = PIVOT.x + a * ux, by = PIVOT.y + a * uy;
    var p1 = { x: bx - h * uy, y: by + h * ux }, p2 = { x: bx + h * uy, y: by - h * ux };
    var p = p1.y > p2.y ? p1 : p2;
    return angleForPoint(p.x, p.y);
  }
  var REST_ANGLE = angleForPoint(106, 84);

  /* ---------- markup ---------- */
  var icons = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2.4v14H6zM20 5v14L9.5 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.6 5H18v14h-2.4zM4 5l10.5 7L4 19z"/></svg>',
    eject: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 9H4zM4 16h16v3H4z"/></svg>',
    soundOn: '<svg class="icon-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soundOff: '<svg class="icon-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  function tonearmSVG() {
    return '' +
      '<svg class="tonearm" viewBox="0 0 118 100" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="dk-tube" x1="-2" y1="0" x2="2" y2="0" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0" stop-color="#6c7075"/><stop offset=".35" stop-color="#f4f5f6"/><stop offset=".6" stop-color="#b5b9bd"/><stop offset="1" stop-color="#55595e"/>' +
        '</linearGradient>' +
        '<linearGradient id="dk-weight" x1="-7" y1="0" x2="7" y2="0" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0" stop-color="#3a3c40"/><stop offset=".3" stop-color="#d9dcdf"/><stop offset=".55" stop-color="#8d9196"/><stop offset="1" stop-color="#2c2e31"/>' +
        '</linearGradient>' +
        '<radialGradient id="dk-base" cx=".4" cy=".35" r=".7">' +
          '<stop offset="0" stop-color="#eef0f2"/><stop offset=".6" stop-color="#a2a6ab"/><stop offset="1" stop-color="#5d6166"/>' +
        '</radialGradient>' +
        '<filter id="dk-shadow" x="-50%" y="-50%" width="200%" height="200%">' +
          '<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/>' +
          '<feGaussianBlur stdDeviation=".9"/>' +
        '</filter>' +
        '<g id="dk-arm">' +
          // counterweight + stub
          '<rect x="-1.4" y="-9" width="2.8" height="9" fill="url(#dk-tube)"/>' +
          '<rect x="-6" y="-17.5" width="12" height="9" rx="1.6" fill="url(#dk-weight)" stroke="#1d1e20" stroke-width=".35"/>' +
          '<rect x="-6" y="-13.6" width="12" height=".9" fill="#1d1e20" opacity=".55"/>' +
          // S-shaped arm tube
          '<path d="M0 0 C 0.6 16, 7.4 26, 5.6 40 C 4.6 48, 0.4 50, 0 55.5" fill="none" stroke="#2a2c2f" stroke-width="2.9" stroke-linecap="round"/>' +
          '<path d="M0 0 C 0.6 16, 7.4 26, 5.6 40 C 4.6 48, 0.4 50, 0 55.5" fill="none" stroke="url(#dk-tube)" stroke-width="2.2" stroke-linecap="round"/>' +
          // headshell (offset angle) + finger lift + cartridge
          '<g transform="rotate(-16 0 61)">' +
            '<path d="M-2.6 54.5 h5.2 l.5 12.4 h-6.2 z" fill="#1d1e21" stroke="#0b0b0c" stroke-width=".3"/>' +
            '<path d="M2.6 57 l5.5 -1.2 l.4 1.3 l-5.7 1.6 z" fill="#c9cccf" stroke="#4a4d51" stroke-width=".25"/>' +
            '<rect x="-2.3" y="60.4" width="4.6" height="6" rx=".6" fill="var(--track-color)" stroke="#0b0b0c" stroke-width=".3"/>' +
            '<rect x="-2.6" y="54.2" width="5.2" height="1.4" rx=".3" fill="#9ea2a7"/>' +
          '</g>' +
        '</g>' +
      '</defs>' +
      // static base plate, anti-skate dial, cue lever, arm rest
      '<circle cx="102" cy="18" r="12.4" fill="#2b2c2f" opacity=".35"/>' +
      '<circle cx="102" cy="18" r="11.4" fill="url(#dk-base)" stroke="rgba(0,0,0,.45)" stroke-width=".4"/>' +
      '<circle cx="102" cy="18" r="8" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".3"/>' +
      '<circle cx="113.6" cy="6.5" r="2.6" fill="url(#dk-base)" stroke="rgba(0,0,0,.5)" stroke-width=".35"/>' +
      '<line x1="113.6" y1="4.4" x2="113.6" y2="6.2" stroke="#222" stroke-width=".5"/>' +
      '<rect x="110.8" y="34" width="4.6" height="11" rx="1.2" fill="#1d1e21" stroke="rgba(255,255,255,.35)" stroke-width=".3"/>' +
      '<rect x="111.6" y="35.4" width="3" height="3.4" rx=".6" fill="#c9cccf"/>' +
      '<circle cx="105.2" cy="62" r="3.1" fill="url(#dk-base)" stroke="rgba(0,0,0,.45)" stroke-width=".35"/>' +
      '<path d="M103.2 61 q2 -2.2 4 0" fill="none" stroke="#141416" stroke-width="1.1" stroke-linecap="round"/>' +
      // moving parts
      '<g class="arm-shadow-pos" transform="translate(1.4 2)"><g class="arm-rot-shadow" filter="url(#dk-shadow)"><use href="#dk-arm" transform="translate(102 18)"/></g></g>' +
      '<g class="arm-rot"><use href="#dk-arm" transform="translate(102 18)"/></g>' +
      // gimbal on top
      '<circle cx="102" cy="18" r="4.6" fill="url(#dk-base)" stroke="#2a2c2f" stroke-width=".5"/>' +
      '<circle cx="102" cy="18" r="1.4" fill="#2a2c2f"/>' +
      '</svg>';
  }

  function padHTML(t, i) {
    var color = validColor(t.color) || "";
    var style = "--i:" + i + (color ? ";--pad-color:" + color : "");
    var meta = [t.bpm ? t.bpm + " BPM" : "", t.year || ""].filter(Boolean).join(" · ");
    return '<button type="button" class="pad" data-id="' + esc(t.id) + '" data-index="' + i + '" aria-pressed="false" tabindex="' + (i === 0 ? "0" : "-1") + '" style="' + esc(style) + '">' +
      '<span class="pad__led" aria-hidden="true"></span>' +
      '<span class="pad__code">' + esc(codes[i]) + '<span class="sr-only">, </span></span>' +
      '<span class="pad__title">' + esc(t.title) + '</span>' +
      (meta ? '<span class="pad__meta"><span class="sr-only">, </span>' + esc(meta) + '</span>' : "") +
      '</button>';
  }

  var brand = owner.githubHandle || "";
  root.innerHTML = '' +
    '<div class="deck is-empty">' +
      '<div class="deck__plinth">' +
        '<div class="deck__plate">' +
          '<div class="deck__head">' +
            '<span class="deck__power"><span class="led is-on" aria-hidden="true"></span>Power</span>' +
            '<span class="deck__brand">' + (brand ? '<b>' + esc(brand) + '</b>' : "") + '<span>Quartz direct drive</span></span>' +
          '</div>' +
          '<div class="deck__top">' +
            '<div class="deck__stage">' +
              '<div class="platter-wrap" aria-hidden="true">' +
                '<div class="platter"></div>' +
                '<div class="slipmat"></div>' +
                '<div class="record">' +
                  '<div class="record__label"><div class="record__label-inner">' +
                    '<span class="record__side"></span><span class="record__title"></span><span class="record__artist"></span>' +
                  '</div></div>' +
                '</div>' +
                '<div class="sheen"></div>' +
                '<div class="spindle"></div>' +
              '</div>' +
              '<div class="strobe" aria-hidden="true"></div>' +
              tonearmSVG() +
            '</div>' +
            '<div class="pitch">' +
              '<label class="pitch__label" for="deck-pitch">Pitch</label>' +
              '<div class="pitch__slot"><input class="pitch__input" id="deck-pitch" type="range" min="-8" max="8" step="0.1" value="0" aria-valuetext="0.0 percent"></div>' +
              '<output class="pitch__readout" for="deck-pitch" aria-hidden="true">+0.0</output>' +
              '<span class="pitch__reset"><button type="button" class="tbtn pitch__reset-btn" aria-label="Reset pitch to zero" style="min-height:30px;padding:4px 8px;width:auto"><span class="led is-on" aria-hidden="true" style="position:static;font-size:9px"></span></button><span class="eng" aria-hidden="true">Quartz</span></span>' +
            '</div>' +
          '</div>' +
          '<div class="lcd" aria-label="Now playing display">' +
            '<div class="lcd__row"><span class="lcd__status"><span class="lcd__glyph"></span><span class="lcd__status-text"></span></span><span class="lcd__code"></span></div>' +
            '<div class="lcd__title"></div>' +
            '<div class="lcd__row"><span class="lcd__artist"></span><span class="lcd__time"></span></div>' +
            '<div class="lcd__row"><span class="lcd__meta"></span><span class="lcd__meta lcd__meta2"></span></div>' +
          '</div>' +
          '<div class="transport">' +
            '<div class="tbtn-wrap tbtn-wrap--start"><button type="button" class="tbtn tbtn--start" aria-pressed="false"><span class="led led--red" aria-hidden="true"></span><span class="tbtn__txt">Start · Stop</span></button></div>' +
            '<div class="tbtn-wrap"><button type="button" class="tbtn tbtn--prev" aria-label="Previous track">' + icons.prev + '</button><span class="eng" aria-hidden="true">Prev</span></div>' +
            '<div class="tbtn-wrap"><button type="button" class="tbtn tbtn--next" aria-label="Next track">' + icons.next + '</button><span class="eng" aria-hidden="true">Next</span></div>' +
            '<div class="tbtn-wrap"><button type="button" class="tbtn tbtn--eject" aria-label="Eject record">' + icons.eject + '</button><span class="eng" aria-hidden="true">Eject</span></div>' +
            '<div class="tbtn-wrap"><button type="button" class="tbtn tbtn--mute" aria-pressed="true" aria-label="Sound effects">' + icons.soundOn + icons.soundOff + '</button><span class="eng" aria-hidden="true">Sound</span></div>' +
          '</div>' +
          '<div class="pads" role="group" aria-label="Tracks">' + tracks.map(padHTML).join("") + '</div>' +
          '<p class="deck__hint">Press a pad to drop the needle. Arrow keys move between pads. Drag the record to scratch.</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  var el = {
    deck: root.querySelector(".deck"),
    wrap: root.querySelector(".platter-wrap"),
    platter: root.querySelector(".platter"),
    record: root.querySelector(".record"),
    labelSide: root.querySelector(".record__side"),
    labelTitle: root.querySelector(".record__title"),
    labelArtist: root.querySelector(".record__artist"),
    armRot: root.querySelector(".arm-rot"),
    armShadowRot: root.querySelector(".arm-rot-shadow"),
    armShadowPos: root.querySelector(".arm-shadow-pos"),
    pitch: root.querySelector(".pitch__input"),
    pitchOut: root.querySelector(".pitch__readout"),
    pitchReset: root.querySelector(".pitch__reset-btn"),
    pitchLed: root.querySelector(".pitch__reset-btn .led"),
    lcdGlyph: root.querySelector(".lcd__glyph"),
    lcdStatus: root.querySelector(".lcd__status-text"),
    lcdCode: root.querySelector(".lcd__code"),
    lcdTitle: root.querySelector(".lcd__title"),
    lcdArtist: root.querySelector(".lcd__artist"),
    lcdTime: root.querySelector(".lcd__time"),
    lcdMeta: root.querySelector(".lcd__meta"),
    lcdMeta2: root.querySelector(".lcd__meta2"),
    start: root.querySelector(".tbtn--start"),
    startLed: root.querySelector(".tbtn--start .led"),
    prev: root.querySelector(".tbtn--prev"),
    next: root.querySelector(".tbtn--next"),
    eject: root.querySelector(".tbtn--eject"),
    mute: root.querySelector(".tbtn--mute"),
    pads: Array.prototype.slice.call(root.querySelectorAll(".pad"))
  };

  /* ---------- state ---------- */
  var S = {
    index: -1,
    motorOn: false,
    armDown: false,        // needle in the groove
    lifted: true,          // cue lever up (arm shadow far)
    pitch: 0,
    elapsed: 0,
    armAngle: REST_ANGLE,
    armTarget: REST_ANGLE,
    platterAngle: 0,
    platterOmega: 0,       // deg/s
    recordAngle: 0,
    recordOmega: 0,
    holding: false,
    fling: false,
    seq: 0
  };
  var armWaiters = [];

  function current() { return S.index >= 0 ? tracks[S.index] : null; }
  function rpm() {
    var t = current();
    var bpm = t && +t.bpm > 0 ? +t.bpm : 110;
    return 33.333 * (bpm / 110) * (1 + S.pitch / 100);
  }

  /* ---------- sound (Web Audio, synthesized, quiet) ---------- */
  var audio = { ctx: null, on: true, unlocked: false, noise: null };
  try { if (window.localStorage.getItem("deck:sound") === "off") audio.on = false; } catch (e) { /* storage blocked */ }
  function ctx() {
    if (!audio.on || !audio.unlocked) return null;
    if (!audio.ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { audio.ctx = new C(); } catch (e) { return null; }
    }
    if (audio.ctx.state === "suspended") { try { audio.ctx.resume(); } catch (e) { /* ignore */ } }
    return audio.ctx;
  }
  function noiseBuffer(c) {
    if (audio.noise) return audio.noise;
    var len = Math.floor(c.sampleRate * 0.5), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    audio.noise = buf;
    return buf;
  }
  function envGain(c, peak, attack, decay, t0) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    g.connect(c.destination);
    return g;
  }
  function sfxClick() {
    var c = ctx(); if (!c) return;
    var t = c.currentTime, o = c.createOscillator();
    o.type = "square"; o.frequency.setValueAtTime(2100, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.02);
    o.connect(envGain(c, 0.018, 0.002, 0.03, t)); o.start(t); o.stop(t + 0.05);
  }
  function sfxNoise(freq, type, peak, dur, delay) {
    var c = ctx(); if (!c) return;
    var t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter();
    s.buffer = noiseBuffer(c); f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
    s.connect(f); f.connect(envGain(c, peak, 0.004, dur, t)); s.start(t); s.stop(t + dur + 0.05);
  }
  function sfxDrop() {
    var c = ctx(); if (!c) return;
    var t = c.currentTime, o = c.createOscillator();
    o.type = "sine"; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    o.connect(envGain(c, 0.09, 0.004, 0.16, t)); o.start(t); o.stop(t + 0.22);
    sfxNoise(1400, "bandpass", 0.05, 0.12);
    sfxNoise(3200, "highpass", 0.012, 0.05, 0.16);
    sfxNoise(3200, "highpass", 0.009, 0.04, 0.42);
  }
  function sfxLift() { sfxNoise(2400, "highpass", 0.02, 0.06); }
  function unlock() { audio.unlocked = true; }

  /* ---------- rendering ---------- */
  function setLabel(t, i) {
    var color = t ? validColor(t.color) : "";
    if (color) {
      el.deck.style.setProperty("--track-color", color);
      el.deck.style.setProperty("--label-ink", inkFor(color));
    } else {
      el.deck.style.removeProperty("--track-color");
      el.deck.style.removeProperty("--label-ink");
    }
    el.labelSide.textContent = t ? "Side " + String(t.side || "A").toUpperCase() + " · " + codes[i] : "";
    el.labelTitle.textContent = t ? t.title || "" : "";
    el.labelArtist.textContent = t ? t.artist || "" : "";
    el.deck.classList.toggle("is-empty", !t);
  }

  var lastSecond = -1;
  function renderLCD() {
    var t = current();
    if (!t) {
      el.lcdGlyph.className = "lcd__glyph lcd__glyph--idle";
      el.lcdStatus.textContent = "Standby";
      el.lcdCode.textContent = sides.length ? "Side " + sides.join("/") : "";
      el.lcdTitle.innerHTML = "Pick a record<span class=\"lcd__cursor\" aria-hidden=\"true\"></span>";
      el.lcdArtist.textContent = pad2(tracks.length) + " tracks loaded";
      el.lcdTime.textContent = "--:--";
      el.lcdMeta.textContent = "Press a pad below";
      el.lcdMeta2.textContent = "";
      lastSecond = -1;
      return;
    }
    var playing = S.motorOn;
    el.lcdGlyph.className = "lcd__glyph " + (playing ? "lcd__glyph--play" : "lcd__glyph--stop");
    el.lcdStatus.textContent = playing ? "Now playing" : "Paused";
    el.lcdCode.textContent = codes[S.index];
    el.lcdTitle.textContent = t.title || "";
    el.lcdArtist.textContent = t.artist || "";
    var bpm = +t.bpm > 0 ? (+t.bpm * (1 + S.pitch / 100)).toFixed(1) : "";
    el.lcdMeta.textContent = bpm ? "BPM " + bpm : "";
    el.lcdMeta2.textContent = t.year ? String(t.year) : "";
    renderTime(true);
  }
  function renderTime(force) {
    if (S.index < 0) return;
    var s = Math.floor(S.elapsed);
    if (!force && s === lastSecond) return;
    lastSecond = s;
    el.lcdTime.textContent = pad2(Math.floor(s / 60) % 100) + ":" + pad2(s % 60);
  }
  function renderPads() {
    el.pads.forEach(function (p, i) { p.setAttribute("aria-pressed", i === S.index ? "true" : "false"); });
  }
  function renderTransport() {
    el.start.setAttribute("aria-pressed", S.motorOn ? "true" : "false");
    el.start.setAttribute("aria-label", S.motorOn ? "Stop the platter" : "Start the platter");
    el.startLed.classList.toggle("is-on", S.motorOn);
    el.mute.setAttribute("aria-pressed", audio.on ? "true" : "false");
  }
  function renderPitch() {
    var p = S.pitch;
    var txt = (p > 0 ? "+" : p < 0 ? "−" : "+") + Math.abs(p).toFixed(1);
    el.pitchOut.textContent = txt;
    el.pitch.setAttribute("aria-valuetext", (p > 0 ? "+" : p < 0 ? "minus " : "") + Math.abs(p).toFixed(1) + " percent");
    el.pitchLed.classList.toggle("is-on", p === 0);
  }
  function renderAll() { renderLCD(); renderPads(); renderTransport(); renderPitch(); }

  function applyTransforms() {
    el.platter.style.transform = "rotate(" + (S.platterAngle % 360).toFixed(2) + "deg)";
    el.record.style.transform = "rotate(" + (S.recordAngle % 360).toFixed(2) + "deg)";
    var rot = "rotate(" + S.armAngle.toFixed(3) + " " + PIVOT.x + " " + PIVOT.y + ")";
    el.armRot.setAttribute("transform", rot);
    el.armShadowRot.setAttribute("transform", rot);
    el.armShadowPos.setAttribute("transform", S.lifted ? "translate(2.4 3.4)" : "translate(.9 1.3)");
  }

  /* ---------- animation loop ---------- */
  var raf = 0, lastTs = 0;
  function kick() { if (!raf) { lastTs = 0; raf = requestAnimationFrame(frame); } }
  function frame(ts) {
    raf = 0;
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 1 / 60;
    lastTs = ts;
    var busy = false, rm = reduced();

    // motor: direct drive gets up to speed in well under a second, brakes a little slower
    var target = S.motorOn && !rm ? rpm() * 6 : 0;
    if (rm) S.platterOmega = target;
    else {
      var acc = (S.motorOn ? 620 : 420) * dt, diff = target - S.platterOmega;
      S.platterOmega += clamp(diff, -acc, acc);
    }
    S.platterAngle += S.platterOmega * dt;
    if (!S.holding) {
      if (rm) S.recordOmega = S.platterOmega;
      else {
        var k = S.motorOn ? 7 : (S.fling ? 0.9 : 12);   // slipmat grip; a flicked record coasts down slowly
        S.recordOmega += (S.platterOmega - S.recordOmega) * Math.min(1, k * dt);
        if (S.fling && Math.abs(S.recordOmega - S.platterOmega) < 2) S.fling = false;
      }
      S.recordAngle += S.recordOmega * dt;
    }
    if (Math.abs(S.platterOmega) > 0.01 || Math.abs(S.recordOmega - S.platterOmega) > 0.5 || S.motorOn) busy = true;
    if (!S.motorOn && Math.abs(S.recordOmega) < 0.5 && Math.abs(S.platterOmega) < 0.01) { S.recordOmega = 0; S.platterOmega = 0; }

    // playback clock + needle drift toward the run-out groove
    if (S.motorOn && S.armDown) {
      S.elapsed += dt * (1 + S.pitch / 100);
      var r = R_OUT - (R_OUT - R_IN) * Math.min(1, S.elapsed / DRIFT_SECONDS);
      S.armTarget = S.armAngle = angleForRadius(r);
      renderTime(false);
      busy = true;
    }

    // tonearm swing
    if (!S.armDown) {
      var d = S.armTarget - S.armAngle;
      if (rm || Math.abs(d) < 0.12) S.armAngle = S.armTarget;
      else {
        var step = Math.sign(d) * Math.min(Math.abs(d), Math.max(6 * dt, Math.min(Math.abs(d) * 4.5 * dt, 75 * dt)));
        S.armAngle += step;
        busy = true;
      }
      if (S.armAngle === S.armTarget && armWaiters.length) {
        var w = armWaiters; armWaiters = [];
        w.forEach(function (fn) { fn(); });
      }
    }

    applyTransforms();
    if (busy || S.holding || armWaiters.length) raf = requestAnimationFrame(frame);
  }

  function moveArm(angle) {
    S.armTarget = angle;
    return new Promise(function (resolve) {
      armWaiters.push(resolve);
      kick();
    });
  }
  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, reduced() ? 0 : ms); });
  }

  /* ---------- actions ---------- */
  function writeHash(id) {
    try {
      var url = id ? "#" + encodeURIComponent(id) : location.pathname + location.search;
      history.replaceState(history.state, "", url);
    } catch (e) { /* file:// or sandboxed: ignore */ }
  }
  function readHash() {
    var h = (location.hash || "").replace(/^#/, "");
    try { h = decodeURIComponent(h); } catch (e) { /* keep raw */ }
    return h;
  }
  function announce(id) {
    document.dispatchEvent(new CustomEvent("deck:select", { detail: { id: id } }));
  }

  function select(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= tracks.length) return;
    var t = tracks[i];
    if (i === S.index) {
      if (!S.motorOn) { S.motorOn = true; renderAll(); kick(); }
      return;
    }
    var hadRecord = S.index >= 0;
    var wasDown = S.armDown || S.armTarget !== REST_ANGLE;
    var my = ++S.seq;

    S.index = i;
    S.elapsed = 0;
    writeHash(t.id);
    renderPads();
    announce(t.id);

    var rm = reduced();
    if (rm) {
      // no animation: everything lands instantly
      setLabel(t, i);
      S.armDown = true; S.lifted = false; S.motorOn = true;
      S.armAngle = S.armTarget = angleForRadius(R_OUT);
      renderAll(); applyTransforms(); kick();
      if (opts.gesture) sfxDrop();
      return;
    }

    renderLCD();
    var chain = Promise.resolve();
    if (hadRecord && wasDown) {
      // lift, swing home, swap the record
      chain = chain.then(function () {
        S.armDown = false; S.lifted = true; applyTransforms();
        if (opts.gesture) sfxLift();
        return moveArm(REST_ANGLE);
      });
    }
    chain.then(function () {
      if (my !== S.seq) return;
      if (hadRecord) {
        el.deck.classList.add("is-swapping");
        return wait(200).then(function () {
          if (my !== S.seq) return;
          setLabel(t, i);
          el.deck.classList.remove("is-swapping");
        });
      }
      setLabel(t, i);
    }).then(function () {
      if (my !== S.seq) return;
      S.motorOn = true; renderAll(); kick();
      S.armDown = false; S.lifted = true;
      return moveArm(angleForRadius(R_OUT));
    }).then(function () {
      if (my !== S.seq) return;
      return wait(140);
    }).then(function () {
      if (my !== S.seq) return;
      S.lifted = false; S.armDown = true; applyTransforms();
      if (opts.gesture) sfxDrop();
      kick();
    });
  }

  function doEject() {
    var had = S.index >= 0;
    var my = ++S.seq;
    S.index = -1;
    S.motorOn = false;
    S.elapsed = 0;
    S.armDown = false;
    S.lifted = true;
    writeHash("");
    renderAll();
    if (reduced()) {
      S.armAngle = S.armTarget = REST_ANGLE;
      setLabel(null, -1);
      applyTransforms();
      return;
    }
    kick();
    moveArm(REST_ANGLE).then(function () {
      if (my !== S.seq) return;
      S.lifted = false; applyTransforms();
      if (had) return wait(150).then(function () { if (my === S.seq) setLabel(null, -1); });
      setLabel(null, -1);
    });
  }

  function step(dir) {
    if (!tracks.length) return;
    var i = S.index < 0 ? (dir > 0 ? 0 : tracks.length - 1) : (S.index + dir + tracks.length) % tracks.length;
    select(i, { gesture: true });
    focusPad(i, false);
  }

  function focusPad(i, move) {
    el.pads.forEach(function (p, j) { p.tabIndex = j === i ? 0 : -1; });
    if (move && el.pads[i]) el.pads[i].focus();
  }

  /* ---------- wiring ---------- */
  root.addEventListener("pointerdown", unlock, true);
  root.addEventListener("keydown", unlock, true);

  // On one-column layouts the sleeve sits below the deck, so after the needle drops,
  // bring it into view; otherwise a pad press looks like it only changed the deck.
  var revealTimer = 0;
  function revealPanel() {
    var panel = document.getElementById("panel");
    if (!panel || !window.matchMedia("(max-width: 960px)").matches) return;
    clearTimeout(revealTimer);
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    revealTimer = setTimeout(function () {
      if (panel.getBoundingClientRect().top < window.innerHeight * 0.6) return;
      panel.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    }, still ? 0 : 1100);
  }

  el.pads.forEach(function (p, i) {
    p.addEventListener("click", function () {
      sfxClick();
      focusPad(i, false);
      select(i, { gesture: true });
      revealPanel();
    });
    p.addEventListener("keydown", function (e) {
      var n = el.pads.length, j = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % n;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j >= 0) { e.preventDefault(); focusPad(j, true); }
    });
  });

  el.start.addEventListener("click", function () {
    sfxClick();
    if (S.index < 0) { if (tracks.length) { select(0, { gesture: true }); focusPad(0, false); } return; }
    S.motorOn = !S.motorOn;
    renderAll();
    kick();
  });
  el.prev.addEventListener("click", function () { sfxClick(); step(-1); });
  el.next.addEventListener("click", function () { sfxClick(); step(1); });
  el.eject.addEventListener("click", function () {
    sfxClick();
    document.dispatchEvent(new CustomEvent("deck:eject", { detail: {} }));
  });
  el.mute.addEventListener("click", function () {
    audio.on = !audio.on;
    try { window.localStorage.setItem("deck:sound", audio.on ? "on" : "off"); } catch (e) { /* ignore */ }
    renderTransport();
    sfxClick();
  });

  function setPitch(v) {
    S.pitch = Math.round(clamp(+v || 0, -8, 8) * 10) / 10;
    if (Math.abs(S.pitch) < 0.15) S.pitch = 0;   // light detent at zero
    renderPitch();
    if (S.index >= 0) renderLCD();
    kick();
  }
  el.pitch.addEventListener("input", function () { setPitch(el.pitch.value); });
  el.pitchReset.addEventListener("click", function () { sfxClick(); el.pitch.value = "0"; setPitch(0); });

  // scratching: grab the record and drag it around the spindle
  var grab = null;
  function pointerAngle(e) {
    var r = el.wrap.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  }
  el.wrap.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (S.index < 0) return;   // nothing on the platter to scratch
    grab = { id: e.pointerId, ang: pointerAngle(e), t: performance.now() };
    S.holding = true;
    S.recordOmega = 0;
    el.wrap.classList.add("is-holding");
    try { el.wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    kick();
  });
  el.wrap.addEventListener("pointermove", function (e) {
    if (!grab || e.pointerId !== grab.id) return;
    var a = pointerAngle(e), now = performance.now();
    var d = a - grab.ang;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    var dt = Math.max(1, now - grab.t) / 1000;
    S.recordAngle += d;
    S.recordOmega = S.recordOmega * 0.5 + (d / dt) * 0.5;
    grab.ang = a; grab.t = now;
    if (Math.abs(d) > 4) sfxNoise(600 + Math.min(3000, Math.abs(d / dt) * 2), "bandpass", 0.012, 0.04);
  });
  function release(e) {
    if (!grab || (e && e.pointerId !== grab.id)) return;
    var stale = performance.now() - grab.t > 80;   // held still before letting go: no flick
    grab = null;
    S.holding = false;
    if (reduced() || stale || (e && e.type === "pointercancel")) S.recordOmega = S.platterOmega;
    S.recordOmega = clamp(S.recordOmega, -2400, 2400);
    S.fling = Math.abs(S.recordOmega - S.platterOmega) > 30;
    el.wrap.classList.remove("is-holding");
    kick();
  }
  el.wrap.addEventListener("pointerup", release);
  el.wrap.addEventListener("pointercancel", release);
  el.wrap.addEventListener("lostpointercapture", release);

  // contract events
  document.addEventListener("deck:eject", doEject);

  var initialDone = false;
  function applyInitialHash() {
    if (initialDone) return;
    initialDone = true;
    var i = indexOf(readHash());
    if (i >= 0) { select(i, { gesture: false }); focusPad(i, false); }
  }
  document.addEventListener("panel:ready", function () {
    if (!initialDone) applyInitialHash();
    else if (S.index >= 0) announce(tracks[S.index].id);   // panel rendered late: tell it what is playing
  });
  function fallback() { setTimeout(applyInitialHash, 50); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fallback);
  else fallback();

  window.addEventListener("hashchange", function () {
    var i = indexOf(readHash());
    if (i >= 0 && i !== S.index) { select(i, { gesture: false }); focusPad(i, false); }
  });

  if (mq && mq.addEventListener) mq.addEventListener("change", function () { kick(); });

  // first paint
  setLabel(null, -1);
  renderAll();
  applyTransforms();
})();
