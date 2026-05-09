/**
 * 郑医有话 — Supabase 云端适配器
 * 数据库列名使用 camelCase（与 data.js 一致）
 */
const SupabaseAdapter = (() => {
    function _headers(extra) {
        return Object.assign({
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }, extra || {});
    }

    function _baseURL() {
        return CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1';
    }

    // SHA-256 哈希（用于密码加密比对）
    async function _sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function _fetch(path, options) {
        const url = _baseURL() + path;
        // 合并默认 headers（GET 请求也需要 apikey）
        const mergedOptions = Object.assign({}, options || {});
        mergedOptions.headers = Object.assign({}, _headers(), mergedOptions.headers || {});
        const resp = await fetch(url, mergedOptions);
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error('Supabase API error: ' + resp.status + ' ' + text);
        }
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            return resp.json();
        }
        return null;
    }

    // 列名直接和 data.js 驼峰保持一致
    function _mapArticle(row) {
        return {
            id: row.id,
            title: row.title || '',
            desc: row.desc || '',
            category: row.category || '',
            content: row.content || '',
            videoUrl: row.videoUrl || '',
            videoEmbedCode: row.videoEmbedCode || '',
            videoStorageKey: row.videoStorageKey || '',
            videoStoragePath: row.videoStoragePath || '',
            date: row.date || '',
            published: row.published !== false
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

    function _mapVideo(row) {
        return {
            id: row.id,
            title: row.title || '',
            desc: row.desc || '',
            category: row.category || '',
            url: row.url || '',
            embedCode: row.embedCode || '',
            storageKey: row.storageKey || '',
            storagePath: row.storagePath || '',
            date: row.date || '',
            published: row.published !== false
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

    return {
        // ===== 文章 =====
        async getArticles(options) {
            let query = '?published=eq.true&order=date.desc';
            if (options && options.category && options.category !== '全部') {
                query += '&category=eq.' + encodeURIComponent(options.category);
            }
            if (options && options.keyword) {
                const kw = options.keyword;
                query += '&or=(title.ilike.*' + encodeURIComponent(kw) + '*,desc.ilike.*' + encodeURIComponent(kw) + '*,content.ilike.*' + encodeURIComponent(kw) + '*)';
            }
            const data = await _fetch('/articles' + query);
            return data.map(_mapArticle);
        },

        async getAllArticles() {
            const data = await _fetch('/articles?order=date.desc');
            return data.map(_mapArticle);
        },

        async getArticleById(id) {
            const data = await _fetch('/articles?id=eq.' + encodeURIComponent(id));
            return data.length > 0 ? _mapArticle(data[0]) : null;
        },

        async saveArticle(article) {
            const row = _unmapArticle(article);
            const existing = await _fetch('/articles?id=eq.' + encodeURIComponent(article.id));
            if (existing.length > 0) {
                await _fetch('/articles?id=eq.' + encodeURIComponent(article.id), {
                    method: 'PATCH',
                    headers: _headers(),
                    body: JSON.stringify(row)
                });
            } else {
                await _fetch('/articles', {
                    method: 'POST',
                    headers: _headers(),
                    body: JSON.stringify(row)
                });
            }
        },

        async deleteArticle(id) {
            await _fetch('/articles?id=eq.' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: _headers()
            });
        },

        // ===== 视频 =====
        async getVideos(options) {
            let query = '?published=eq.true&order=date.desc';
            if (options && options.category && options.category !== '全部') {
                query += '&category=eq.' + encodeURIComponent(options.category);
            }
            if (options && options.keyword) {
                const kw = options.keyword;
                query += '&or=(title.ilike.*' + encodeURIComponent(kw) + '*,desc.ilike.*' + encodeURIComponent(kw) + '*)';
            }
            const data = await _fetch('/videos' + query);
            return data.map(_mapVideo);
        },

        async getAllVideos() {
            const data = await _fetch('/videos?order=date.desc');
            return data.map(_mapVideo);
        },

        async getVideoById(id) {
            const data = await _fetch('/videos?id=eq.' + encodeURIComponent(id));
            return data.length > 0 ? _mapVideo(data[0]) : null;
        },

        async saveVideo(video) {
            const row = _unmapVideo(video);
            const existing = await _fetch('/videos?id=eq.' + encodeURIComponent(video.id));
            if (existing.length > 0) {
                await _fetch('/videos?id=eq.' + encodeURIComponent(video.id), {
                    method: 'PATCH',
                    headers: _headers(),
                    body: JSON.stringify(row)
                });
            } else {
                await _fetch('/videos', {
                    method: 'POST',
                    headers: _headers(),
                    body: JSON.stringify(row)
                });
            }
        },

        async deleteVideo(id) {
            await _fetch('/videos?id=eq.' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: _headers()
            });
        },

        // ===== 分类 =====
        async getCategories() {
            const data = await _fetch('/categories?order=sort_order.asc');
            const cats = data.map(r => r.name);
            return ['全部', ...cats];
        },

        async saveCategories(cats) {
            await _fetch('/categories', { method: 'DELETE', headers: _headers() });
            const rows = cats.filter(c => c !== '全部').map((name, i) => ({ name, sort_order: i }));
            if (rows.length > 0) {
                await _fetch('/categories', {
                    method: 'POST',
                    headers: _headers(),
                    body: JSON.stringify(rows)
                });
            }
        },

        // ===== 搜索 =====
        async search(keyword) {
            const kw = keyword.toLowerCase().trim();
            if (!kw) return { articles: [], videos: [] };
            const [articles, videos] = await Promise.all([
                this.getArticles({ keyword: kw }),
                this.getVideos({ keyword: kw })
            ]);
            return { articles, videos };
        },

        // ===== 视频文件存储 =====
        async uploadVideo(path, file) {
            const url = CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/storage/v1/object/' + CONFIG.VIDEO_BUCKET + '/' + path;
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.SUPABASE_KEY,
                    'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
                },
                body: file
            });
            if (!resp.ok) throw new Error('Upload failed: ' + resp.status);
            return { path };
        },

        getVideoURL(path) {
            if (!path) return null;
            return CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/storage/v1/object/public/' + CONFIG.VIDEO_BUCKET + '/' + path;
        },

        async deleteVideoFile(path) {
            if (!path) return;
            const url = CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/storage/v1/object/' + CONFIG.VIDEO_BUCKET + '/' + path;
            await fetch(url, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_KEY,
                    'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
                }
            });
        },

        // ===== 管理员 =====
        async adminLogin(password) {
            const hashed = await _sha256(password);
            const data = await _fetch('/admin_config?key=eq.password');
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
            await _fetch('/admin_config?key=eq.password', {
                method: 'PATCH',
                headers: _headers(),
                body: JSON.stringify({ value: hashed })
            });
        }
    };
})();
