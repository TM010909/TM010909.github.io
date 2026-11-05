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

// --- 分类 → 封面配色 / 字形 ---
var CATEGORY_SLUG = { "生活": "life", "旅行": "travel", "技术": "tech", "随笔": "note" };
var CATEGORY_GLYPH = { "生活": "生", "旅行": "旅", "技术": "技", "随笔": "随" };

// --- DOM 引用 ---
var grid = document.querySelector("#postGrid");
var search = document.querySelector("#searchInput");
var searchClear = document.querySelector("#searchClear");
var empty = document.querySelector("#emptyState");
var dlg = document.querySelector("#articleDialog");
var postCount = document.querySelector("#postCount");
var progress = document.querySelector("#scrollProgress");
var toTop = document.querySelector("#toTop");
var glow = document.querySelector("#cursorGlow");
var themeBtn = document.querySelector("#themeToggle");

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

// --- 生成抽象封面（image 为空时使用）---
function coverArt(p) {
  var slug = CATEGORY_SLUG[p.category] || "note";
  var glyph = CATEGORY_GLYPH[p.category] || "·";
  return '<div class="cover-art cover-art-' + slug + '" aria-hidden="true">' +
           '<span class="cover-art-glyph">' + glyph + '</span>' +
           '<span class="cover-art-mark">∞</span>' +
         '</div>';
}

// --- 封面：有自定义图片就用图片，否则用分类抽象封面 ---
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
// 用 IntersectionObserver；不支持时内容默认可见，绝不隐藏
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

// 兜底：若 observer 因环境原因未回调，仍让首屏内的区块播放入场动画
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

// 筛选
document.querySelector("#filters").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-filter]");
  if (b) setActiveFilter(b.dataset.filter);
});

document.querySelectorAll("[data-category-link]").forEach(function (a) {
  a.addEventListener("click", function () {
    setActiveFilter(a.dataset.categoryLink);
  });
});

// 搜索 + 清除
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

// 文章卡片
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

// 弹窗关闭
document.querySelector("#closeDialog").addEventListener("click", closeDialog);

dlg.addEventListener("click", function (e) {
  if (e.target === dlg) closeDialog();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && dlg.open) closeDialog();
});

// ============================================
// 滚动：进度条 / 回到顶部 / 导航高亮
// ============================================
var sectionIds = ["latest", "categories", "about"];
var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-header nav a"));
var scrollTicking = false;

function onScrollFrame() {
  scrollTicking = false;

  var doc = document.documentElement;
  var y = window.scrollY || doc.scrollTop || 0;
  var max = doc.scrollHeight - window.innerHeight;

  if (progress) {
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
  }

  if (toTop) {
    toTop.classList.toggle("visible", y > 500);
  }

  var current = "";
  sectionIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
      current = id;
    }
  });

  navLinks.forEach(function (a) {
    a.classList.toggle("current", a.getAttribute("href") === "#" + current);
  });
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
      });
    }
  }, { passive: true });

  document.addEventListener("mouseleave", function () {
    document.body.classList.remove("pointer-active");
  });
}

// ============================================
// 主题切换：localStorage 记忆 + 圆形扩散过渡
// ============================================
var THEME_KEY = "ybwj-theme";

function applyTheme(isLight) {
  document.body.classList.toggle("light", isLight);
  themeBtn.setAttribute("aria-label", isLight ? "切换夜间模式" : "切换日间模式");
}

function saveTheme(isLight) {
  try {
    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  } catch (e) {}
}

themeBtn.addEventListener("click", function () {
  var isLight = !document.body.classList.contains("light");

  // 以按钮为圆心计算扩散半径，供 View Transitions 使用
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
