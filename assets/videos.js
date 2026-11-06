// 常驻影像配置。
//
// 把 mp4 / webm 放进 assets/videos/，然后按下面格式填一条即可长期显示：
//   {
//     title:  "夜里的海",
//     src:    "./assets/videos/sea.mp4",
//     poster: "./assets/videos/sea.jpg",   // 封面，可留空
//     note:   "2026 · 沿海"                // 一行小字，可留空
//   }
//
// 页面上的「选择视频」只在本机浏览器里预览，不会上传到任何服务器，
// 刷新页面即消失；想让别人也看到，请用上面的常驻配置并把视频文件提交到仓库。
window.VIDEOS = [];
