// ============================================
// 永不完结 · 交互逻辑
// ============================================

// --- 文章分类 ---
var filters = ["全部", "生活", "旅行", "技术", "随笔"];
var active = "全部";

// --- DOM 引用 ---
var grid = document.querySelector("#postGrid");
var search = document.querySelector("#searchInput");
var empty = document.querySelector("#emptyState");
var dlg = document.querySelector("#articleDialog");
var postCount = document.querySelector("#postCount");

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

// --- 更新文章计数 ---
function updateCount(n) {
  if (!postCount) return;
  if (active === "全部") {
    postCount.textContent = n + " STORIES";
  } else {
    postCount.textContent = active.toUpperCase() + " · " + n + " STORIES";
  }
}

// --- 渲染文章列表 ---
function render() {
  var q = search.value.trim().toLowerCase();
  var list = POSTS.filter(function (p) {
    var matchCategory = active === "全部" || p.category === active;
    var matchSearch = !q || (p.title + p.excerpt + p.category + p.body).toLowerCase().indexOf(q) !== -1;
    return matchCategory && matchSearch;
  });

  grid.innerHTML = list.map(function (p) {
    return (
      '<article class="post-card" data-id="' + p.id + '" tabindex="0">' +
        '<div class="cover"><img loading="lazy" src="' + esc(p.image) + '" alt="' + esc(p.title) + '"></div>' +
        '<div class="post-meta">' +
          '<span class="tag">' + esc(p.category) + '</span>' +
          '<span>' + esc(p.date) + '</span>' +
          '<span>' + esc(p.read) + '</span>' +
        '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p>' + esc(p.excerpt) + '</p>' +
        '<span class="read-more">READ STORY ↗</span>' +
      '</article>'
    );
  }).join("");

  empty.classList.toggle("hidden", list.length > 0);
  updateCount(list.length);
}

// --- 渲染筛选按钮 ---
function renderFilters() {
  document.querySelector("#filters").innerHTML = filters.map(function (f) {
    return '<button class="filter ' + (f === "全部" ? "active" : "") + '" data-filter="' + f + '">' + f + '</button>';
  }).join("");
}

// --- 设置当前筛选 ---
function setActiveFilter(name) {
  active = name;
  document.querySelectorAll(".filter").forEach(function (x) {
    x.classList.toggle("active", x.dataset.filter === active);
  });
  render();
}

// --- 打开文章弹窗 ---
function openPost(id) {
  var p = POSTS.find(function (x) { return x.id === Number(id); });
  if (!p) return;

  document.querySelector("#articleContent").innerHTML =
    '<p class="eyebrow">' + esc(p.category) + " · " + esc(p.date) + " · " + esc(p.read) + '</p>' +
    '<h1>' + esc(p.title) + '</h1>' +
    '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '">' +
    '<div class="article-body">' + formatBody(p.body) + '</div>' +
    '<span class="article-end-mark">END · 永不完结</span>';

  dlg.showModal();
  // 锁定页面滚动
  document.body.style.overflow = "hidden";
}

// --- 关闭弹窗 ---
function closeDialog() {
  dlg.close();
  document.body.style.overflow = "";
}

// ============================================
// 事件绑定
// ============================================

// 筛选按钮点击
document.querySelector("#filters").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-filter]");
  if (!b) return;
  setActiveFilter(b.dataset.filter);
});

// 分类区域快捷链接
document.querySelectorAll("[data-category-link]").forEach(function (a) {
  a.addEventListener("click", function () {
    setActiveFilter(a.dataset.categoryLink);
  });
});

// 搜索
search.addEventListener("input", render);

// 文章卡片点击
grid.addEventListener("click", function (e) {
  var c = e.target.closest("[data-id]");
  if (c) openPost(c.dataset.id);
});

// 文章卡片键盘访问
grid.addEventListener("keydown", function (e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-id]")) {
    e.preventDefault();
    openPost(e.target.dataset.id);
  }
});

// 关闭弹窗按钮
document.querySelector("#closeDialog").addEventListener("click", closeDialog);

// 点击遮罩关闭弹窗
dlg.addEventListener("click", function (e) {
  if (e.target === dlg) closeDialog();
});

// ESC 关闭弹窗
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && dlg.open) closeDialog();
});

// --- 主题切换（带 localStorage 记忆）---
var themeBtn = document.querySelector("#themeToggle");
var THEME_KEY = "ybwj-theme";

function applyTheme(isLight) {
  document.body.classList.toggle("light", isLight);
  themeBtn.setAttribute("aria-label", isLight ? "切换夜间模式" : "切换日间模式");
}

themeBtn.addEventListener("click", function () {
  var isLight = !document.body.classList.contains("light");
  applyTheme(isLight);
  try {
    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  } catch (e) {}
});

// 页面加载时恢复主题偏好
try {
  var saved = localStorage.getItem(THEME_KEY);
  if (saved === "light") {
    applyTheme(true);
  }
} catch (e) {}

// ============================================
// 初始化
// ============================================
renderFilters();
render();
