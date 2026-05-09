/**
 * 郑医有话 — 全局配置文件
 */
const CONFIG = {
    // ========== 存储模式 ==========
    // 'local'  = 浏览器本地（开发调试）
    // 'server' = 自建服务器 API（国内部署推荐）
    // 'cloud'  = Supabase 云端（海外）
    STORAGE_MODE: 'server',

    // ========== 自建服务器 API ==========
    // 同域部署时留空即可（自动使用当前域名）
    API_BASE_URL: '',

    // ========== Supabase 配置（cloud 模式用）==========
    SUPABASE_URL: 'https://fflfbkkpbmanobihpwnu.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbGZia2twYm1hbm9iaWhwd251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDM2NjgsImV4cCI6MjA5MzgxOTY2OH0.twlkigRyNhTJZ5SRuDunzl5N38Rwwp9xh7lFhVPkzpA',
    VIDEO_BUCKET: 'videos',

    // ========== 网站信息 ==========
    SITE_NAME: '郑医有话',
    SITE_DESC: '新生儿科医生 ｜ 用专业守护每一个新生命',

    // ========== 管理后台 ==========
    DEFAULT_ADMIN_PASSWORD: 'ijnokm95162',

    // ========== 分页 ==========
    PAGE_SIZE: 6
};
