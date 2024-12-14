document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const gallery = document.getElementById('imageGallery');

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 处理文件选择
    fileInput.addEventListener('change', handleFiles);

    // 处理拖拽
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#666';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        const files = e.dataTransfer.files;
        handleFiles({ target: { files } });
    });

    // 处理文件上传
    function handleFiles(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                alert('请只上传图片文件！');
                return;
            }

            const formData = new FormData();
            formData.append('image', file);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addImageToGallery(data.imageUrl);
                } else {
                    alert('上传失败：' + data.message);
                }
            })
            .catch(error => {
                console.error('上传错误：', error);
                alert('上传出错，请重试');
            });
        });
    }

    // 添加图片到画廊
    function addImageToGallery(imageUrl) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = '上传的图片';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '删除';
        deleteBtn.onclick = () => deleteImage(imageUrl, div);
        
        div.appendChild(img);
        div.appendChild(deleteBtn);
        gallery.appendChild(div);
    }

    // 删除图片
    function deleteImage(imageUrl, element) {
        fetch('/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                element.remove();
            } else {
                alert('删除失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('删除错误：', error);
            alert('删除出错，请重试');
        });
    }

    // 页面加载时获取已有图片
    fetch('/images')
        .then(response => response.json())
        .then(data => {
            data.images.forEach(imageUrl => {
                addImageToGallery(imageUrl);
            });
        });

    // 导航切换
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;
            
            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 显示对应区域
            sections.forEach(section => {
                section.style.display = 
                    section.id === `${sectionId}-section` ? 'block' : 'none';
            });
        });
    });

    // 加载博客列表
    function loadPosts() {
        fetch('/api/posts')
            .then(response => response.json())
            .then(posts => {
                const postsList = document.getElementById('posts-list');
                const recentPosts = document.getElementById('recent-posts');
                
                // 清空现有内容
                postsList.innerHTML = '';
                recentPosts.innerHTML = '';
                
                // 渲染博客列表
                posts.forEach(post => {
                    postsList.innerHTML += `
                        <article class="post-item">
                            <h2 class="post-title">
                                <a href="javascript:void(0)" onclick="loadPost('${post.slug}')">${post.title}</a>
                            </h2>
                            <div class="post-meta">
                                ${new Date(post.date).toLocaleDateString()}
                            </div>
                            <div class="post-excerpt">
                                ${post.excerpt}
                            </div>
                            <div class="post-tags">
                                ${post.tags.map(tag => `
                                    <span class="tag">${tag}</span>
                                `).join('')}
                            </div>
                        </article>
                    `;
                });
                
                // 渲染最新文章列表
                posts.slice(0, 5).forEach(post => {
                    recentPosts.innerHTML += `
                        <li>
                            <a href="javascript:void(0)" onclick="loadPost('${post.slug}')">${post.title}</a>
                        </li>
                    `;
                });
            });
    }

    // 加载单篇博客
    window.loadPost = function(slug) {
        fetch(`/api/posts/${slug}`)
            .then(response => response.json())
            .then(post => {
                const postsList = document.getElementById('posts-list');
                const postContent = document.getElementById('post-content');
                
                // 隐藏文章列表，显示文章内容
                postsList.style.display = 'none';
                postContent.style.display = 'block';
                
                // 渲染文章内容
                postContent.innerHTML = `
                    <article class="post-content">
                        <h1>${post.title}</h1>
                        <div class="post-meta">
                            ${new Date(post.date).toLocaleDateString()}
                            ${post.tags.map(tag => `
                                <span class="tag">${tag}</span>
                            `).join('')}
                        </div>
                        <div class="post-body">
                            ${post.content}
                        </div>
                        <div class="post-navigation">
                            <button onclick="backToList()" class="back-btn">返回列表</button>
                        </div>
                    </article>
                `;
            });
    }

    // 返回列表函数
    window.backToList = function() {
        const postsList = document.getElementById('posts-list');
        const postContent = document.getElementById('post-content');
        postContent.style.display = 'none';
        postsList.style.display = 'block';
    }

    // 初始加载博客列表
    loadPosts();

    // 添加设置背景图片功能
    const setHeaderBg = document.getElementById('setHeaderBg');
    const header = document.getElementById('siteHeader');

    // 从localStorage加载保存的背景图片
    const savedBgImage = localStorage.getItem('headerBgImage');
    if (savedBgImage) {
        header.style.backgroundImage = `url(${savedBgImage})`;
    }

    setHeaderBg.addEventListener('click', () => {
        // 创建一个隐藏的文件输入
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);

                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // 设置背景图片
                        header.style.backgroundImage = `url(${data.imageUrl})`;
                        // 保存到localStorage
                        localStorage.setItem('headerBgImage', data.imageUrl);
                    } else {
                        alert('上传失败：' + data.message);
                    }
                })
                .catch(error => {
                    console.error('上传错误：', error);
                    alert('上传出错，请重试');
                });
            }
        };

        input.click();
    });

    // 视频上传和展示功能
    function initVideoUpload() {
        const videoDropZone = document.getElementById('videoDropZone');
        const videoInput = document.getElementById('videoInput');
        const videoGallery = document.getElementById('videoGallery');

        // 点击上传
        videoDropZone.addEventListener('click', () => {
            videoInput.click();
        });

        // 处理文件选择
        videoInput.addEventListener('change', handleVideoUpload);

        // 处理拖放
        videoDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            videoDropZone.style.borderColor = '#666';
        });

        videoDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            videoDropZone.style.borderColor = '#ccc';
        });

        videoDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            videoDropZone.style.borderColor = '#ccc';
            const files = e.dataTransfer.files;
            handleVideoUpload({ target: { files } });
        });

        // 加载视频列表
        loadVideos();
    }

    // 处理视频上传
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert('请上传视频文件！');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);

        fetch('/upload-video', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadVideos();
            } else {
                alert('上传失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('上传错误：', error);
            alert('上传出错，请重试');
        });
    }

    // 加载视频列表
    function loadVideos() {
        fetch('/videos')
            .then(response => response.json())
            .then(data => {
                const videoGallery = document.getElementById('videoGallery');
                videoGallery.innerHTML = '';

                data.videos.forEach(video => {
                    const videoItem = document.createElement('div');
                    videoItem.className = 'video-item';
                    videoItem.innerHTML = `
                        <video controls>
                            <source src="${video.url}" type="video/mp4">
                            您的浏览器不支持视频播放。
                        </video>
                        <div class="video-info">
                            <div class="video-title">${video.title}</div>
                            <div class="video-date">${new Date(video.date).toLocaleDateString()}</div>
                        </div>
                        <div class="video-controls">
                            <button class="video-delete" onclick="deleteVideo('${video.url}')">删除</button>
                        </div>
                    `;
                    videoGallery.appendChild(videoItem);
                });
            });
    }

    // 删除视频
    function deleteVideo(videoUrl) {
        if (!confirm('确定要删除这个视频吗？')) return;

        fetch('/delete-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoUrl })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadVideos();
            } else {
                alert('删除失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('删除错误：', error);
            alert('删除出错，请重试');
        });
    }

    // 在 DOMContentLoaded 事件中初始化视频功能
    initVideoUpload();
});
