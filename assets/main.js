// ============================================
// 永不完结 · 交互逻辑
// 纯原生 JS，无外部依赖
// ============================================

// --- 环境能力检测 ---
var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
var finePointer = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

// --- 文章分类 ---
var filters = ["全部", "生活", "旅行", "技术", "随笔"];
var active = "全部";

var CATEGORY_SLUG = { "生活": "life", "旅行": "travel", "技术": "tech", "随笔": "note" };

// ============================================
// 四幅微型场景插画（纯 SVG，颜色全部交给 CSS 变量控制）
// 生活：窗台盆栽 / 旅行：山海与路 / 技术：终端光标 / 随笔：信纸与笔
// ============================================
var SCENES = {
  life: `
    <svg class="scene scene-life" viewBox="0 0 200 130">
      <rect class="sc-line" x="38" y="12" width="124" height="92" rx="2"/>
      <path class="sc-line" opacity=".5" d="M100 12 V104 M38 58 H162"/>
      <path class="sc-light" d="M38 12 H92 L46 104 H38 Z"/>
      <path class="sc-line" d="M24 110 H176"/>
      <path class="sc-fill" d="M84 100 L88 110 H112 L116 100 Z"/>
      <path class="sc-line" stroke-width="2" d="M100 100 C100 82 95 72 88 64 M100 100 C100 84 106 74 114 68 M100 100 V68"/>
      <g class="sc-leaves">
        <ellipse class="sc-fill" cx="87" cy="61" rx="9" ry="5" transform="rotate(-35 87 61)"/>
        <ellipse class="sc-fill" cx="115" cy="65" rx="9" ry="5" transform="rotate(32 115 65)"/>
        <ellipse class="sc-fill" cx="100" cy="66" rx="6" ry="10"/>
      </g>
    </svg>`,

  travel: `
    <svg class="scene scene-travel" viewBox="0 0 200 130">
      <circle class="sc-moon" cx="152" cy="34" r="13"/>
      <path class="sc-fill-soft" d="M0 96 L46 52 L80 82 L118 44 L200 96 V130 H0 Z"/>
      <path class="sc-fill" d="M0 108 L34 78 L68 100 L102 70 L148 104 L200 82 V130 H0 Z"/>
      <path class="sc-road" d="M96 130 C106 112 84 104 96 92 C108 80 92 76 100 66"/>
      <path class="sc-line" opacity=".3" d="M0 112 H200"/>
    </svg>`,

  tech: `
    <svg class="scene scene-tech" viewBox="0 0 200 130">
      <rect class="sc-paper" x="26" y="16" width="148" height="98" rx="5"/>
      <path class="sc-line" d="M26 36 H174"/>
      <circle class="sc-dot" cx="40" cy="26" r="3"/>
      <circle class="sc-dot" cx="50" cy="26" r="3" opacity=".6"/>
      <circle class="sc-dot" cx="60" cy="26" r="3" opacity=".35"/>
      <g class="sc-code">
        <rect x="40" y="48" width="18" height="3" rx="1.5"/>
        <rect x="64" y="48" width="48" height="3" rx="1.5"/>
        <rect x="52" y="60" width="30" height="3" rx="1.5"/>
        <rect x="88" y="60" width="26" height="3" rx="1.5"/>
        <rect x="52" y="72" width="60" height="3" rx="1.5"/>
        <rect x="40" y="84" width="22" height="3" rx="1.5"/>
      </g>
      <rect class="sc-cursor" x="66" y="82" width="7" height="7" rx="1"/>
    </svg>`,

  note: `
    <svg class="scene scene-note" viewBox="0 0 200 130">
      <g class="sc-note-paper">
        <rect class="sc-paper" x="48" y="14" width="100" height="102" rx="2"/>
        <g class="sc-line">
          <path d="M60 38 H136"/>
          <path d="M60 50 H136"/>
          <path d="M60 62 H116"/>
          <path d="M60 74 H130"/>
          <path d="M60 86 H102"/>
        </g>
      </g>
      <g class="sc-note-pen">
        <rect class="sc-strong" x="146" y="44" width="7" height="60" rx="2"/>
        <path class="sc-strong" d="M146 104 L149.5 118 L153 104 Z"/>
      </g>
      <circle class="sc-ink" cx="58" cy="106" r="3"/>
      <circle class="sc-ink" cx="66" cy="112" r="1.6" opacity=".6"/>
    </svg>`
};

