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

  /* ---------- Ask-me (Claude-powered) ---------- */
  const askInput = document.querySelector(".ask-input");
  const askBtn = document.querySelector(".ask-btn");
  const askAnswer = document.querySelector(".ask-answer");
  const askChips = document.querySelectorAll(".ask-chip");

  const SYSTEM_BIO = `You are answering on behalf of 赵彰益 (Zhao Zhangyi) on his personal website.
Respond IN CHINESE (unless asked in English), in first person ("我"), warmly but concisely.
Keep answers under 120 Chinese characters unless the question requires more.
Known facts to use:
- 22 岁，南方科技大学 × 鹏城实验室 电子信息博士候选人，导师于明院士
- 研究方向：AI for 射频器件 / 电磁结构自动化设计 (AI for EMS)
- 本科：中国民航大学电气工程，GPA 90+，专业 1/305，推免直博
- 国家级大创「基于无刷电机控制的新型智能旋钮」主持人，独立一作 SCI (JCR Q2)，国家专利
- 挑战杯省一、国家奖学金、物理竞赛省一、互联网+省银、全国大创年会 TOP 1%
- 2024 年创办「界越未来教育科技」，服务 200+ 大学生客户，续费率 80%，正向现金流
- 2025 与人共同发起「AgentAlpha 社区」，孵化 Idea2Paper（GitHub 1200+ star，Hugging Face 当日榜一）
- 语言：ICAO 讲师、国际大会双语播报员、上海模联英文委代表
- 投资：2024 入场，实战配置，最高年化 10%+
If asked something you don't know, gracefully say 这部分暂时还没公开，可以邮件问我 (geniustay@163.com). Do not invent facts.`;

  let busy = false;
  async function ask(question) {
    if (!question || busy) return;
    busy = true;
    askAnswer.classList.add("show");
    askAnswer.textContent = "思考中…";
    askBtn.disabled = true;
    try {
      const reply = await window.claude.complete({
        messages: [
          { role: "user", content: `${SYSTEM_BIO}\n\n访客问题：${question}` },
        ],
      });
      // Typewriter effect
      askAnswer.textContent = "";
      const text = (reply || "").trim();
      let i = 0;
      const step = () => {
        if (i < text.length) {
          askAnswer.textContent += text[i++];
          setTimeout(step, 14);
        }
      };
      step();
    } catch (err) {
      askAnswer.textContent = "抱歉，这会儿回答不了。可以邮件联系：geniustay@163.com";
    } finally {
      busy = false;
      askBtn.disabled = false;
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
})();
