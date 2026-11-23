/* Alif Enterprise — site behaviour */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* year */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* smooth scroll */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    window.__lenis = lenis;
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2 || id.charAt(1) === "/") return;
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      ev.preventDefault();
      lenis.scrollTo(t, { offset: -90 });
    });
  }

  /* header shadow */
  var header = $(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* mobile nav */
  var toggle = $(".nav-toggle"), nav = $("#nav");
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") setNav(false); });
  }

  /* counters */
  var countUp = function (el) {
    var end = parseFloat(el.getAttribute("data-count")), pad = parseInt(el.getAttribute("data-pad") || "0", 10);
    if (reduce || isNaN(end)) return;
    var start = null, dur = 1400;
    var step = function (t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = String(v).padStart(pad, "0");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* numbers bento: entrance, 3D tilt + glare, photo parallax, ruler magnifier */
  $$(".bento").forEach(function (bt) {
    var tiles = $$(".tile", bt);
    if ("IntersectionObserver" in window && !reduce) {
      var bio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { bt.classList.add("in"); bio.disconnect(); }
      }, { threshold: .2 });
      bio.observe(bt);
    } else bt.classList.add("in");
    var chips = $$(".chip", bt), ci = -1, chipHeld = false, seen = false;
    if (chips.length && !reduce) {
      new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }, { threshold: .1 }).observe(bt);
      chips.forEach(function (ch) {
        ch.addEventListener("mouseenter", function () { chipHeld = true; chips.forEach(function (x) { x.classList.remove("on"); }); });
        ch.addEventListener("mouseleave", function () { chipHeld = false; });
      });
      setTimeout(function () {
        setInterval(function () {
          if (chipHeld || !seen || document.hidden) return;
          ci = (ci + 1) % chips.length;
          chips.forEach(function (x, k) { x.classList.toggle("on", k === ci); });
        }, 1500);
      }, 1800);
    }
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    tiles.forEach(function (t) {
      var raf = 0, ev = null, ticks = $$(".ruler i", t);
      var paint = function () {
        raf = 0;
        var r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        var k = t.classList.contains("t-big") ? 5 : 7;
        t.style.setProperty("--ry", ((x - .5) * k).toFixed(2) + "deg");
        t.style.setProperty("--rx", ((.5 - y) * k).toFixed(2) + "deg");
        t.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (ticks.length) {
          var rr = ticks[0].parentNode.getBoundingClientRect(), cx = ev.clientX;
          ticks.forEach(function (i) {
            var ir = i.getBoundingClientRect(), d = Math.abs(ir.left - cx) / rr.width;
            i.style.setProperty("--s", (1 + Math.max(0, 1 - d * 5) * 1.6).toFixed(2));
            i.style.background = d < .06 ? "var(--blue)" : "";
          });
        }
      };
      t.addEventListener("pointerenter", function () { t.classList.add("hot"); });
      t.addEventListener("pointermove", function (e) { ev = e; if (!raf) raf = requestAnimationFrame(paint); });
      t.addEventListener("pointerleave", function () {
        t.classList.remove("hot");
        ["--rx", "--ry"].forEach(function (v) { t.style.setProperty(v, "0deg"); });
        t.style.setProperty("--mx", "50%"); t.style.setProperty("--my", "50%");
        ticks.forEach(function (i) { i.style.setProperty("--s", "1"); i.style.background = ""; });
      });
    });
  });

  /* industry cards: 3D tilt + glow that follows the cursor */
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    $$(".industry, .feature.fx").forEach(function (t) {
      var raf = 0, ev = null;
      var paint = function () {
        raf = 0;
        var r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        t.style.setProperty("--ry", ((x - .5) * 9).toFixed(2) + "deg");
        t.style.setProperty("--rx", ((.5 - y) * 9).toFixed(2) + "deg");
        t.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      };
      t.addEventListener("pointerenter", function () { t.classList.add("hot"); });
      t.addEventListener("pointermove", function (e) { ev = e; if (!raf) raf = requestAnimationFrame(paint); });
      t.addEventListener("pointerleave", function () {
        t.classList.remove("hot"); t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* vision icon: the eye looks toward the cursor */
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    var eyes = $$(".mi-eye"), eRaf = 0, eEv = null;
    if (eyes.length) {
      var look = function () {
        eRaf = 0;
        eyes.forEach(function (e) {
          var r = e.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          var dx = eEv.clientX - (r.left + r.width / 2), dy = eEv.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
          e.style.setProperty("--ex", (dx / d * 3.2 * k).toFixed(2) + "px");
          e.style.setProperty("--ey", (dy / d * 2.2 * k).toFixed(2) + "px");
        });
      };
      window.addEventListener("pointermove", function (ev) { eEv = ev; if (!eRaf) eRaf = requestAnimationFrame(look); }, { passive: true });
    }
  }


  /* process stepper: auto-advances while in view, click/keys to choose */
  var proc = $("[data-proc]");
  if (proc) {
    // own names: this file also declares `tabs` for the home service tabs
    var pTabs = $$(".proc-step", proc), pViews = $$(".proc-view", proc), pIdx = 0, pTimer = 0, pVis = false, pHeld = false, PD = 6000;
    var pSet = function (k, focus) {
      pIdx = k;
      proc.style.setProperty("--i", k);
      pTabs.forEach(function (t, i) { var on = i === k; t.classList.toggle("on", on); t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
      pViews.forEach(function (v, i) { var on = i === k; v.classList.toggle("on", on); v.hidden = !on; });
      // restart the bar animation
      var bar = $(".proc-bar i", pTabs[k]); if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      if (focus) pTabs[k].focus();
      var row = $(".proc-steps", proc);
      if (row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: pTabs[k].offsetLeft - 8, behavior: reduce ? "auto" : "smooth" });
      pQueue();
    };
    var pQueue = function () {
      clearTimeout(pTimer);
      if (reduce || !pVis || pHeld) { proc.classList.remove("run"); return; }
      proc.classList.add("run");
      pTimer = setTimeout(function () { pSet((pIdx + 1) % pTabs.length); }, PD);
    };
    pTabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pSet(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); pSet((i + (e.key === "ArrowRight" ? 1 : pTabs.length - 1)) % pTabs.length, true); }
      });
    });
    proc.addEventListener("pointerenter", function () { pHeld = true; proc.classList.add("paused"); clearTimeout(pTimer); });
    proc.addEventListener("pointerleave", function () { pHeld = false; proc.classList.remove("paused"); pSet(pIdx); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { pVis = en[0].isIntersecting; if (pVis) pSet(pIdx); else { clearTimeout(pTimer); proc.classList.remove("run"); } }, { threshold: .35 }).observe(proc);
    }
  }

  /* copy-to-clipboard buttons */
  $$("[data-copy]").forEach(function (b) {
    var label = b.textContent;
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "Copied"; b.classList.add("done"); setTimeout(function () { b.textContent = label; b.classList.remove("done"); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute("data-copy")).then(done, function () {}); else done();
    });
  });


  /* chat assistant: answers from the site's own content, hands off to the team */
  var bot = $("#bot"), botData = $("#bot-data");
  if (bot && botData) (function () {
    var D = JSON.parse(botData.textContent);
    var BUNDLE = !!document.querySelector("[data-page]");
    var url = function (page, anchor, q) {
      if (BUNDLE) return "#/" + page + (anchor ? "/" + anchor : "") + (q ? "?" + q : "");
      return page + ".html" + (q ? "?" + q : "") + (anchor ? "#" + anchor : "");
    };
    var fab = $("#bot-fab"), panel = $("#bot-panel"), log = $("#bot-log"), quick = $("#bot-quick"), form = $("#bot-form"), input = $("#bot-in"), hint = $("#bot-hint");
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    var KEY = "alif-bot-v1";
    var load = function () { try { return JSON.parse(sessionStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } };
    var saved = load(), hist = saved.h || [];
    var save = function (extra) { try { var o = load(); o.h = hist; for (var k in extra) o[k] = extra[k]; sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
    var MAIL = '<a href="mailto:' + D.email + '">' + D.email + "</a>";
    var link = function (href, label) { return '<a href="' + href + '">' + esc(label) + "</a>"; };
    var acts = function () { return '<div class="bacts">' + Array.prototype.slice.call(arguments).join("") + "</div>"; };

    var add = function (who, html, keep) {
      var m = document.createElement("div"); m.className = "bm " + (who === "bot" ? "bm-a" : "bm-u"); m.innerHTML = html; log.appendChild(m);
      // long assistant replies: show their start, not their end
      log.scrollTop = who === "bot" && m.offsetHeight > log.clientHeight * .6 ? m.offsetTop - 12 : log.scrollHeight;
      if (keep !== false) { hist.push({ w: who, h: html }); if (hist.length > 40) hist = hist.slice(-40); save(); }
    };
    var setChips = function (list) {
      quick.innerHTML = "";
      (list || []).forEach(function (c, i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "bq"; b.textContent = c.label; b.style.animationDelay = i * 40 + "ms";
        b.addEventListener("click", function () { ask(c.label, c.go); });
        quick.appendChild(b);
      });
    };
    var busy = false;
    var respond = function (r) {
      busy = true;
      var t = document.createElement("div"); t.className = "bm bm-a typing"; t.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(t); log.scrollTop = log.scrollHeight;
      setTimeout(function () { t.remove(); add("bot", r.html); setChips(r.chips || MAIN()); busy = false; }, reduce ? 0 : 420 + Math.min(700, r.html.length * 2));
    };
    var ask = function (text, go) {
      if (busy) return;
      add("me", esc(text)); setChips([]);
      respond(go ? go() : answer(text));
    };

    /* ---- answers */
    var svcCard = function (s) {
      return '<div class="bcard"><span class="btag">' + esc(s.cat) + "</span><b>" + esc(s.title) + "</b><p>" + esc(s.desc) + "</p><ul>" +
        s.scope.slice(0, 4).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
        acts(link(url("services", s.id), "Read more"), link(url("contact", null, "service=" + encodeURIComponent(s.title)), "Get a quote")) + "</div>";
    };
    var group = function (id) { return D.groups.filter(function (g) { return g.id === id; })[0]; };
    var rService = function (s, lead) {
      lastSvc = s;
      return { html: (lead || "Here is how we handle <b>" + esc(s.title) + "</b>:") + svcCard(s),
        chips: [{ label: "Get a quote", go: function () { return rQuoteFor(s); } }, { label: "Related services", go: function () { return rGroup(s.group); } }, { label: "Something else", go: rServices }] };
    };
    var rServices = function rServices() {
      return { html: "We cover " + D.services.length + " services in five areas, from the rack to the app. Which area are you interested in?",
        chips: D.groups.map(function (g) { return { label: g.name, go: function () { return rGroup(g.id); } }; }) };
    };
    var rGroup = function (id) {
      var g = group(id), list = D.services.filter(function (s) { return s.group === id; });
      return { html: "<b>" + esc(g.name) + "</b> covers " + list.map(function (s) { return esc(s.title); }).join(", ") + ". Pick one for the details.",
        chips: list.map(function (s) { return { label: s.title, go: function () { return rService(s); } }; }).concat([{ label: "Other areas", go: rServices }]) };
    };
    var rQuote = function () {
      return { html: "Happy to help. Send your site location, scope and timeline and the team will come back with a proposed scope and team." +
        acts(link(url("contact"), "Open the enquiry form"), '<a href="mailto:' + D.email + '?subject=Quote%20request">Email the team</a>') +
        "<br>Or tell me which area it is for:", chips: D.groups.map(function (g) { return { label: g.name, go: function () { return rGroup(g.id); } }; }) };
    };
    var rQuoteFor = function (s) {
      return { html: "The enquiry form will open with <b>" + esc(s.title) + "</b> already selected. Add your site location, scope and timeline." +
        acts(link(url("contact", null, "service=" + encodeURIComponent(s.title)), "Request a quote"), '<a href="mailto:' + D.email + "?subject=" + encodeURIComponent("Quote: " + s.title) + '">Email instead</a>') };
    };
    var rBrands = function rBrands() {
      return { html: "We are a <b>registered partner</b> of 12 vendors: Cisco, Huawei, Fortinet, H3C, Dell, HP, Lenovo, Samsung, Hikvision, Dahua, Hytera and Motorola. We are not a distributor for any brand." +
        acts(link(url("partners"), "See all partners"), link(url("contact"), "Ask about a product")) };
    };
    var rWhere = function () {
      return { html: "Our office is at <b>" + esc(D.address) + "</b> You can also call sales on <a href=\"tel:" + D.phone + "\">" + esc(D.phoneText) + "</a>." +
        acts('<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(D.mapq) + '" target="_blank" rel="noopener">Open in Maps</a>', link(url("contact"), "Contact page")) };
    };
    var rHuman = function () {
      return { html: "The sales team reads every message. Call or WhatsApp <a href=\"tel:" + D.phone + "\">" + esc(D.phoneText) + "</a>, email " + MAIL + ", or use the enquiry form. Include your site location and what you need, and they will reply with next steps." +
        acts('<a href="tel:' + D.phone + '">Call sales</a>', '<a href="mailto:' + D.email + '">Email sales</a>', link(url("contact"), "Enquiry form")) };
    };
    var rInstall = function rInstall() { return { html: "Both. We handle consulting, design, supply, installation and commissioning with our own engineers and technicians, so one team is responsible from the first survey to handover." }; };
    var rSupport = function rSupport() {
      var s = D.services.filter(function (x) { return x.id === "managed"; })[0];
      return rService(s, "Yes. After go-live our managed IT services cover monitoring, maintenance and help desk, beyond what a standard SLA covers.");
    };
    var rTeam = function rTeam() { return { html: "80% of our people are engineers and technicians, including Cisco CCNA and CCNP professionals and data-center-certified engineers, across electrical, electronics, networking and telecom." + acts(link(url("about"), "About the team")) }; };
    var lastSvc = null;
    var rJobs = function () { return { html: "I don't have details on open roles. Please email " + MAIL + " with your CV and the role you are interested in." }; };
    var TEL = '<a href="tel:' + D.phone + '">' + esc(D.phoneText) + "</a>";
    var CALL = '<a href="tel:' + D.phone + '">Call sales</a>';
    var svc = function (id) { return D.services.filter(function (x) { return x.id === id; })[0]; };
    var rAbout = function () {
      return { html: "<b>Alif Enterprise</b> is an engineering firm for IT and industrial automation, not a reseller. One team handles consulting, design, supply, installation and support across " + D.services.length +
        " services, from data centers, fiber and surveillance to custom software and AI.<ul class=\"bfacts\"><li><b>10+</b> years delivering projects</li><li><b>80%</b> of the team are engineers and technicians</li><li><b>12</b> registered vendor partners</li><li>Office in Dubai, U.A.E.</li></ul>" +
        acts(link(url("about"), "About us"), link(url("services"), "All services")),
        chips: [{ label: "What do you do?", go: rServices }, { label: "Who have you worked with?", go: rClients }, { label: "How do you work?", go: rProcess }] };
    };
    var rYears = function () { return { html: "We have been delivering projects for <b>more than 10 years</b>, with a team that is 80% engineers and technicians." + acts(link(url("about"), "Our story")) }; };
    var rSectors = function () {
      return { html: "We work across six sectors:<ul class=\"bfacts\"><li><b>Government & safe city</b>: surveillance, control rooms, secure networks</li><li><b>Telecom operators</b>: towers, LTE, radio links and long-haul fiber</li><li><b>Energy & utilities</b>: automation, UPS, rectifiers and solar PV</li><li><b>Healthcare & labs</b>: networks, storage and secure data</li><li><b>Construction & real estate</b>: cabling, CCTV and building networks</li><li><b>Enterprise</b>: data centers, cloud, managed IT and software</li></ul>",
        chips: [{ label: "Who have you worked with?", go: rClients }, { label: "Get a quote", go: rQuote }, { label: "What do you do?", go: rServices }] };
    };
    var rClients = function () {
      return { html: "Clients include <b>Mobily, TXU Energy, Health TrackRx, AIT Laboratories, Paragon Developers, GFS Builders & Developers</b> and <b>Safe City</b>, across enterprise, telecom, healthcare, construction and the public sector." +
        acts(link(url("partners"), "Partners & clients"), link(url("contact"), "Ask for references")) };
    };
    var rProcess = function () {
      return { html: "Every project runs in five steps, with one team accountable throughout:<ol class=\"bfacts\"><li><b>Survey</b>: an engineer visits and maps what you have and need</li><li><b>Design</b>: sized for cost, availability and growth</li><li><b>Supply</b>: equipment sourced directly from vendor partners</li><li><b>Install</b>: our own technicians deploy, test and commission</li><li><b>Support</b>: maintenance, monitoring and help desk after go-live</li></ol>",
        chips: [{ label: "Book a site survey", go: rSurvey }, { label: "How long does it take?", go: rTime }, { label: "Get a quote", go: rQuote }] };
    };
    var rTime = function () { return { html: "It depends on the size of the site and the equipment involved. After the site survey, the engineers give you a schedule with the design. Share your deadline when you get in touch and the team will plan around it." + acts(link(url("contact"), "Share your timeline"), CALL) }; };
    var rSurvey = function () { return { html: "Every project starts with a site survey: an engineer measures the site and records the equipment already in place. To book one, send your location and what you need, or call " + TEL + "." + acts(link(url("contact", null, "service=Site%20survey"), "Book a survey"), CALL) }; };
    var rWarranty = function () { return { html: "Equipment we supply carries the vendor's warranty, and after go-live our managed IT services can cover monitoring, maintenance and help desk. The exact warranty and support terms are set out in your quote." + acts(link(url("services", "managed"), "Managed IT services"), link(url("contact"), "Ask about terms")) }; };
    var rPay = function () { return { html: "Payment terms are agreed per project and written into the quote. For specifics, talk to sales on " + TEL + " or at " + MAIL + "." }; };
    var rHours = function () { return { html: "Office hours aren't listed on this website. The fastest way to reach someone is to call or WhatsApp " + TEL + ", or email " + MAIL + "." + acts(CALL) }; };
    var rUrgent = function () { return { html: "If a system is down, call or WhatsApp the team right away on " + TEL + " so they can help directly. Clients on our managed IT services also get monitoring and help desk support." + acts(CALL, link(url("services", "managed"), "Managed IT services")) }; };
    var rCountries = function () { return { html: "Our office is at Meydan Grandstand in <b>Dubai, U.A.E.</b>, and we have delivered projects globally, including long-haul fiber along national highways. Tell the team where your site is and they will confirm how they can support it." + acts(link(url("contact"), "Tell us your location"), CALL) }; };
    var rSmall = function () { return { html: "Most of our work is for organisations: offices, hospitals, factories, telecom sites and cities. If you have a smaller site, send the details anyway and the team will tell you honestly whether it's a fit." + acts(link(url("contact"), "Send the details")) }; };
    var rWhy = function () { return { html: "Three reasons clients come back:<ul class=\"bfacts\"><li><b>One accountable team</b> from survey to support, with no hand-offs between subcontractors</li><li><b>Engineers, not salespeople</b>: 80% of our people are technical, with CCNA/CCNP and data-center-certified staff</li><li><b>Vendor-neutral</b>: registered partner of 12 vendors, so we recommend what fits your site, not what one brand sells</li></ul>" + acts(link(url("about"), "About us")) }; };
    var rMission = function () { return { html: "<b>Mission:</b> foster technological innovation, adaptation and deployment, so enterprises get the best global technology, installed properly.<br><b>Vision:</b> to be the ICT partner enterprises in every sector trust most.<br><b>Values:</b> integrity, customer satisfaction, continuous improvement, transparency and partnership." + acts(link(url("about"), "Read more")) }; };
    var rBot = function () { return { html: "I'm Alif's virtual assistant. I answer from what's on this website: our services, brands, sectors, process and how to reach the team. If I can't answer something, I'll pass your question to a person." }; };
    var rComplaint = function () { return { html: "I'm sorry to hear that. Please tell the team directly so they can put it right: call " + TEL + " or email " + MAIL + " with the project name and what went wrong." + acts(CALL, '<a href="mailto:' + D.email + '?subject=Feedback">Email the team</a>') }; };
    var rLang = function () { return { html: "I reply in English, but you're welcome to write to the sales team in the language you prefer at " + MAIL + "." }; };
    var rOff = function () { return { html: "That's outside what I can help with. I'm here for questions about Alif Enterprise: our services, brands, projects and how to reach the team. What can I help you with?" }; };
    var MAIN = function () {
      return [{ label: "What do you do?", go: rServices }, { label: "Get a quote", go: rQuote }, { label: "Brands you supply", go: rBrands },
              { label: "Where are you based?", go: rWhere }, { label: "Talk to a person", go: rHuman }];
    };

    /* knowledge base: each entry lists phrases (matched anywhere) and words (matched with typo tolerance) */
    var KB = [
      { w: "hi hello hey hiya salam assalam aoa salaam greetings yo", short: 3, r: function () { return { html: "Hello! How can I help you today? Ask about a service, a brand, a quote or anything about Alif Enterprise." }; } },
      { p: ["good morning", "good afternoon", "good evening"], short: 4, r: function () { return { html: "Hello! How can I help you today?" }; } },
      { p: ["how are you", "how r u", "how are u", "hows it going", "how is it going"], r: function () { return { html: "Doing well, thanks for asking. How can I help you today?" }; } },
      { w: "thank thanks thx shukria shukriya appreciate", r: function () { return { html: "You're welcome. Anything else I can help with?" }; } },
      { w: "bye goodbye cya", p: ["see you", "talk later", "that's all", "thats all", "nothing else"], r: function () { return { html: "Thanks for stopping by. If anything comes up, call " + TEL + " or email " + MAIL + "." }; } },
      { w: "ok okay cool great nice perfect awesome fine alright got", short: 2, r: function () { return { html: "Glad that helped. Anything else you'd like to know?" }; } },
      { p: ["are you human", "are you a bot", "are you real", "are you ai", "are you a robot", "who are you", "your name", "what are you", "chatgpt", "who made you", "who built you"], r: rBot },
      { p: ["about alif", "about your company", "about the company", "about you", "who is alif", "what is alif", "tell me about", "company profile", "who are alif", "introduce"], w: "background overview profile", r: rAbout },
      { p: ["how long have you", "how many years", "years of experience", "when were you", "since when"], w: "founded established experience history", r: rYears },
      { w: "sector sectors industry industries vertical verticals hospital hospitals healthcare government telecom operator operators utilities construction realestate", p: ["real estate", "safe city", "who do you serve", "what kind of clients"], r: rSectors },
      { w: "client clients customer customers portfolio references reference projects casestudy", p: ["case study", "worked with", "past projects", "previous projects", "work samples"], r: rClients },
      { w: "process steps methodology approach workflow", p: ["how do you work", "how does it work", "what happens after", "next steps"], r: rProcess },
      { w: "timeline duration deadline", p: ["how long", "how much time", "when can you", "how fast", "how soon"], r: rTime },
      { w: "survey consultation consult inspection assessment", p: ["site visit", "visit our site", "come to our site"], r: rSurvey },
      { w: "warranty guarantee guaranteed", r: rWarranty },
      { w: "payment payments invoice installments installment financing advance terms", p: ["pay in", "payment terms"], r: rPay },
      { w: "hours timing timings open opening closed weekend saturday sunday friday", p: ["working hours", "office hours", "what time"], r: rHours },
      { w: "urgent emergency outage broken", p: ["is down", "not working", "stopped working", "24/7", "24 7"], r: rUrgent },
      { w: "country countries uae dubai abudhabi sharjah saudi ksa qatar oman bahrain kuwait international abroad overseas pakistan gcc", p: ["abu dhabi", "outside", "which cities", "do you work in"], r: rCountries },
      { w: "home house residential personal villa apartment flat", p: ["small business", "small office", "just one camera"], r: rSmall },
      { w: "why better difference different advantage", p: ["why choose", "why should", "why alif", "what makes you", "unique"], r: rWhy },
      { w: "mission vision values", r: rMission },
      { w: "complaint complain unhappy disappointed issue", p: ["bad service", "not happy", "problem with"], r: rComplaint },
      { w: "urdu arabic hindi language languages", r: rLang },
      { w: "weather news football cricket recipe movie song lyrics joke bitcoin crypto stock stocks politics", r: rOff },
      { w: "job jobs career careers hiring vacancy vacancies internship cv resume", p: ["work for you", "join your team"], r: rJobs },
      { w: "quote quotation price pricing cost costs estimate budget rate rates proposal boq", p: ["how much"], r: function (ctx) { return ctx.best ? rQuoteFor(ctx.best) : ctx.last ? rQuoteFor(ctx.last) : rQuote(); }, boost: 1 },
      { w: "where located location address office map directions", p: ["based in", "find you"], r: rWhere },
      { w: "phone number call whatsapp contact email mail human person agent sales someone representative", p: ["speak to", "talk to"], r: rHuman },
      { w: "brand brands vendor vendors partner partners oem distributor cisco huawei dahua hikvision fortinet dell hp lenovo samsung motorola hytera h3c", r: rBrands },
      { w: "install installation installing deploy commissioning", p: ["supply only", "only supply"], r: rInstall },
      { w: "support maintenance amc helpdesk sla", p: ["after sales", "after-sales", "help desk", "after go live"], r: rSupport },
      { w: "certified certification certifications ccna ccnp engineer engineers team staff qualified iso", r: rTeam },
      { w: "service services offer offering provide capabilities solutions", p: ["what do you do", "what can you do", "what you do", "what does alif"], r: rServices }
    ];

    /* typo-tolerant word matching */
    var dist = function (a, b) {
      if (Math.abs(a.length - b.length) > 2) return 9;
      var prev = [], cur, i, j;
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {
        cur = [i];
        for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = cur;
      }
      return prev[b.length];
    };
    var wordHit = function (words, t, k) {
      if (k.length <= 3) return t.indexOf(" " + k + " ") > -1;          // short keys: whole word only
      if (t.indexOf(" " + k) > -1) return true;                          // prefix (camera → cameras)
      var tol = k.length >= 8 ? 2 : k.length >= 5 ? 1 : 0;
      return tol > 0 && words.some(function (w) { return w.length >= 4 && k.indexOf(w) !== 0 && dist(w, k) <= tol; });
    };
    var STOP = " and the for our with your build our from data services service solutions solution systems & ";
    var answer = function (raw) {
      var t = " " + raw.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9+\-/' ]/g, " ").replace(/\s+/g, " ") + " ";
      var words = t.trim().split(" ").filter(Boolean);
      // best service match
      var best = null, bestScore = 0;
      D.services.forEach(function (s) {
        var sc = 0, seen = {};
        s.keys.forEach(function (k) {
          if (k.length < 2 || seen[k] || STOP.indexOf(" " + k + " ") > -1) return;
          seen[k] = 1;
          if (wordHit(words, t, k.replace(/-/g, " ")) || (k.indexOf("-") > -1 && t.indexOf(" " + k) > -1)) sc += k.length > 3 ? 2 : 1;
        });
        if (sc > bestScore) { bestScore = sc; best = s; }
      });
      // best knowledge-base match
      var top = null, topScore = 0;
      KB.forEach(function (e, i) {
        if (e.short && words.length > e.short) return;
        var sc = 0;
        (e.p || []).forEach(function (p) { if (t.indexOf(" " + p) > -1) sc += 4; });
        (e.w || "").split(" ").forEach(function (k) { if (k && wordHit(words, t, k)) sc += 2; });
        if (sc) sc += (e.boost || 0) - i * 0.001;                          // earlier entries win ties
        if (sc > topScore) { topScore = sc; top = e; }
      });
      var ctx = { best: bestScore >= 2 || (bestScore === 1 && t.indexOf(" it ") < 0) ? best : null, last: lastSvc };
      // a clear service question wins unless the question is about price, place or people
      if (best && bestScore >= 2 && (!top || bestScore > Math.round(topScore) || (bestScore === Math.round(topScore) && /^(rServices|rInstall|rSupport|rTeam|rBrands)$/.test(top.r.name || "")))) {
        if (top && top.boost) return top.r(ctx);
        lastSvc = best; return rService(best);
      }
      if (top) return top.r(ctx);
      if (best) { lastSvc = best; return rService(best); }
      var q = encodeURIComponent(raw.slice(0, 300));
      return { html: "I can only answer questions about Alif Enterprise and our work, so I don't have an answer for that one. If it's about a project, I can pass your question straight to the sales team, or you can call " + TEL + "." +
          acts('<a href="mailto:' + D.email + '?subject=' + encodeURIComponent("Question from the website") + "&body=" + q + '">Send my question</a>', CALL),
        chips: [{ label: "What do you do?", go: rServices }, { label: "About Alif", go: rAbout }, { label: "Industries you serve", go: rSectors }, { label: "Get a quote", go: rQuote }] };
    };

    /* ---- open / close */
    var greeted = function () {
      if (log.children.length) return;
      if (hist.length) { hist.forEach(function (m) { add(m.w, m.h, false); }); setChips(MAIN()); return; }
      add("bot", "Hi there! I'm Alif's assistant. How can I help you today? Ask me about any of our " + D.services.length + " services, the brands we supply, our projects, or how to get a quote.");
      setChips(MAIN());
    };
    var open = function (focus) {
      hint.hidden = true; hint.classList.remove("show");
      panel.hidden = false; greeted();
      requestAnimationFrame(function () { bot.classList.add("open"); });
      fab.setAttribute("aria-expanded", "true"); fab.setAttribute("aria-label", "Close chat");
      save({ open: true, hinted: true });
      if (focus !== false) setTimeout(function () { input.focus({ preventScroll: true }); }, 250);
    };
    var close = function () {
      bot.classList.remove("open"); fab.setAttribute("aria-expanded", "false"); fab.removeAttribute("aria-label");
      save({ open: false });
      setTimeout(function () { if (!bot.classList.contains("open")) panel.hidden = true; }, reduce ? 0 : 320);
    };
    fab.addEventListener("click", function () { bot.classList.contains("open") ? close() : open(); });
    $("#bot-close").addEventListener("click", function () { close(); fab.focus(); });
    var hideHint = function () { hint.classList.remove("show"); setTimeout(function () { hint.hidden = true; }, reduce ? 0 : 300); };
    $(".bot-hint-open", hint).addEventListener("click", function () { open(); });
    $(".bot-hint-x", hint).addEventListener("click", function () { hideHint(); save({ dismissed: true }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && bot.classList.contains("open")) { close(); fab.focus(); } });
    $$("[data-open-bot]").forEach(function (b) { b.addEventListener("click", function () { open(); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim(); if (!v) return;
      input.value = ""; ask(v);
    });
    if (saved.open) open(false);
    else if (!saved.dismissed) {
      // greet once the page has actually finished loading, so the toast isn't missed
      var greet = function () {
        setTimeout(function () {
          if (bot.classList.contains("open")) return;
          hint.hidden = false; hint.classList.add("typing");
          requestAnimationFrame(function () { hint.classList.add("show"); });
          setTimeout(function () { hint.classList.remove("typing"); }, reduce ? 0 : 1100);
          setTimeout(function () { if (!bot.classList.contains("open") && !hint.hidden) hideHint(); }, 15000);
        }, reduce ? 600 : 1800);
      };
      if (document.readyState === "complete") greet(); else window.addEventListener("load", greet, { once: true });
    }
  })();

  /* decode every photo up front so nothing pops in while scrolling */
  $$("img").forEach(function (i) {
    i.loading = "eager";
    if (!i.decode) return;
    (i.complete ? i.decode() : new Promise(function (r) { i.addEventListener("load", r, { once: true }); }).then(function () { return i.decode(); })).catch(function () {});
  });

  /* reveals */
  var revealEls = $$("[data-reveal], [data-stagger], .steps, [data-count]");
  var show = function (el) {
    if (el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.hasAttribute("data-count")) countUp(el);
  };
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show(el); else io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* gentle parallax on hero / split photos */
  window.addEventListener("load", function () {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    $$(".hero-photo img, .split-photo img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });

  /* tabs (home) */
  var tablist = $('[role="tablist"]');
  if (tablist) {
    var tabs = $$('[role="tab"]', tablist);
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (ev) {
        var n = null;
        if (ev.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (ev.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (ev.key === "Home") n = tabs[0];
        if (ev.key === "End") n = tabs[tabs.length - 1];
        if (n) { ev.preventDefault(); select(n, true); }
      });
    });
  }

  /* services filter + search */
  var items = $$(".svc-item");
  if (items.length) {
    var pills = $$(".pill[data-filter]"), search = $("#svc-search"), note = $("#svc-note"), empty = $(".svc-empty");
    var group = "all";
    var apply = function () {
      var q = (search && search.value || "").trim().toLowerCase(), shown = 0;
      items.forEach(function (it) {
        var ok = (group === "all" || it.getAttribute("data-group") === group) && (!q || it.textContent.toLowerCase().indexOf(q) > -1);
        var was = !it.hidden;
        it.hidden = !ok;
        if (ok) { shown++; if (!was) { it.classList.remove("pop"); void it.offsetWidth; it.classList.add("pop"); } }
      });
      if (note) note.textContent = "Showing " + shown + " of " + items.length + " services";
      if (empty) empty.hidden = shown !== 0;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        group = p.getAttribute("data-filter");
        pills.forEach(function (o) { o.setAttribute("aria-pressed", o === p ? "true" : "false"); });
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    var reset = $("#svc-reset");
    if (reset) reset.addEventListener("click", function () { if (search) search.value = ""; group = "all"; pills.forEach(function (o) { o.setAttribute("aria-pressed", o.getAttribute("data-filter") === "all" ? "true" : "false"); }); apply(); });
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains("svc-item")) {
      var d = $("details", target); if (d) d.open = true;
    }
    apply();
  }

  /* contact: picker + preselect + count */
  var picks = $$('.chk input[name="services"]'), countEl = $(".picker-count");
  var updateCount = function () {
    var n = picks.filter(function (c) { return c.checked; }).length;
    if (countEl) countEl.textContent = n ? n + " selected" : "";
  };
  if (picks.length) {
    var want = new URLSearchParams(location.search).get("service");
    if (want) picks.forEach(function (c) { if (c.value === want) c.checked = true; });
    picks.forEach(function (c) { c.addEventListener("change", updateCount); });
    updateCount();
  }

  /* toast + copy */
  var toast = $(".toast"), tt;
  var say = function (msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add("on");
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("on"); }, 2200);
  };
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-copy");
      var done = function () { say("Copied " + v); };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () { say(v); });
      else say(v);
    });
  });

  /* enquiry form → email draft */
  var form = $("#enquiry");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      $$("[required]", form).forEach(function (f) {
        var bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
        f.closest(".field").classList.toggle("invalid", bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      var fnote = $(".form-note", form);
      if (!ok) { if (fnote) fnote.textContent = "Please fill in the highlighted fields."; return; }
      var v = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
      var chosen = picks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var body = "Name: " + v("name") + "\nCompany: " + v("company") + "\nEmail: " + v("email") + "\nPhone: " + v("phone") +
        "\nServices: " + (chosen.join(", ") || "Not specified") + "\n\n" + v("message");
      var subject = "Enquiry from " + v("name") + (v("company") ? " (" + v("company") + ")" : "");
      location.href = "mailto:sales@alifenter.pro?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      if (fnote) fnote.textContent = "Your email app should open with the enquiry ready to send.";
    });
    $$("input, textarea", form).forEach(function (f) {
      f.addEventListener("input", function () { var fl = f.closest(".field"); if (fl) fl.classList.remove("invalid"); });
    });
  }
  /* ================= animated hero ================= */
  var hx = $(".hx");
  if (hx) (function () {
    var inView = true, fine = window.matchMedia("(pointer: fine)").matches;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }).observe(hx);

    /* rotating word */
    var rot = $(".rot", hx), items = rot ? $$(".rot-item", rot) : [], ri = 0;
    var fit = function () { if (rot && items[ri]) rot.style.width = (items[ri].offsetWidth + 8) + "px"; };
    fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    if (!reduce && items.length > 1) setInterval(function () {
      if (!inView || document.hidden) return;
      var cur = items[ri]; ri = (ri + 1) % items.length; var nx = items[ri];
      cur.classList.remove("on"); cur.classList.add("out");
      nx.classList.add("on"); fit();
      setTimeout(function () { cur.classList.remove("out"); }, 700);
    }, 2400);

    /* network canvas */
    var cv = $(".hx-net", hx), ctx = cv && cv.getContext("2d"), nodes = [], pulses = [], W = 0, H = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), mouse = { x: -999, y: -999 }, LINK = 150;
    var size = function () {
      W = hx.offsetWidth; H = hx.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, W * H / 16000)); nodes = [];
      for (var i = 0; i < n; i++) { var vx = (Math.random() - .5) * .3, vy = (Math.random() - .5) * .3; nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: vx, vy: vy, bx: vx, by: vy, r: Math.random() * 1.6 + 1.2 }); }
    };
    var R = 240, ORBIT = 100, ring = 0;
    var burst = function (x, y) {
      nodes.forEach(function (a) {
        var dx = a.x - x, dy = a.y - y, d = Math.hypot(dx, dy) || 1;
        if (d < 280) { var k = (1 - d / 280) * 7; a.vx += dx / d * k; a.vy += dy / d * k; a.hot = 1; }
      });
      ring = 1;
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d, on = mouse.x > -500;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduce) {
          dx = mouse.x - a.x; dy = mouse.y - a.y; d = Math.hypot(dx, dy) || 1;
          if (on && d < R) {
            var f = (d - ORBIT) / d * .0028;           // pull onto a ring around the cursor
            a.vx += dx * f - dy / d * .045;            // ...and swirl around it
            a.vy += dy * f + dx / d * .045;
          }
          a.vx += (a.bx - a.vx) * .025; a.vy += (a.by - a.vy) * .025;   // ease back to drift speed
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0) { a.x = 0; a.vx = Math.abs(a.vx); } else if (a.x > W) { a.x = W; a.vx = -Math.abs(a.vx); }
          if (a.y < 0) { a.y = 0; a.vy = Math.abs(a.vy); } else if (a.y > H) { a.y = H; a.vy = -Math.abs(a.vy); }
          if (a.hot) a.hot = Math.max(0, a.hot - .02);
        }
        a.near = on && Math.hypot(a.x - mouse.x, a.y - mouse.y) < R;
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            d = Math.sqrt(d);
            ctx.strokeStyle = "rgba(45,86,203," + ((1 - d / LINK) * (a.near || b.near ? .55 : .16)).toFixed(3) + ")";
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (!reduce && Math.random() < .0009 && pulses.length < 14) pulses.push({ a: a, b: b, t: 0 });
          }
        }
        if (a.near) {   // tether to the cursor
          d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          ctx.strokeStyle = "rgba(25,179,166," + ((1 - d / R) * .75).toFixed(3) + ")";
          ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(a.x, a.y); ctx.stroke(); ctx.lineWidth = 1;
          if (!reduce && Math.random() < .004 && pulses.length < 18) pulses.push({ a: mouse, b: a, t: 0 });
        }
        var g = a.hot || 0;
        ctx.fillStyle = g > .05 ? "rgba(25,179,166," + (.4 + g * .6).toFixed(2) + ")" : a.near ? "rgba(45,86,203,.9)" : "rgba(45,86,203,.32)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + (a.near ? 1.2 : 0) + g * 2.5, 0, 6.283); ctx.fill();
      }
      if (on) {   // cursor hub
        ctx.fillStyle = "rgba(45,86,203,.9)"; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3.5, 0, 6.283); ctx.fill();
        ctx.strokeStyle = "rgba(45,86,203,.25)"; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 11, 0, 6.283); ctx.stroke();
      }
      if (ring > 0) {   // click shockwave
        ring -= .025; var rr = (1 - ring) * 280;
        ctx.strokeStyle = "rgba(25,179,166," + (ring * .6).toFixed(3) + ")"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ring_x, ring_y, rr, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1;
      }
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i]; p.t += .018;
        if (p.t >= 1 || p.a.x < -500) { pulses.splice(i, 1); continue; }
        ctx.fillStyle = "rgba(25,179,166,.95)"; ctx.shadowColor = "#19B3A6"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 2.6, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
      }
    };
    var ring_x = 0, ring_y = 0;
    if (cv && !reduce) hx.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest("a, button, input, .hx-card")) return;
      var r = hx.getBoundingClientRect(); ring_x = ev.clientX - r.left; ring_y = ev.clientY - r.top; burst(ring_x, ring_y);
    });
    if (cv && ctx) {
      size(); draw(); setTimeout(function () { cv.classList.add("on"); }, 300);
      window.addEventListener("resize", function () { size(); draw(); });
      if (!reduce) (function loop() { if (inView && !document.hidden) draw(); requestAnimationFrame(loop); })();
    }

    /* live sparkline */
    var svg = $(".spark", hx);
    if (svg) {
      var line = $(".spark-line", svg), fill = $(".spark-fill", svg), dot = $(".spark-dot", svg), tp = $(".tp", hx);
      var N = 16, SH = 70, step = 220 / (N - 2), pts = [40], off = 0, last = 0;
      var nextVal = function (prev) { return Math.max(12, Math.min(58, prev + (Math.random() - .45) * 18)); };
      for (var k = 1; k < N; k++) pts.push(nextVal(pts[k - 1]));
      var render = function () {
        var d = "";
        for (var i = 0; i < N; i++) d += (i ? " L" : "M") + (i * step - off).toFixed(1) + " " + (SH - pts[i]).toFixed(1);
        line.setAttribute("d", d);
        fill.setAttribute("d", d + " L" + ((N - 1) * step - off).toFixed(1) + " " + SH + " L" + (-off).toFixed(1) + " " + SH + " Z");
        var f = off / step;
        dot.setAttribute("cx", ((N - 2) * step).toFixed(1));
        dot.setAttribute("cy", (SH - (pts[N - 2] + (pts[N - 1] - pts[N - 2]) * f)).toFixed(1));
      };
      render();
      if (!reduce) (function tick(t) {
        if (inView && !document.hidden) {
          off += (last ? Math.min(50, t - last) : 16) * .03;
          if (off >= step) { off -= step; pts.shift(); pts.push(nextVal(pts[pts.length - 1])); if (tp) tp.textContent = (1.6 + pts[N - 2] / 40).toFixed(1); }
          render();
        }
        last = t; requestAnimationFrame(tick);
      })(0);
    }

    /* rack LEDs */
    var leds = $$(".leds i", hx), states = ["on", "g", "a", "", "", "on", "g"];
    var pick = function () { return states[Math.floor(Math.random() * states.length)]; };
    leds.forEach(function (l) { l.className = pick(); });
    if (!reduce && leds.length) setInterval(function () {
      if (!inView || document.hidden) return;
      for (var i = 0; i < 4; i++) leds[Math.floor(Math.random() * leds.length)].className = pick();
    }, 380);

    /* pointer: spotlight, depth parallax, stage tilt, magnetic buttons */
    var stage = $(".hx-stage", hx), layers = $$("[data-depth]", hx);
    if (fine && !reduce) {
      var raf = 0, px = 0, py = 0;
      hx.addEventListener("pointermove", function (ev) {
        var r = hx.getBoundingClientRect();
        mouse.x = ev.clientX - r.left; mouse.y = ev.clientY - r.top;
        px = mouse.x / r.width * 2 - 1; py = mouse.y / r.height * 2 - 1;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          hx.style.setProperty("--mx", mouse.x + "px"); hx.style.setProperty("--my", mouse.y + "px");
          layers.forEach(function (l) { var d = +l.getAttribute("data-depth"); l.style.translate = (-px * d).toFixed(1) + "px " + (-py * d).toFixed(1) + "px"; });
          if (stage) stage.style.transform = "rotateY(" + (px * 5).toFixed(2) + "deg) rotateX(" + (-py * 4).toFixed(2) + "deg)";
        });
      });
      hx.addEventListener("pointerleave", function () {
        mouse.x = mouse.y = -999;
        layers.forEach(function (l) { l.style.translate = "0px 0px"; });
        if (stage) stage.style.transform = "";
      });
      $$("[data-magnetic]").forEach(function (b) {
        b.addEventListener("pointermove", function (ev) {
          var r = b.getBoundingClientRect();
          b.style.translate = ((ev.clientX - r.left - r.width / 2) * .25).toFixed(1) + "px " + ((ev.clientY - r.top - r.height / 2) * .35).toFixed(1) + "px";
        });
        b.addEventListener("pointerleave", function () { b.style.translate = "0px 0px"; });
      });
    }

    /* scroll: copy drifts up and fades, visual lags behind */
    var copy = $(".hx-copy", hx), vis = $(".hx-visual", hx);
    if (!reduce) {
      var ticking = false;
      var onS = function () {
        ticking = false;
        var p = Math.max(0, Math.min(1, window.scrollY / hx.offsetHeight));
        if (copy) { copy.style.transform = "translateY(" + (-p * 70).toFixed(1) + "px)"; copy.style.opacity = (1 - Math.max(0, p - .45) * 1.4).toFixed(3); }
        if (vis) vis.style.transform = "translateY(" + (p * 50).toFixed(1) + "px) scale(" + (1 - p * .05).toFixed(3) + ")";
      };
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onS); } }, { passive: true });
    }
  })();

  /* ================= navbar: sliding indicator + mega menu ================= */
  (function () {
    var navEl = $("#nav"), ind = $(".nav-ind"), links = $$(".nav .nav-link");
    if (navEl && ind && links.length) {
      var moveTo = function (a) {
        if (!a || window.innerWidth <= 880) { ind.style.opacity = 0; return; }
        var r = a.getBoundingClientRect(), nr = navEl.getBoundingClientRect();
        var host = a.closest(".nav-item") || a;
        var hr = host.getBoundingClientRect();
        ind.style.left = (hr.left - nr.left) + "px"; ind.style.width = hr.width + "px"; ind.style.opacity = 1;
      };
      links.forEach(function (a) {
        var host = a.closest(".nav-item") || a;
        host.addEventListener("mouseenter", function () { moveTo(a); });
        a.addEventListener("focus", function () { moveTo(a); });
      });
      navEl.addEventListener("mouseleave", function () { ind.style.opacity = 0; });
    }

    var item = $(".has-mega"), toggle = $(".mega-toggle"), panel = $("#mega");
    if (!item || !toggle || !panel) return;
    var t = 0;
    var setOpen = function (open) {
      clearTimeout(t);
      item.classList.toggle("open", open); panel.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    var desktop = function () { return window.innerWidth > 880 && window.matchMedia("(hover: hover)").matches; };
    item.addEventListener("mouseenter", function () { if (desktop()) { clearTimeout(t); t = setTimeout(function () { setOpen(true); }, 80); } });
    item.addEventListener("mouseleave", function () { if (desktop()) { clearTimeout(t); t = setTimeout(function () { if (!panel.matches(":hover")) setOpen(false); }, 160); } });
    panel.addEventListener("mouseenter", function () { clearTimeout(t); });
    panel.addEventListener("mouseleave", function () { if (desktop()) { t = setTimeout(function () { if (!item.matches(":hover")) setOpen(false); }, 160); } });
    toggle.addEventListener("click", function () { setOpen(!panel.classList.contains("open")); if (panel.classList.contains("open")) { var f = $("a", panel); if (f) f.focus(); } });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && panel.classList.contains("open")) { setOpen(false); toggle.focus(); } });
    document.addEventListener("click", function (ev) { if (!ev.target.closest(".has-mega") && !ev.target.closest("#mega")) setOpen(false); });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    window.addEventListener("hashchange", function () { setOpen(false); });
  })();

  /* footer wordmark reveal */
  (function () {
    var fb = $(".ft-bottom");
    if (!fb) return;
    if (reduce || !("IntersectionObserver" in window)) { fb.classList.add("in"); return; }
    var io2 = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { fb.classList.add("in"); io2.disconnect(); } }, { threshold: .3 });
    io2.observe(fb);
  })();
})();