// --- DOM 引用 ---
var grid = document.querySelector("#postGrid");
var search = document.querySelector("#searchInput");
var searchClear = document.querySelector("#searchClear");
var empty = document.querySelector("#emptyState");
var dlg = document.querySelector("#articleDialog");
var postCount = document.querySelector("#postCount");
var progress = document.querySelector("#scrollProgress");
var inkThread = document.querySelector("#inkThread");
var toTop = document.querySelector("#toTop");
var glow = document.querySelector("#cursorGlow");
var themeBtn = document.querySelector("#themeToggle");
var header = document.querySelector(".site-header");
var heroEl = document.querySelector(".hero");
var heroArt = document.querySelector(".hero-art");

// --- HTML 转义 ---
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c];
  });
}

// --- 将正文按 \n\n 分段为 <p> ---
function formatBody(text) {
  return text.split(/\n\n+/).map(function (para) {
    return "<p>" + esc(para.trim()) + "</p>";
  }).join("");
}

// --- 生成场景封面（image 为空时使用）---
function coverArt(p) {
  var slug = CATEGORY_SLUG[p.category] || "note";
  return '<div class="cover-art cover-art-' + slug + '" aria-hidden="true">' +
           '<span class="cover-art-label">' + esc(p.category) + '</span>' +
           (SCENES[slug] || SCENES.note) +
           '<span class="cover-art-mark">∞</span>' +
         '</div>';
}

// --- 封面：有自定义图片就用图片，否则用分类场景插画 ---
function coverHTML(p, place) {
  if (p.image) {
    return '<img ' + (place === "card" ? 'loading="lazy" ' : '') +
           'src="' + esc(p.image) + '" alt="' + esc(p.title) + '">';
  }
  return coverArt(p);
}

// --- 更新文章计数 ---
function updateCount(n) {
  if (!postCount) return;
  postCount.textContent = active === "全部" ? "共 " + n + " 篇" : active + " · " + n + " 篇";
}

// ============================================
// 滚动入场动画
// 元素默认始终可见；observer 触发时播放一次淡入，绝不因脚本异常留白
// ============================================
var revealObserver = null;

if ("IntersectionObserver" in window && !reduceMotion) {
  revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: "0px 0px -40px 0px" });

  document.documentElement.classList.add("reveal-ready");
}

function observeReveals(root) {
  if (!revealObserver) return;
  (root || document).querySelectorAll("[data-reveal]:not(.revealed)").forEach(function (el) {
    revealObserver.observe(el);
  });
}

if (revealObserver) {
  setTimeout(function () {
    document.querySelectorAll("[data-reveal]:not(.revealed)").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 1.15) {
        el.classList.add("revealed");
      }
    });
  }, 1200);
}

// ============================================
// 文章列表
// ============================================
function render() {
  var q = search.value.trim().toLowerCase();
  var list = POSTS.filter(function (p) {
    var matchCategory = active === "全部" || p.category === active;
    var matchSearch = !q || (p.title + p.excerpt + p.category + p.body).toLowerCase().indexOf(q) !== -1;
    return matchCategory && matchSearch;
  });

  grid.innerHTML = list.map(function (p, i) {
    return (
      '<article class="post-card" data-id="' + p.id + '" tabindex="0" ' +
              'style="--reveal-delay:' + (i * 70) + 'ms">' +
        '<div class="cover">' + coverHTML(p, "card") + '</div>' +
        '<div class="post-meta">' +
          '<span class="tag">' + esc(p.category) + '</span>' +
          '<span>' + esc(p.date) + '</span>' +
          '<span>' + esc(p.read) + '</span>' +
        '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p>' + esc(p.excerpt) + '</p>' +
        '<span class="read-more">接着读 ↗</span>' +
      '</article>'
    );
  }).join("");

  empty.classList.toggle("hidden", list.length > 0);
  updateCount(list.length);
}

