/* =========================================================
   Personal site — interactions
   ========================================================= */

(function () {
  const root = document.documentElement;

  /* ---------- Tweaks state (persisted via edit-mode) ---------- */
  const state = Object.assign({
    theme: "editorial",
    hue: 45,
    density: "relaxed",
  }, window.TWEAK_DEFAULTS || {});

  function applyState() {
    root.setAttribute("data-theme", state.theme);
    // Accent hue override — keep L/C constant, vary H
    if (state.theme !== "terminal") {
      root.style.setProperty("--accent", `oklch(0.55 0.14 ${state.hue})`);
    } else {
      // terminal uses phosphor green regardless, but still let hue shift secondary
      root.style.setProperty("--accent", `oklch(0.82 0.17 ${135})`);
    }
    if (state.density === "compact") {
      root.style.setProperty("--pad-x", "clamp(16px, 3vw, 48px)");
    } else {
      root.style.setProperty("--pad-x", "clamp(20px, 4vw, 72px)");
    }
    // Active button visuals
    document.querySelectorAll(".tweak-btns").forEach((g) => {
      const key = g.dataset.tweak;
      g.querySelectorAll(".tweak-btn").forEach((b) => {
        b.classList.toggle("active", String(state[key]) === String(b.dataset.v));
      });
    });
  }
  applyState();

  /* ---------- Tweaks panel toggle + host protocol ---------- */
  const panel = document.getElementById("tweaks");
  window.addEventListener("message", (e) => {
    const t = e.data && e.data.type;
    if (t === "__activate_edit_mode") {
      panel.classList.add("show");
      panel.setAttribute("aria-hidden", "false");
    } else if (t === "__deactivate_edit_mode") {
      panel.classList.remove("show");
      panel.setAttribute("aria-hidden", "true");
    }
  });
  // Close button on panel (local only)
  document.getElementById("tweak-close")?.addEventListener("click", () => {
    panel.classList.remove("show");
  });
  // Announce availability (after listener is attached)
  try {
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
  } catch (_) {}

  function setTweak(key, value) {
    // Coerce numeric values
    const numericKeys = ["hue"];
    if (numericKeys.includes(key)) value = Number(value);
    state[key] = value;
    applyState();
    try {
      window.parent.postMessage(
        { type: "__edit_mode_set_keys", edits: { [key]: value } },
        "*"
      );
    } catch (_) {}
  }

  document.querySelectorAll(".tweak-btns").forEach((g) => {
    const key = g.dataset.tweak;
    g.addEventListener("click", (e) => {
      const btn = e.target.closest(".tweak-btn");
      if (!btn) return;
      setTweak(key, btn.dataset.v);
    });
  });

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Smooth scroll on nav links ---------- */
  document.querySelectorAll('.nav-links a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  /* ---------- Nav link active state via scrollspy ---------- */
  const sections = Array.from(document.querySelectorAll("section[id], header.hero"));
  const navA = Array.from(document.querySelectorAll(".nav-links a"));
  function spy() {
    const y = window.scrollY + window.innerHeight * 0.3;
    let curId = "";
    sections.forEach((s) => {
      if (s.offsetTop <= y) curId = s.id;
    });
    navA.forEach((a) => {
      a.classList.toggle("active", a.dataset.sec === curId);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* ---------- Timeline rows: click to expand ---------- */
  document.querySelectorAll(".tl-row").forEach((row) => {
    row.addEventListener("click", () => {
      row.classList.toggle("open");
    });
  });

  /* ---------- Contact copy-to-clipboard ---------- */
  document.querySelectorAll(".contact-list li[data-copy]").forEach((li) => {
    li.addEventListener("click", async () => {
      const val = li.dataset.copy;
      try {
        await navigator.clipboard.writeText(val);
        const arrow = li.querySelector(".c-arrow");
        const prev = arrow.textContent;
        arrow.textContent = "✓ copied";
        arrow.style.color = "var(--accent)";
        setTimeout(() => {
          arrow.textContent = prev;
          arrow.style.color = "";
        }, 1400);
      } catch (_) {}
    });
  });

  /* ---------- Ask-me (DeepSeek-powered) ---------- */
  const askInput = document.querySelector(".ask-input");
  const askBtn = document.querySelector(".ask-btn");
  const askAnswer = document.querySelector(".ask-answer");
  const askChips = document.querySelectorAll(".ask-chip");

  let busy = false;
  let activeController = null;

  function setAskLoading(isLoading) {
    askAnswer.classList.toggle("is-loading", isLoading);
    askBtn.disabled = isLoading;
    askBtn.textContent = isLoading ? "..." : "ASK";
  }

  function parseSSE(buffer, onData) {
    const events = buffer.split("\n\n");
    const rest = events.pop() || "";
    events.forEach((event) => {
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (data) onData(data);
    });
    return rest;
  }

  async function ask(question) {
    if (!question || busy) return;
    busy = true;
    activeController?.abort();
    activeController = new AbortController();
    askAnswer.classList.add("show");
    askAnswer.textContent = "";
    setAskLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: activeController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Ask API failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let hasText = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSE(buffer, (data) => {
          if (data === "[DONE]") return;
          try {
            const payload = JSON.parse(data);
            if (payload.content) {
              if (!hasText) {
                hasText = true;
                setAskLoading(false);
              }
              askAnswer.textContent += payload.content;
            }
          } catch (_) {}
        });
      }

      if (!hasText) {
        askAnswer.textContent = "暂时没有收到回答，可以稍后再试。";
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        askAnswer.textContent = "抱歉，这会儿回答不了。可以邮件联系：geniustay@163.com";
      }
    } finally {
      busy = false;
      activeController = null;
      setAskLoading(false);
    }
  }

  askBtn?.addEventListener("click", () => ask(askInput.value.trim()));
  askInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") ask(askInput.value.trim());
  });
  askChips.forEach((c) => {
    c.addEventListener("click", () => {
      askInput.value = c.dataset.q;
      ask(c.dataset.q);
    });
  });

  /* ---------- Lightbox (zoomable images) ---------- */
  const lb = document.getElementById("lightbox");
  if (lb) {
    const lbImg = lb.querySelector(".lb-img");
    const lbCap = lb.querySelector(".lb-cap");

    function openLB(src, cap) {
      lbImg.src = src;
      lbImg.alt = cap || "";
      lbCap.textContent = cap || "";
      lb.classList.add("show");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeLB() {
      lb.classList.remove("show");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbImg.src = "";
    }

    document.querySelectorAll("img.zoom").forEach((img) => {
      img.addEventListener("click", () => openLB(img.currentSrc || img.src, img.alt));
    });
    lb.addEventListener("click", closeLB);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lb.classList.contains("show")) closeLB();
    });
  }
})();
