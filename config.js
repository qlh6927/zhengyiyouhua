/**
 * 郑医有话 — 全局配置文件
 * 
 * 【模式说明】
 * - LOCAL 模式（默认）：数据存浏览器本地，适合开发调试
 * - CLOUD 模式（Supabase）：数据存云端，所有人共享，适合正式上线
 * 
 * 【切换到云端模式】
 * 1. 注册 supabase.com，创建项目
 * 2. 创建数据库表（见下方 SQL 说明）
 * 3. 将 SUPABASE_URL 和 SUPABASE_KEY 填入下方
 * 4. 将 STORAGE_MODE 改为 'cloud'
 */
const CONFIG = {
    // ========== 存储模式 ==========
    // 'local' = 浏览器本地（默认）
    // 'cloud' = Supabase 云端（需配置下方的 URL 和 Key）
    STORAGE_MODE: 'cloud',

    // ========== Supabase 配置 ==========
    // 在 https://supabase.com 注册后获取
    SUPABASE_URL: 'https://fflfbkkpbmanobihpwnu.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbGZia2twYm1hbm9iaWhwd251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDM2NjgsImV4cCI6MjA5MzgxOTY2OH0.twlkigRyNhTJZ5SRuDunzl5N38Rwwp9xh7lFhVPkzpA',

    // ========== Supabase Storage 桶名 ==========
    // 在 Supabase Dashboard → Storage 中创建的桶
    VIDEO_BUCKET: 'videos',

    // ========== 网站信息 ==========
    SITE_NAME: '郑医有话',
    SITE_DESC: '新生儿科医生 ｜ 用专业守护每一个新生命',

    // ========== 管理后台 ==========
    // 本地模式密码存浏览器，云端模式密码存数据库
    DEFAULT_ADMIN_PASSWORD: 'zhengyi2026',

    // ========== 分页 ==========
    PAGE_SIZE: 6
};

/**
 * Supabase 建表 SQL（在 Supabase Dashboard → SQL Editor 中执行）：
 *
 * -- 文章表
 * CREATE TABLE articles (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   "desc" TEXT,
 *   category TEXT,
 *   content TEXT,
 *   "videoUrl" TEXT,
 *   "videoEmbedCode" TEXT,
 *   "videoStoragePath" TEXT,
 *   date TEXT,
 *   published BOOLEAN DEFAULT true,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 视频表
 * CREATE TABLE videos (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   "desc" TEXT,
 *   category TEXT,
 *   url TEXT,
 *   "embedCode" TEXT,
 *   "storagePath" TEXT,
 *   date TEXT,
 *   published BOOLEAN DEFAULT true,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 分类表
 * CREATE TABLE categories (
 *   id SERIAL PRIMARY KEY,
 *   name TEXT NOT NULL UNIQUE,
 *   sort_order INTEGER DEFAULT 0
 * );
 *
 * -- 管理密码表
 * CREATE TABLE admin_config (
 *   key TEXT PRIMARY KEY,
 *   value TEXT NOT NULL
 * );
 * INSERT INTO admin_config (key, value) VALUES ('password', 'zhengyi2026');
 *
 * -- 开启 RLS（行级安全），允许匿名读取，仅认证用户写入
 * ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
 *
 * -- 允许所有人读取已发布内容
 * CREATE POLICY "public_read_articles" ON articles FOR SELECT USING (true);
 * CREATE POLICY "public_read_videos" ON videos FOR SELECT USING (true);
 * CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
 *
 * -- 允许匿名写入（用 Supabase 的 anon key 即可操作）
 * -- 注意：生产环境建议改为 RLS + 认证策略
 * CREATE POLICY "anon_all_articles" ON articles FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "anon_all_videos" ON videos FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "anon_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "anon_all_admin_config" ON admin_config FOR ALL USING (true) WITH CHECK (true);
 *
 * -- 创建 Storage 桶
 * INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
 *
 * -- 允许匿名上传/读取视频文件
 * CREATE POLICY "anon_upload_videos" ON storage.objects FOR ALL
 *   USING (bucket_id = 'videos') WITH CHECK (bucket_id = 'videos');
 */