function renderFilters() {
  document.querySelector("#filters").innerHTML = filters.map(function (f) {
    return '<button class="filter ' + (f === "全部" ? "active" : "") + '" data-filter="' + f + '">' + f + '</button>';
  }).join("");
}

function setActiveFilter(name) {
  active = name;
  document.querySelectorAll(".filter").forEach(function (x) {
    x.classList.toggle("active", x.dataset.filter === active);
  });
  render();
}

// ============================================
// 文章弹窗
// ============================================
function openPost(id) {
  var p = POSTS.find(function (x) { return x.id === Number(id); });
  if (!p) return;

  document.querySelector("#articleContent").innerHTML =
    '<p class="eyebrow">' + esc(p.category) + " · " + esc(p.date) + " · " + esc(p.read) + '</p>' +
    '<h1>' + esc(p.title) + '</h1>' +
    '<div class="dialog-cover">' + coverHTML(p, "dialog") + '</div>' +
    '<div class="article-body">' + formatBody(p.body) + '</div>' +
    '<span class="article-end-mark">未完 · 永不完结</span>';

  dlg.showModal();
  document.body.style.overflow = "hidden";
  dlg.scrollTop = 0;
}

function closeDialog() {
  dlg.close();
  document.body.style.overflow = "";
}

// ============================================
// 事件绑定
// ============================================
document.querySelector("#filters").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-filter]");
  if (b) setActiveFilter(b.dataset.filter);
});

document.querySelectorAll("[data-category-link]").forEach(function (a) {
  a.addEventListener("click", function () {
    setActiveFilter(a.dataset.categoryLink);
  });
});

function syncClear() {
  searchClear.hidden = search.value.length === 0;
}

search.addEventListener("input", function () {
  render();
  syncClear();
});

searchClear.addEventListener("click", function (e) {
  e.preventDefault();
  search.value = "";
  render();
  syncClear();
  search.focus();
});

grid.addEventListener("click", function (e) {
  var c = e.target.closest("[data-id]");
  if (c) openPost(c.dataset.id);
});

grid.addEventListener("keydown", function (e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-id]")) {
    e.preventDefault();
    openPost(e.target.dataset.id);
  }
});

document.querySelector("#closeDialog").addEventListener("click", closeDialog);

dlg.addEventListener("click", function (e) {
  if (e.target === dlg) closeDialog();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && dlg.open) closeDialog();
});

// ============================================
// 滚动：进度条 / 墨线 / 回到顶部 / 导航高亮
// ============================================
var sectionIds = ["latest", "categories", "about"];
var sectionEls = sectionIds.map(function (id) { return document.getElementById(id); });
var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-header nav a"));
var scrollTicking = false;

// 只在状态真正变化时才写 DOM，避免每帧无谓的重绘
var lastBannerHidden = null;
var lastScrolled = null;
var lastToTop = null;
var lastCurrent = null;
var lastHeroScroll = -1;

