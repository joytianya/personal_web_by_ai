const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const marked = require('marked');
const matter = require('gray-matter');

const app = express();
const port = 3000;

// 增加 express 的请求体大小限制
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// 指定图片上传目录
const UPLOAD_DIR = path.join(__dirname, 'public/uploads');

// 配置静态文件服务
app.use(express.static('public'));
app.use(express.json());

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 这里可以根据不同的条件设置不同的上传目录
        const today = new Date();
        const monthDir = path.join(UPLOAD_DIR, `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
        
        // 确保月份目录存在
        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir, { recursive: true });
        }
        
        cb(null, monthDir);
    },
    filename: (req, file, cb) => {
        // 生成文件名: 时间戳-原始���件名
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // 检查文件类型
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    }
});

// 配置视频上传
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const videoDir = path.join(__dirname, 'public/uploads/videos');
        if (!fs.existsSync(videoDir)){
            fs.mkdirSync(videoDir, { recursive: true });
        }
        cb(null, videoDir);
    },
    filename: (req, file, cb) => {
        cb(null, `video-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
            return cb(new Error('只允许上传视频文件！'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 增加到 500MB
    }
});

// 路由配置
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// 上传图片
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            throw new Error('没有收到文件');
        }

        // 构建相对于public目录的URL路径
        const relativePath = path.relative(
            path.join(__dirname, 'public'),
            req.file.path
        ).replace(/\\/g, '/');

        res.json({
            success: true,
            imageUrl: '/' + relativePath
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 上传视频
app.post('/upload-video', videoUpload.single('video'), (req, res) => {
    try {
        res.json({
            success: true,
            videoUrl: '/uploads/videos/' + req.file.filename,
            title: req.file.originalname
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 获取所有图片
app.get('/images', (req, res) => {
    const images = [];
    
    // 递归读取上传目录下的所有图片
    function readImagesRecursively(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                readImagesRecursively(fullPath);
            } else if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
                // 构建相对于public目录的URL路径
                const relativePath = path.relative(
                    path.join(__dirname, 'public'),
                    fullPath
                ).replace(/\\/g, '/');
                
                images.push('/' + relativePath);
            }
        });
    }

    try {
        readImagesRecursively(UPLOAD_DIR);
        res.json({ images });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取图片列表失败',
            error: error.message
        });
    }
});

// 获取视频列表
app.get('/videos', (req, res) => {
    const videoDir = path.join(__dirname, 'public/uploads/videos');
    try {
        if (!fs.existsSync(videoDir)) {
            return res.json({ videos: [] });
        }
        const files = fs.readdirSync(videoDir);
        const videos = files
            .filter(file => file.match(/\.(mp4|webm|ogg)$/i))
            .map(file => ({
                url: '/uploads/videos/' + file,
                title: file.split('-')[1],
                date: fs.statSync(path.join(videoDir, file)).mtime
            }));
        res.json({ videos });
    } catch (error) {
        res.status(500).json({ error: '获取视频列表失败' });
    }
});

// 删除图片
app.post('/delete', (req, res) => {
    const imageUrl = req.body.imageUrl;
    const imagePath = path.join(__dirname, 'public', imageUrl);
    
    try {
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            
            // 检查并删除空目录
            const dir = path.dirname(imagePath);
            if (fs.readdirSync(dir).length === 0) {
                fs.rmdirSync(dir);
            }
            
            res.json({ success: true });
        } else {
            throw new Error('文件不存在');
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '删除失败: ' + error.message
        });
    }
});

// 删除视频
app.post('/delete-video', (req, res) => {
    const videoUrl = req.body.videoUrl;
    const videoPath = path.join(__dirname, 'public', videoUrl);
    
    try {
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            res.json({ success: true });
        } else {
            throw new Error('视频不存在');
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '删除失败: ' + error.message
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器错误: ' + err.message
    });
});

// 配置 marked
marked.setOptions({
    breaks: true,  // 支持 GitHub 风格的换行符
    gfm: true,     // 启用 GitHub 风格的 Markdown
});

// 获取博客列表
app.get('/api/posts', (req, res) => {
    const postsDirectory = path.join(__dirname, 'posts');
    
    try {
        const files = fs.readdirSync(postsDirectory);
        const posts = files
            .filter(file => file.endsWith('.md'))
            .map(file => {
                const fullPath = path.join(postsDirectory, file);
                const fileContents = fs.readFileSync(fullPath, 'utf8');
                const { data, content } = matter(fileContents);
                
                return {
                    slug: file.replace('.md', ''),
                    title: data.title || '无标题',
                    date: data.date || new Date(),
                    excerpt: data.excerpt || content.slice(0, 200),
                    tags: data.tags || [],
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: '获取博客列表失败' });
    }
});

// 获取单篇博客内容
app.get('/api/posts/:slug', (req, res) => {
    const { slug } = req.params;
    const fullPath = path.join(__dirname, 'posts', `${slug}.md`);
    
    try {
        if (!fs.existsSync(fullPath)) {
            throw new Error('文章不存在');
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);
        
        // 使用 marked 将 markdown 转换为 HTML
        const htmlContent = marked.parse(content);
        
        res.json({
            title: data.title || '无标题',
            date: data.date || new Date(),
            content: htmlContent,
            tags: data.tags || [],
        });
    } catch (error) {
        console.error('Error loading post:', error);
        res.status(404).json({ 
            error: '博客不存在',
            details: error.message 
        });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log(`图片上传目录: ${UPLOAD_DIR}`);
});
