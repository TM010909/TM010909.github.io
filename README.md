# 永不完结

铜香哭哭死的个人站点：写生活、路上的事、代码和翻过的书。纯静态页面，不依赖框架，也不需要编译。

线上地址：https://TM010909.github.io

## 本地预览

直接用浏览器打开 `index.html` 即可；也可在目录下运行 `python -m http.server 8090` 后访问 `http://localhost:8090`。

## 如何添加文章

打开 `assets/posts.js`，在 `window.POSTS` 数组中复制一个文章对象，修改：

- `title`：标题
- `category`：生活 / 旅行 / 技术 / 随笔
- `date`：日期
- `read`：预计阅读时间，如 `约 4 分钟`
- `image`：封面图片地址，**可以留空**
- `excerpt`：列表摘要
- `body`：文章正文，用 `\n\n` 分段

保存并刷新网页即可看到新文章。

### 关于封面

`image` 留空时，页面会按分类自动绘制一张抽象封面（由 CSS 生成，见 `assets/style.css` 中的 `.cover-art-*`）：

| 分类 | 视觉 |
| --- | --- |
| 生活 | 暖陶土色 + 同心圆 |
| 旅行 | 青蓝色 + 斜向地平线 |
| 技术 | 灰蓝色 + 网格 |
| 随笔 | 褐紫色 + 错位圆弧 |

想换成自己的照片，把 `image` 填成图片地址即可，例如 `./assets/covers/trip.jpg`。填了地址就优先用照片，留空就用自动封面。全站不依赖任何外部图床。

## 功能说明

文章以弹窗形式阅读；支持分类筛选、关键词搜索、深/浅色主题切换（偏好保存在浏览器本地）。所有逻辑都在浏览器端运行，没有后台、评论系统或数据库。

字体来自 Google Fonts，需要联网加载；断网时会回退到系统字体，不影响阅读。

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构与文案、SEO 元信息 |
| `assets/style.css` | 主题配色、布局、CSS 绘制的封面与主视觉 |
| `assets/posts.js` | 文章数据 |
| `assets/main.js` | 筛选、搜索、弹窗、主题切换 |
| `robots.txt` / `sitemap.xml` | 搜索引擎收录 |

## 发布到 GitHub Pages

仓库已开启 Pages，把改动推送到 `main` 分支即会自动部署：

```bash
git add -A
git commit -m "更新文章"
git push origin main
```

首次配置：Settings → Pages → Build and deployment → Deploy from a branch → Branch 选 `main`，目录选 `/ (root)`。