function onScrollFrame() {
  scrollTicking = false;

  var doc = document.documentElement;
  var y = window.scrollY || doc.scrollTop || 0;
  var max = doc.scrollHeight - window.innerHeight;
  var ratio = max > 0 ? Math.min(1, y / max) : 0;

  if (progress) progress.style.transform = "scaleX(" + ratio + ")";
  if (inkThread) inkThread.style.height = (ratio * 100) + "vh";

  var showToTop = y > 500;
  if (showToTop !== lastToTop) {
    lastToTop = showToTop;
    if (toTop) toTop.classList.toggle("visible", showToTop);
  }

  // 顶部横幅淡出、导航收缩、首屏水印视差（全部由同一帧驱动）
  var hideBanner = y > 30;
  if (hideBanner !== lastBannerHidden) {
    lastBannerHidden = hideBanner;
    document.body.classList.toggle("banner-hidden", hideBanner);
  }

  var isScrolled = y > 40;
  if (isScrolled !== lastScrolled) {
    lastScrolled = isScrolled;
    if (header) header.classList.toggle("scrolled", isScrolled);
  }

  if (heroEl) {
    var heroY = Math.min(y, 900);
    if (Math.abs(heroY - lastHeroScroll) > 2) {
      lastHeroScroll = heroY;
      heroEl.style.setProperty("--hero-scroll", heroY + "px");
    }
  }

  var current = "";
  sectionEls.forEach(function (el, i) {
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
      current = sectionIds[i];
    }
  });

  if (current !== lastCurrent) {
    lastCurrent = current;
    navLinks.forEach(function (a) {
      a.classList.toggle("current", a.getAttribute("href") === "#" + current);
    });
  }
}

function onScroll() {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(onScrollFrame);
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll, { passive: true });

if (toTop) {
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
}

// ============================================
// 鼠标柔光（仅精确指针 + 允许动效时启用）
// ============================================
if (finePointer && !reduceMotion && glow) {
  var mx = 0, my = 0, glowTicking = false;

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    mx = e.clientX;
    my = e.clientY;
    if (!glowTicking) {
      glowTicking = true;
      requestAnimationFrame(function () {
        glowTicking = false;
        glow.style.setProperty("--mx", mx + "px");
        glow.style.setProperty("--my", my + "px");
        document.body.classList.add("pointer-active");

        // ∞ 墨迹随指针轻微反向漂移，制造空间层次
        if (heroArt) {
          var nx = (mx / window.innerWidth - .5) * 2;
          var ny = (my / window.innerHeight - .5) * 2;
          heroArt.style.setProperty("--ink-px", (-nx * 12).toFixed(1) + "px");
          heroArt.style.setProperty("--ink-py", (-ny * 9).toFixed(1) + "px");
        }
      });
    }
  }, { passive: true });

  document.addEventListener("mouseleave", function () {
    document.body.classList.remove("pointer-active");
  });
}

// ============================================
// 点击墨滴涟漪（很淡的交互彩蛋，输入框内不触发）
// ============================================
if (!reduceMotion) {
  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("input, textarea, .search")) return;
    var r = document.createElement("span");
    r.className = "ink-ripple";
    r.style.left = e.clientX + "px";
    r.style.top = e.clientY + "px";
    document.body.appendChild(r);
    window.setTimeout(function () {
      if (r.parentNode) r.parentNode.removeChild(r);
    }, 700);
  }, { passive: true });
}

// ============================================
// 主题切换：localStorage 记忆 + 圆形扩散过渡
// ============================================
var THEME_KEY = "ybwj-theme";

function applyTheme(isLight) {
  // 主题类挂在 <html> 上：与 head 中的预置脚本一致，避免刷新闪烁
  document.documentElement.classList.toggle("light", isLight);
  themeBtn.setAttribute("aria-label", isLight ? "切换夜间模式" : "切换日间模式");
}

function saveTheme(isLight) {
  try {
    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  } catch (e) {}
}

themeBtn.addEventListener("click", function () {
  var isLight = !document.documentElement.classList.contains("light");

  var rect = themeBtn.getBoundingClientRect();
  var x = rect.left + rect.width / 2;
  var y = rect.top + rect.height / 2;
  var r = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  var root = document.documentElement;
  root.style.setProperty("--vt-x", x + "px");
  root.style.setProperty("--vt-y", y + "px");
  root.style.setProperty("--vt-r", r + "px");

  function commit() {
    applyTheme(isLight);
    saveTheme(isLight);
  }

  if (document.startViewTransition && !reduceMotion) {
    document.startViewTransition(commit);
  } else {
    commit();
  }
});

try {
  if (localStorage.getItem(THEME_KEY) === "light") applyTheme(true);
} catch (e) {}

// ============================================
// 初始化
// ============================================
renderFilters();
render();
syncClear();
observeReveals(document);
onScrollFrame();
