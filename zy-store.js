/**
 * 郑医有话 — 统一数据接口（带缓存加速）
 * 
 * 云端模式下：
 * 1. 先从 localStorage 缓存读取（瞬间加载）
 * 2. 后台静默从 Supabase 拉取最新数据
 * 3. 更新缓存供下次使用
 * 
 * 这样国内用户首次访问需要等几秒，之后都是秒开。
 */
const zyStore = (() => {
    const CACHE_PREFIX = 'zy_cache_';
    const CACHE_TTL = 5 * 60 * 1000; // 缓存有效期 5 分钟

    function _isCloud() {
        return CONFIG.STORAGE_MODE === 'cloud' &&
               CONFIG.SUPABASE_URL &&
               CONFIG.SUPABASE_KEY;
    }

    // ===== 缓存工具 =====
    function _cacheSet(key, data) {
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                data: data,
                time: Date.now()
            }));
        } catch (e) {
            // localStorage 满了，清理旧缓存
            _clearOldCache();
        }
    }

    function _cacheGet(key) {
        try {
            const raw = localStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed.data;
        } catch (e) {
            return null;
        }
    }

    function _cacheIsFresh(key) {
        try {
            const raw = localStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            return (Date.now() - parsed.time) < CACHE_TTL;
        } catch (e) {
            return false;
        }
    }

    function _clearOldCache() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    }

    /**
     * 带缓存的云端读取
     * - 缓存新鲜 → 直接返回缓存，后台静默更新
     * - 缓存过期/无缓存 → 等待云端返回，同时写入缓存
     */
    async function _cachedFetch(cacheKey, fetchFn) {
        if (!_isCloud()) return await fetchFn();

        const cached = _cacheGet(cacheKey);
        const fresh = _cacheIsFresh(cacheKey);

        if (cached && fresh) {
            // 缓存新鲜，直接返回，后台静默更新
            fetchFn().then(data => {
                _cacheSet(cacheKey, data);
            }).catch(() => {});
            return cached;
        }

        if (cached) {
            // 缓存过期但存在，先返回旧数据，同时拉新数据
            fetchFn().then(data => {
                _cacheSet(cacheKey, data);
                // 如果数据有变化，触发页面刷新（可选）
            }).catch(() => {});
            return cached;
        }

        // 无缓存，必须等待
        const data = await fetchFn();
        _cacheSet(cacheKey, data);
        return data;
    }

    // ===== 本地模式：视频上传/读取封装 =====
    const _localVideoUpload = async function(id, file) {
        const key = id + '_video';
        await VideoStore.save(key, file);
        return { storageKey: key };
    };

    const _localVideoGetURL = async function(storageKey) {
        if (!storageKey) return null;
        return await VideoStore.getURL(storageKey);
    };

    const _localVideoDelete = async function(storageKey) {
        if (!storageKey) return;
        await VideoStore.remove(storageKey);
    };

    // ===== 云端模式：视频上传/读取封装 =====
    const _cloudVideoUpload = async function(id, file) {
        const ext = file.name.split('.').pop() || 'mp4';
        const path = id + '_' + Date.now() + '.' + ext;
        await SupabaseAdapter.uploadVideo(path, file);
        return { storagePath: path, storageKey: '' };
    };

    const _cloudVideoGetURL = function(storagePath) {
        if (!storagePath) return null;
        return SupabaseAdapter.getVideoURL(storagePath);
    };

    const _cloudVideoDelete = async function(storagePath) {
        if (!storagePath) return;
        await SupabaseAdapter.deleteVideoFile(storagePath);
    };

    // ===== 写操作后清除相关缓存 =====
    function _invalidateArticleCache() {
        localStorage.removeItem(CACHE_PREFIX + 'articles_all');
        localStorage.removeItem(CACHE_PREFIX + 'categories');
        // 清除所有分类缓存
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX + 'articles_')) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    }

    function _invalidateVideoCache() {
        localStorage.removeItem(CACHE_PREFIX + 'videos_all');
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX + 'videos_')) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    }

    return {
        isCloud: _isCloud,
        clearCache: _clearOldCache,

        // ===== 文章 =====
        async getArticles(options) {
            if (_isCloud()) {
                const cat = (options && options.category) || '全部';
                const cacheKey = 'articles_' + cat;
                return await _cachedFetch(cacheKey, () => SupabaseAdapter.getArticles(options));
            }
            return ZYData.getArticles(options);
        },

        async getAllArticles() {
            if (_isCloud()) {
                return await _cachedFetch('articles_all', () => SupabaseAdapter.getAllArticles());
            }
            return ZYData.getAllArticles();
        },

        async getArticleById(id) {
            // 单篇文章不缓存（需要最新内容）
            if (_isCloud()) return await SupabaseAdapter.getArticleById(id);
            return ZYData.getArticleById(id);
        },

        async saveArticle(article) {
            if (_isCloud()) {
                const result = await SupabaseAdapter.saveArticle(article);
                _invalidateArticleCache();
                return result;
            }
            return ZYData.saveArticle(article);
        },

        async deleteArticle(id) {
            if (_isCloud()) {
                const result = await SupabaseAdapter.deleteArticle(id);
                _invalidateArticleCache();
                return result;
            }
            return ZYData.deleteArticle(id);
        },

        // ===== 视频 =====
        async getVideos(options) {
            if (_isCloud()) {
                const cat = (options && options.category) || '全部';
                const cacheKey = 'videos_' + cat;
                return await _cachedFetch(cacheKey, () => SupabaseAdapter.getVideos(options));
            }
            return ZYData.getVideos(options);
        },

        async getAllVideos() {
            if (_isCloud()) {
                return await _cachedFetch('videos_all', () => SupabaseAdapter.getAllVideos());
            }
            return ZYData.getAllVideos();
        },

        async getVideoById(id) {
            if (_isCloud()) return await SupabaseAdapter.getVideoById(id);
            return ZYData.getVideoById(id);
        },

        async saveVideo(video) {
            if (_isCloud()) {
                const result = await SupabaseAdapter.saveVideo(video);
                _invalidateVideoCache();
                return result;
            }
            return ZYData.saveVideo(video);
        },

        async deleteVideo(id) {
            if (_isCloud()) {
                const result = await SupabaseAdapter.deleteVideo(id);
                _invalidateVideoCache();
                return result;
            }
            return ZYData.deleteVideo(id);
        },

        // ===== 分类 =====
        async getCategories() {
            if (_isCloud()) {
                return await _cachedFetch('categories', () => SupabaseAdapter.getCategories());
            }
            return ZYData.getCategories();
        },

        async saveCategories(cats) {
            if (_isCloud()) {
                const result = await SupabaseAdapter.saveCategories(cats);
                _cacheSet('categories', cats);
                return result;
            }
            return ZYData.saveCategories(cats);
        },

        // ===== 搜索 =====
        async search(keyword) {
            if (_isCloud()) return await SupabaseAdapter.search(keyword);
            return ZYData.search(keyword);
        },

        // ===== 视频文件上传 =====
        async uploadVideoFile(id, file) {
            if (_isCloud()) return await _cloudVideoUpload(id, file);
            return await _localVideoUpload(id, file);
        },

        async getVideoFileURL(articleOrVideo) {
            if (_isCloud()) {
                const path = articleOrVideo.videoStoragePath || articleOrVideo.storagePath;
                return _cloudVideoGetURL(path);
            }
            const key = articleOrVideo.videoStorageKey || articleOrVideo.storageKey;
            return await _localVideoGetURL(key);
        },

        async deleteVideoFile(item) {
            if (_isCloud()) {
                const path = item.videoStoragePath || item.storagePath;
                return await _cloudVideoDelete(path);
            }
            const key = item.videoStorageKey || item.storageKey;
            return await _localVideoDelete(key);
        },

        // ===== 管理员 =====
        async adminLogin(password) {
            if (_isCloud()) return await SupabaseAdapter.adminLogin(password);
            return ZYData.adminLogin(password);
        },

        isAdmin() {
            if (_isCloud()) return SupabaseAdapter.isAdmin();
            return ZYData.isAdmin();
        },

        adminLogout() {
            if (_isCloud()) SupabaseAdapter.adminLogout();
            else ZYData.adminLogout();
        },

        async changeAdminPassword(newPwd) {
            if (_isCloud()) return await SupabaseAdapter.changeAdminPassword(newPwd);
            return ZYData.changeAdminPassword(newPwd);
        }
    };
})();
