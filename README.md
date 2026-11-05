# 未完待续 · Somewhere Journal

一个杂志阅读风格的中文个人博客静态模板。无需安装框架，不需要编译。

## 本地预览
直接用浏览器打开 `index.html` 即可。文章数据在 `assets/posts.js`。

## 如何添加文章
打开 `assets/posts.js`，在 `window.POSTS` 数组中复制一个文章对象，修改：
- `title`：标题
- `category`：生活 / 旅行 / 技术 / 随笔
- `date`：日期
- `read`：预计阅读时间
- `image`：封面图片 URL
- `excerpt`：列表摘要
- `body`：文章正文（用 `\\n\\n` 分段）

保存并刷新网页即可看到新文章。

## 发布到 GitHub Pages
1. 登录 GitHub，创建一个新仓库。若希望网址为 `用户名.github.io`，仓库名也使用 `用户名.github.io`。
2. 将本文件夹内的全部文件上传到仓库根目录，确认 `index.html` 位于根目录。
3. 打开仓库 Settings → Pages。
4. 在 Build and deployment 中选择 Deploy from a branch。
5. Branch 选择 `main`，目录选择 `/ (root)`，点击 Save。
6. 等待发布完成，访问 `https://用户名.github.io/`。

## 自定义
- 网站名称和介绍：编辑 `index.html`
- 颜色、字体、布局：编辑 `assets/style.css`
- 文章：编辑 `assets/posts.js`
- 图片：建议使用自己拍摄或拥有授权的图片；也可替换为可靠图片托管地址。

## 当前模板说明
这是纯静态前端：没有登录、评论后台或数据库。文章编辑通过修改 `posts.js` 完成；访客搜索、分类筛选、夜间模式和文章弹窗均在浏览器本地运行。Google Fonts 与 Unsplash 图片需要联网加载。
