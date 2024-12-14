# 个人图片展示网站

## 项目简介
这是一个简单的个人网站，支持图片上传和展示功能。用户可以轻松上传自己喜欢的图片，并在网站上进行展示。

## 主要功能
1. 图片上传
   - 支持常见图片格式（JPG、PNG、GIF等）
   - 支持拖拽上传
   - 支持预览
2. 图片展示
   - 网格布局展示所有上传的图片
   - 点击图片可以查看大图
   - 支持删除已上传的图片

## 技术栈
- 前端：HTML5, CSS3, JavaScript
- 后端：Node.js + Express
- 数据存储：本地文件系统

## 使用说明
1. 安装依赖：`npm install`
2. 启动服务器：`npm start`
3. 访问网址：`http://localhost:3000`


project/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── uploads/
├── views/
│   └── index.html
├── server.js
├── package.json
└── README.md