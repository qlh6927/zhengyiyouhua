#!/bin/bash
# 郑医有话 — 一键部署脚本
# 适用于：阿里云 Ubuntu 24.04 LTS

set -e

echo "=========================================="
echo "  郑医有话网站一键部署脚本"
echo "=========================================="

# 1. 更新系统
echo "[1/6] 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Nginx
echo "[2/6] 安装 Nginx..."
apt install -y nginx

# 3. 安装 SQLite（轻量数据库）
echo "[3/6] 安装 SQLite..."
apt install -y sqlite3

# 4. 创建网站目录
echo "[4/6] 创建网站目录..."
mkdir -p /var/www/zhengyiyouhua

# 5. 下载网站文件（从 GitHub）
echo "[5/6] 下载网站文件..."
cd /var/www/zhengyiyouhua
apt install -y git
git clone https://github.com/qlh6927/zhengyiyouhua.git temp_repo
cp -r temp_repo/* .
rm -rf temp_repo

# 6. 配置 Nginx
echo "[6/6] 配置 Nginx..."
cat > /etc/nginx/sites-available/zhengyiyouhua << 'EOF'
server {
    listen 80;
    server_name _;  # 备案通过后改为 zhengyiyouhua.com www.zhengyiyouhua.com
    
    root /var/www/zhengyiyouhua;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    
    # 主页
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# 启用站点配置
ln -sf /etc/nginx/sites-available/zhengyiyouhua /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启 Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# 创建 SQLite 数据库
echo "创建数据库..."
sqlite3 /var/www/zhengyiyouhua/zhengyiyouhua.db << 'EOF'
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    content TEXT,
    video_url TEXT,
    video_embed_code TEXT,
    video_storage_key TEXT,
    video_storage_path TEXT,
    date TEXT,
    published BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    url TEXT,
    embed_code TEXT,
    storage_key TEXT,
    storage_path TEXT,
    date TEXT,
    published BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 插入默认管理密码（SHA-256 哈希）
INSERT OR IGNORE INTO admin_config (key, value) VALUES ('password', '4a246ecc3d477378bb5ca04032a7a9fed4c07c1bd61ac63362ee03d23172abaf');

-- 插入默认分类
INSERT OR IGNORE INTO categories (name, sort_order) VALUES 
    ('新生儿护理', 0),
    ('喂养指导', 1),
    ('黄疸', 2),
    ('早产儿', 3),
    ('睡眠', 4),
    ('其他', 5);

-- 插入默认文章
INSERT OR IGNORE INTO articles (id, title, description, category, content, date, published) VALUES
    ('art_001', '新生儿黄疸：新手父母必读指南', '了解生理性黄疸与病理性黄疸的区别，学会判断何时需要就医。', '黄疸', '<h2>什么是新生儿黄疸？</h2><p>新生儿黄疸是指新生儿时期，由于胆红素代谢异常，引起血中胆红素水平升高。</p><h2>生理性黄疸 vs 病理性黄疸</h2><p><strong>生理性黄疸</strong>：通常在出生后 2-3 天出现，4-5 天达到高峰，7-10 天消退。</p><p><strong>病理性黄疸</strong>：出生后 24 小时内出现，或黄疸程度过重，需要及时就医。</p>', '2026-05-01', 1),
    ('art_002', '早产儿出院后护理要点', '早产宝宝回家后的喂养、保暖、随访注意事项。', '早产儿', '<h2>早产儿出院标准</h2><p>体重达到 2000g 以上，能维持正常体温，能自主吸吮和吞咽。</p><h2>居家环境</h2><p>室温保持在 24-26°C，湿度 50-60%。</p>', '2026-04-28', 1),
    ('art_003', '母乳喂养常见误区', '关于初乳、喂养频率、奶量判断的科学解读。', '喂养指导', '<h2>误区一：初乳颜色黄就不干净</h2><p>初乳被称为液体黄金，富含免疫球蛋白和抗体。</p>', '2026-04-25', 1),
    ('art_004', '新生儿脐带护理全攻略', '消毒方法、异常信号识别、何时需要就医。', '新生儿护理', '<h2>脐带护理原则</h2><p>保持脐带残端清洁干燥。</p>', '2026-04-20', 1),
    ('art_005', '宝宝哭闹不止？可能是肠绞痛', '识别肠绞痛症状，实用缓解方法分享。', '新生儿护理', '<h2>什么是肠绞痛？</h2><p>肠绞痛是新生儿期常见的功能性胃肠疾病。</p>', '2026-04-15', 1),
    ('art_006', '新生儿睡眠规律与安全睡姿', '建立健康睡眠习惯，预防婴儿猝死综合征。', '睡眠', '<h2>新生儿睡眠特点</h2><p>新生儿每天睡 16-20 小时。</p>', '2026-04-10', 1);

-- 插入默认视频
INSERT OR IGNORE INTO videos (id, title, description, category, date, published) VALUES
    ('vid_001', '新生儿黄疸居家观察指南', '3分钟教你判断宝宝黄疸程度', '黄疸', '2026-05-01', 1),
    ('vid_002', '正确的母乳喂养姿势', '四种常用哺乳姿势演示', '喂养指导', '2026-04-25', 1),
    ('vid_003', '新生儿脐带消毒实操', '手把手教你脐带护理', '新生儿护理', '2026-04-20', 1);
EOF

# 设置权限
chown -R www-data:www-data /var/www/zhengyiyouhua
chmod -R 755 /var/www/zhengyiyouhua

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "网站地址：http://121.41.211.24"
echo "管理后台：http://121.41.211.24/admin.html"
echo "管理密码：ijnokm95162"
echo ""
echo "数据库位置：/var/www/zhengyiyouhua/zhengyiyouhua.db"
echo ""
echo "备案通过后，需要："
echo "1. 修改 /etc/nginx/sites-available/zhengyiyouhua"
echo "   将 server_name _ 改为 server_name zhengyiyouhua.com www.zhengyiyouhua.com"
echo "2. 运行 nginx -t && systemctl restart nginx"
echo "3. 在域名管理后台添加 A 记录指向 121.41.211.24"
echo ""
