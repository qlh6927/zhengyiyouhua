#!/bin/bash
# 郑医有话 — 更新脚本（在服务器上执行）
set -e

echo "=========================================="
echo "  更新网站文件 + 启动 API 服务"
echo "=========================================="

# 1. 更新网站文件
echo "[1/4] 更新网站文件..."
cd /var/www/zhengyiyouhua
git fetch --all
git reset --hard origin/main

# 2. 安装 Python3 pip（如果还没有）
echo "[2/4] 检查 Python 环境..."
apt install -y python3 python3-pip > /dev/null 2>&1 || true

# 3. 启动 API 服务（后台运行）
echo "[3/4] 启动 API 服务..."
# 先杀掉旧的 API 进程
pkill -f "python3.*api_server.py" 2>/dev/null || true
sleep 1
# 后台启动
nohup python3 /var/www/zhengyiyouhua/api_server.py > /var/log/zy-api.log 2>&1 &
echo "API 服务已启动，PID: $!"

# 4. 配置 Nginx 反向代理（将 /api 请求转发到 Python 服务）
echo "[4/4] 配置 Nginx..."
cat > /etc/nginx/sites-available/zhengyiyouhua << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/zhengyiyouhua;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    
    # API 请求转发到 Python 服务
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

nginx -t
systemctl restart nginx

# 5. 设置 API 服务开机自启
cat > /etc/systemd/system/zy-api.service << 'EOF'
[Unit]
Description=ZhengYiYouHua API Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /var/www/zhengyiyouhua/api_server.py
WorkingDirectory=/var/www/zhengyiyouhua
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable zy-api
systemctl restart zy-api

echo ""
echo "=========================================="
echo "  更新完成！"
echo "=========================================="
echo ""
echo "API 服务状态："
systemctl status zy-api --no-pager -l | head -5
echo ""
echo "网站地址：http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP')"
echo "管理后台：http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP')/admin.html"
echo ""
