/**
 * 郑医有话 — 自建服务器 API 适配器
 * 对接 Python API 服务（SQLite 数据库在本机）
 */
const ServerAdapter = (() => {
    function _apiBase() {
        return CONFIG.API_BASE_URL || window.location.origin;
    }

    async function _fetch(path, options) {
        const url = _apiBase() + path;
        const resp = await fetch(url, Object.assign({
            headers: { 'Content-Type': 'application/json' }
        }, options || {}));
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error('API error: ' + resp.status + ' ' + text);
        }
        return resp.json();
    }

    // 字段映射：DB snake_case → JS camelCase
    function _mapArticle(row) {
        if (!row) return null;
        return {
            id: row.id,
            title: row.title || '',
            desc: row.description || '',
            category: row.category || '',
            content: row.content || '',
            videoUrl: row.video_url || '',
            videoEmbedCode: row.video_embed_code || '',
            videoStorageKey: row.video_storage_key || '',
            videoStoragePath: row.video_storage_path || '',
            date: row.date || '',
            published: row.published !== 0
        };
    }

    function _mapVideo(row) {
        if (!row) return null;
        return {
            id: row.id,
            title: row.title || '',
            desc: row.description || '',
            category: row.category || '',
            url: row.url || '',
            embedCode: row.embed_code || '',
            storageKey: row.storage_key || '',
            storagePath: row.storage_path || '',
            date: row.date || '',
            published: row.published !== 0
        };
    }

    function _unmapArticle(a) {
        return {
            id: a.id,
            title: a.title,
            desc: a.desc || '',
            category: a.category || '',
            content: a.content || '',
            videoUrl: a.videoUrl || '',
            videoEmbedCode: a.videoEmbedCode || '',
            videoStorageKey: a.videoStorageKey || '',
            videoStoragePath: a.videoStoragePath || '',
            date: a.date || '',
            published: a.published !== false
        };
    }

    function _unmapVideo(v) {
        return {
            id: v.id,
            title: v.title,
            desc: v.desc || '',
            category: v.category || '',
            url: v.url || '',
            embedCode: v.embedCode || '',
            storageKey: v.storageKey || '',
            storagePath: v.storagePath || '',
            date: v.date || '',
            published: v.published !== false
        };
    }

    async function _sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return {
        // ===== 文章 =====
        async getArticles(options) {
            let query = '';
            if (options) {
                const params = [];
                if (options.category && options.category !== '全部') params.push('category=' + encodeURIComponent(options.category));
                if (options.keyword) params.push('keyword=' + encodeURIComponent(options.keyword));
                if (params.length) query = '?' + params.join('&');
            }
            const data = await _fetch('/api/articles' + query);
            if (Array.isArray(data)) return data.map(_mapArticle);
            return [];
        },

        async getAllArticles() {
            const data = await _fetch('/api/articles/all');
            return Array.isArray(data) ? data.map(_mapArticle) : [];
        },

        async getArticleById(id) {
            const data = await _fetch('/api/articles?id=' + encodeURIComponent(id));
            return _mapArticle(data);
        },

        async saveArticle(article) {
            const row = _unmapArticle(article);
            const existing = await _fetch('/api/articles?id=' + encodeURIComponent(article.id));
            if (existing) {
                await _fetch('/api/articles?id=' + encodeURIComponent(article.id), {
                    method: 'PATCH',
                    body: JSON.stringify(row)
                });
            } else {
                await _fetch('/api/articles', {
                    method: 'POST',
                    body: JSON.stringify(row)
                });
            }
        },

        async deleteArticle(id) {
            await _fetch('/api/articles?id=' + encodeURIComponent(id), {
                method: 'DELETE'
            });
        },

        // ===== 视频 =====
        async getVideos(options) {
            let query = '';
            if (options) {
                const params = [];
                if (options.category && options.category !== '全部') params.push('category=' + encodeURIComponent(options.category));
                if (options.keyword) params.push('keyword=' + encodeURIComponent(options.keyword));
                if (params.length) query = '?' + params.join('&');
            }
            const data = await _fetch('/api/videos' + query);
            return Array.isArray(data) ? data.map(_mapVideo) : [];
        },

        async getAllVideos() {
            const data = await _fetch('/api/videos/all');
            return Array.isArray(data) ? data.map(_mapVideo) : [];
        },

        async getVideoById(id) {
            const data = await _fetch('/api/videos?id=' + encodeURIComponent(id));
            return _mapVideo(data);
        },

        async saveVideo(video) {
            const row = _unmapVideo(video);
            const existing = await _fetch('/api/videos?id=' + encodeURIComponent(video.id));
            if (existing) {
                await _fetch('/api/videos?id=' + encodeURIComponent(video.id), {
                    method: 'PATCH',
                    body: JSON.stringify(row)
                });
            } else {
                await _fetch('/api/videos', {
                    method: 'POST',
                    body: JSON.stringify(row)
                });
            }
        },

        async deleteVideo(id) {
            await _fetch('/api/videos?id=' + encodeURIComponent(id), {
                method: 'DELETE'
            });
        },

        // ===== 分类 =====
        async getCategories() {
            return await _fetch('/api/categories');
        },

        async saveCategories(cats) {
            await _fetch('/api/categories', {
                method: 'POST',
                body: JSON.stringify(cats)
            });
        },

        // ===== 搜索 =====
        async search(keyword) {
            const data = await _fetch('/api/search?keyword=' + encodeURIComponent(keyword));
            return {
                articles: (data.articles || []).map(_mapArticle),
                videos: (data.videos || []).map(_mapVideo)
            };
        },

        // ===== 视频文件（暂不支持上传到服务器）=====
        async uploadVideoFile(id, file) {
            throw new Error('服务器模式暂不支持视频文件上传，请使用视频链接或嵌入代码');
        },

        getVideoFileURL() {
            return null;
        },

        async deleteVideoFile() {},

        // ===== 管理员 =====
        async adminLogin(password) {
            const hashed = await _sha256(password);
            const data = await _fetch('/api/admin/config?key=password');
            if (data.length > 0 && data[0].value === hashed) {
                sessionStorage.setItem('zy_admin', '1');
                return true;
            }
            return false;
        },

        isAdmin() {
            return sessionStorage.getItem('zy_admin') === '1';
        },

        adminLogout() {
            sessionStorage.removeItem('zy_admin');
        },

        async changeAdminPassword(newPwd) {
            const hashed = await _sha256(newPwd);
            await _fetch('/api/admin/config?key=password', {
                method: 'PATCH',
                body: JSON.stringify({ value: hashed })
            });
        }
    };
})();
