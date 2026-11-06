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
var articleContent = document.querySelector("#articleContent");
var articleProgress = document.querySelector("#articleReadProgress");
var lastTrigger = null;
var currentPostId = null;
var postCount = document.querySelector("#postCount");

// 文章深链 #post-N：让每篇文章可被分享、收藏、前进后退。
// file:// 直接打开时 history API 受限，静默降级（不影响阅读）。
function setPostHash(id, replace) {
  try {
    var hash = "#post-" + id;
    if (replace) history.replaceState({ post: id }, "", hash);
    else history.pushState({ post: id }, "", hash);
  } catch (e) {}
}

function clearPostHash() {
  if (!/^#post-\d+$/.test(location.hash)) return;
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
}
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

// --- 将正文按 \n\n 分段；支持 > 引用 与 `行内代码`（向后兼容纯文本） ---
function inlineMarkup(s) {
  return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function formatBody(text) {
  return text.split(/\n\n+/).map(function (para) {
    var t = para.trim();
    if (/^>\s?/.test(t)) {
      return "<blockquote>" + inlineMarkup(t.replace(/^>\s?/, "")) + "</blockquote>";
    }
    return "<p>" + inlineMarkup(t) + "</p>";
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

// --- 目录行左侧的圆形元素徽记（四元素符号；场景插画保留在文章弹窗里） ---
var ELEMENT_GLYPH = { "生活": "▽", "旅行": "▽", "技术": "△", "随笔": "△" };

function medallionHTML(p) {
  if (p.image) return '<img src="' + esc(p.image) + '" alt="">';
  var slug = CATEGORY_SLUG[p.category] || "note";
  return '<span class="md-glyph md-' + slug + '">' +
           (ELEMENT_GLYPH[p.category] || "✦") + '</span>';
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

  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  grid.innerHTML = list.map(function (p, i) {
    return (
      '<article class="index-row" data-id="' + p.id + '" tabindex="0" role="button" ' +
              'aria-label="阅读文章：' + esc(p.title) + '" ' +
              'style="--reveal-delay:' + (i * 80) + 'ms">' +
        '<span class="ir-num" aria-hidden="true">' + (ROMAN[i] || String(i + 1)) + '</span>' +
        '<span class="ir-medallion" aria-hidden="true">' + medallionHTML(p) + '</span>' +
        '<span class="ir-body">' +
          '<span class="ir-cat">' + esc(p.category) + '</span>' +
          '<span class="ir-title">' + esc(p.title) + '</span>' +
          '<span class="ir-excerpt">' + esc(p.excerpt) + '</span>' +
        '</span>' +
        '<span class="ir-tail">' +
          '<span class="ir-date">' + esc(p.date) + '</span>' +
          '<span class="ir-read">' + esc(p.read) + '</span>' +
          '<span class="ir-go" aria-hidden="true">❧</span>' +
        '</span>' +
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
// --- 文章间导航：首尾相接循环，呼应「永不完结」的 ∞ ---
function articleNavHTML(currentId) {
  var i = POSTS.findIndex(function (x) { return x.id === currentId; });
  if (i < 0 || POSTS.length < 2) return "";
  var prev = POSTS[(i - 1 + POSTS.length) % POSTS.length];
  var next = POSTS[(i + 1) % POSTS.length];
  return '<nav class="article-nav" aria-label="文章导航">' +
    '<button type="button" data-goto="' + prev.id + '">' +
      '<small>← 上一篇</small><span>' + esc(prev.title) + '</span></button>' +
    '<button type="button" data-goto="' + next.id + '">' +
      '<small>下一篇 →</small><span>' + esc(next.title) + '</span></button>' +
  '</nav>';
}

function updateArticleProgress() {
  if (!articleProgress) return;
  var max = dlg.scrollHeight - dlg.clientHeight;
  // 短文无需滚动时直接显示读满，避免进度条一直空着
  var ratio = max > 4 ? Math.min(1, dlg.scrollTop / max) : 1;
  articleProgress.style.transform = "scaleX(" + ratio + ")";
}

function openPost(id, fromNav, trigger, fromHash) {
  var p = POSTS.find(function (x) { return x.id === Number(id); });
  if (!p) return;

  currentPostId = p.id;

  // 记录触发元素，关闭时把焦点还回去（键盘用户不会丢位置）
  if (!dlg.open && !fromNav && !fromHash) lastTrigger = trigger || document.activeElement;

  // 打开写入历史、切换文章替换当前条；来自 hashchange 的调用不再改写 URL
  if (!fromHash) setPostHash(p.id, !!fromNav);

  articleContent.innerHTML =
    '<p class="eyebrow">' + esc(p.category) + " · " + esc(p.date) + " · " + esc(p.read) + '</p>' +
    '<h1>' + esc(p.title) + '</h1>' +
    '<div class="dialog-cover">' + coverHTML(p, "dialog") + '</div>' +
    '<div class="article-body">' + formatBody(p.body) + '</div>' +
    '<span class="article-end-mark">未完 · 永不完结</span>' +
    '<button type="button" class="copy-link" data-copy-link>复制本文链接 ⧉</button>' +
    articleNavHTML(p.id);

  if (!dlg.open) {
    dlg.showModal();
    document.body.style.overflow = "hidden";
  }
  dlg.scrollTop = 0;
  updateArticleProgress();
}

function closeDialog(skipHash) {
  if (!dlg.open) return;
  dlg.close();
  document.body.style.overflow = "";
  currentPostId = null;
  if (!skipHash) clearPostHash();
  if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus();
  lastTrigger = null;
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
  if (c) openPost(c.dataset.id, false, c);
});

grid.addEventListener("keydown", function (e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-id]")) {
    e.preventDefault();
    openPost(e.target.dataset.id, false, e.target);
  }
});

// 包一层，避免把 Event 对象当成 closeDialog 的参数传进去
document.querySelector("#closeDialog").addEventListener("click", function () { closeDialog(); });

function copyLinkFallback(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}

dlg.addEventListener("click", function (e) {
  if (e.target === dlg) { closeDialog(); return; }

  var cp = e.target.closest("[data-copy-link]");
  if (cp) {
    var url = location.href;
    var done = function () {
      cp.classList.add("copied");
      cp.textContent = "已复制 ✓";
      window.setTimeout(function () {
        cp.classList.remove("copied");
        cp.textContent = "复制本文链接 ⧉";
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () {
        copyLinkFallback(url); done();
      });
    } else {
      copyLinkFallback(url); done();
    }
    return;
  }

  var go = e.target.closest("[data-goto]");
  if (go) {
    openPost(go.dataset.goto, true);
    // 内容已重建，把焦点交到仍在的关闭按钮，避免焦点掉回 body
    var closeBtn = dlg.querySelector(".dialog-close");
    if (closeBtn) closeBtn.focus();
  }
});

// 原生 dialog 的 Esc 统一走 closeDialog，确保滚动锁与焦点都还原
dlg.addEventListener("cancel", function (e) {
  e.preventDefault();
  closeDialog();
});

dlg.addEventListener("scroll", updateArticleProgress, { passive: true });

// "/" 快速聚焦搜索（输入框内不拦截）
document.addEventListener("keydown", function (e) {
  if (e.key !== "/" || dlg.open) return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  e.preventDefault();
  search.focus();
});

// ============================================
// 滚动：进度条 / 墨线 / 回到顶部 / 导航高亮
// ============================================
var sectionIds = ["latest", "categories", "visions", "about"];
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

  if (heroEl && !reduceMotion) {
    var heroY = Math.min(y, 900);
    if (Math.abs(heroY - lastHeroScroll) > 2) {
      lastHeroScroll = heroY;
      heroEl.style.setProperty("--hero-scroll", heroY + "px");
      heroEl.style.setProperty("--hero-fade", Math.max(.62, 1 - heroY / 1400).toFixed(3));
    }
  }

  // 取「已进入视口上三分之一、且离顶部最近」的区块。
  // 相邻区块挨得近时，不能简单取最后一个，否则下一区块会提前抢占高亮。
  var probeLine = window.innerHeight * 0.35;
  var current = "";
  var nearestTop = -Infinity;
  sectionEls.forEach(function (el, i) {
    if (!el) return;
    var top = el.getBoundingClientRect().top;
    if (top <= probeLine && top > nearestTop) {
      nearestTop = top;
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
// 文章深链：URL 变化（刷新 / 收藏 / 前进后退）同步弹窗
// ============================================
window.addEventListener("hashchange", function () {
  var m = /^#post-(\d+)$/.exec(location.hash);
  if (m) {
    var id = Number(m[1]);
    if (!dlg.open || currentPostId !== id) openPost(id, dlg.open, null, true);
  } else if (dlg.open) {
    closeDialog(true); // hash 已由外部改变，不再回写
  }
});

// ============================================
// 初始化
// ============================================
renderFilters();
render();
syncClear();
observeReveals(document);
onScrollFrame();

// 以 #post-N 直接进入时自动打开对应文章
var bootMatch = /^#post-(\d+)$/.exec(location.hash);
if (bootMatch) openPost(bootMatch[1], false, null, true);

// ============================================
// IV · 显影：常驻影像 + 本地视频预览
// 纯前端：本地文件用 blob URL 只在当前浏览器播放，不上传任何服务器
// ============================================
var VIDEO_LIST = Array.isArray(window.VIDEOS) ? window.VIDEOS : [];
var visionGrid = document.querySelector("#visionGrid");
var visionAltar = document.querySelector("#visionAltar");
var visionInput = document.querySelector("#visionInput");
var visionStatus = document.querySelector("#visionStatus");
var visionCount = document.querySelector("#visionCount");
var localVideo = null;
var localObjectUrl = null;

function setVisionStatus(msg) {
  if (visionStatus) visionStatus.textContent = msg;
}

function visionCardHTML(v, isLocal) {
  var media = v.src
    ? '<video controls playsinline preload="metadata"' +
        (v.poster ? ' poster="' + esc(v.poster) + '"' : '') +
        ' src="' + esc(v.src) + '"></video>'
    : '<div class="vision-placeholder">∞</div>';
  return '<article class="vision-card' + (isLocal ? " is-local" : "") + '">' +
    '<div class="vision-frame">' + media + '</div>' +
    '<div class="vision-meta"><h3>' + esc(v.title || "未命名") + '</h3>' +
      (v.note ? '<p>' + esc(v.note) + '</p>' : '') + '</div>' +
    (isLocal
      ? '<button class="vision-remove" type="button" data-remove-local aria-label="移除本地预览">×</button>'
      : '') +
  '</article>';
}

function renderVisions() {
  if (!visionGrid) return;
  var items = VIDEO_LIST.slice();
  if (localVideo) items.unshift(localVideo);
  visionGrid.innerHTML = items.map(function (v) {
    return visionCardHTML(v, v === localVideo);
  }).join("");
  if (visionCount) visionCount.textContent = "共 " + items.length + " 帧";
}

function releaseLocalVideo() {
  var el = visionGrid && visionGrid.querySelector("video");
  if (el) {
    try { el.pause(); el.removeAttribute("src"); } catch (e) {}
  }
  if (localObjectUrl) {
    URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = null;
  }
  localVideo = null;
}

function acceptVideoFile(file) {
  if (!file) return;
  if (file.type && file.type.indexOf("video/") !== 0) {
    setVisionStatus("只接受视频文件");
    return;
  }
  releaseLocalVideo();
  localObjectUrl = URL.createObjectURL(file);
  localVideo = {
    title: (file.name || "一段影").replace(/\.[^.]+$/, ""),
    src: localObjectUrl,
    note: "本地预览 · 刷新后消失"
  };
  renderVisions();
  setVisionStatus("已显影：" + (file.name || ""));
}

if (visionInput) {
  visionInput.addEventListener("change", function (e) {
    acceptVideoFile(e.target.files && e.target.files[0]);
    visionInput.value = ""; // 允许重复选择同一个文件
  });
}

if (visionAltar) {
  visionAltar.addEventListener("dragover", function (e) {
    e.preventDefault();
    visionAltar.classList.add("is-dragging");
  });
  visionAltar.addEventListener("dragleave", function () {
    visionAltar.classList.remove("is-dragging");
  });
  visionAltar.addEventListener("drop", function (e) {
    e.preventDefault();
    visionAltar.classList.remove("is-dragging");
    acceptVideoFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  });
}

if (visionGrid) {
  visionGrid.addEventListener("click", function (e) {
    if (!e.target.closest("[data-remove-local]")) return;
    releaseLocalVideo();
    renderVisions();
    setVisionStatus("已收回这段影");
  });
}

renderVisions();
