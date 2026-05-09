/**
 * 郑医有话 — 统一数据接口
 * 根据 CONFIG.STORAGE_MODE 自动选择后端
 * 'local'  → ZYData（浏览器 localStorage）
 * 'server' → ServerAdapter（自建服务器 API + SQLite）
 * 'cloud'  → SupabaseAdapter（Supabase 云端）
 */
const zyStore = (() => {
    function _getBackend() {
        if (CONFIG.STORAGE_MODE === 'server') return ServerAdapter;
        if (CONFIG.STORAGE_MODE === 'cloud' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) return SupabaseAdapter;
        return ZYData;
    }

    function _isLocal() {
        return CONFIG.STORAGE_MODE === 'local';
    }

    return {
        getBackend: () => CONFIG.STORAGE_MODE,

        // ===== 文章 =====
        async getArticles(options) {
            return await _getBackend().getArticles(options);
        },

        async getAllArticles() {
            return await _getBackend().getAllArticles();
        },

        async getArticleById(id) {
            return await _getBackend().getArticleById(id);
        },

        async saveArticle(article) {
            return await _getBackend().saveArticle(article);
        },

        async deleteArticle(id) {
            return await _getBackend().deleteArticle(id);
        },

        // ===== 视频 =====
        async getVideos(options) {
            return await _getBackend().getVideos(options);
        },

        async getAllVideos() {
            return await _getBackend().getAllVideos();
        },

        async getVideoById(id) {
            return await _getBackend().getVideoById(id);
        },

        async saveVideo(video) {
            return await _getBackend().saveVideo(video);
        },

        async deleteVideo(id) {
            return await _getBackend().deleteVideo(id);
        },

        // ===== 分类 =====
        async getCategories() {
            return await _getBackend().getCategories();
        },

        async saveCategories(cats) {
            return await _getBackend().saveCategories(cats);
        },

        // ===== 搜索 =====
        async search(keyword) {
            return await _getBackend().search(keyword);
        },

        // ===== 视频文件上传 =====
        async uploadVideoFile(id, file) {
            const backend = _getBackend();
            if (backend.uploadVideoFile) return await backend.uploadVideoFile(id, file);
            throw new Error('当前模式不支持视频文件上传');
        },

        async getVideoFileURL(item) {
            const backend = _getBackend();
            if (backend.getVideoFileURL) return await backend.getVideoFileURL(item);
            return null;
        },

        async deleteVideoFile(item) {
            const backend = _getBackend();
            if (backend.deleteVideoFile) return await backend.deleteVideoFile(item);
        },

        // ===== 管理员 =====
        async adminLogin(password) {
            return await _getBackend().adminLogin(password);
        },

        isAdmin() {
            return sessionStorage.getItem('zy_admin') === '1';
        },

        adminLogout() {
            sessionStorage.removeItem('zy_admin');
        },

        async changeAdminPassword(newPwd) {
            return await _getBackend().changeAdminPassword(newPwd);
        }
    };
})();
