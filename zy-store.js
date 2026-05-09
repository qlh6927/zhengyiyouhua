/**
 * 郑医有话 — 统一数据接口
 * 根据 CONFIG.STORAGE_MODE 自动选择 local 或 cloud 后端
 * 所有页面只调用 zyStore，不直接调用 ZYData / SupabaseAdapter
 */
const zyStore = (() => {
    function _isCloud() {
        return CONFIG.STORAGE_MODE === 'cloud' &&
               CONFIG.SUPABASE_URL &&
               CONFIG.SUPABASE_KEY;
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

    return {
        isCloud: _isCloud,

        // ===== 文章 =====
        async getArticles(options) {
            if (_isCloud()) return await SupabaseAdapter.getArticles(options);
            return ZYData.getArticles(options);
        },

        async getAllArticles() {
            if (_isCloud()) return await SupabaseAdapter.getAllArticles();
            return ZYData.getAllArticles();
        },

        async getArticleById(id) {
            if (_isCloud()) return await SupabaseAdapter.getArticleById(id);
            return ZYData.getArticleById(id);
        },

        async saveArticle(article) {
            if (_isCloud()) return await SupabaseAdapter.saveArticle(article);
            return ZYData.saveArticle(article);
        },

        async deleteArticle(id) {
            if (_isCloud()) return await SupabaseAdapter.deleteArticle(id);
            return ZYData.deleteArticle(id);
        },

        // ===== 视频 =====
        async getVideos(options) {
            if (_isCloud()) return await SupabaseAdapter.getVideos(options);
            return ZYData.getVideos(options);
        },

        async getAllVideos() {
            if (_isCloud()) return await SupabaseAdapter.getAllVideos();
            return ZYData.getAllVideos();
        },

        async getVideoById(id) {
            if (_isCloud()) return await SupabaseAdapter.getVideoById(id);
            return ZYData.getVideoById(id);
        },

        async saveVideo(video) {
            if (_isCloud()) return await SupabaseAdapter.saveVideo(video);
            return ZYData.saveVideo(video);
        },

        async deleteVideo(id) {
            if (_isCloud()) return await SupabaseAdapter.deleteVideo(id);
            return ZYData.deleteVideo(id);
        },

        // ===== 分类 =====
        async getCategories() {
            if (_isCloud()) return await SupabaseAdapter.getCategories();
            return ZYData.getCategories();
        },

        async saveCategories(cats) {
            if (_isCloud()) return await SupabaseAdapter.saveCategories(cats);
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
