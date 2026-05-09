#!/usr/bin/env python3
"""
郑医有话 — 轻量 REST API 服务
基于 Python3 + SQLite，无需安装额外依赖
"""
import json
import sqlite3
import hashlib
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB_PATH = '/var/www/zhengyiyouhua/zhengyiyouhua.db'
PORT = 8000

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    return dict(row) if row else None

def dicts_from_rows(rows):
    return [dict(r) for r in rows]

class APIHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'application/json; charset=utf-8')

    def _json_response(self, data, status=200):
        self.send_response(status)
        self._cors()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        db = get_db()

        try:
            # ===== 文章 =====
            if path == '/api/articles':
                if 'id' in params:
                    row = db.execute('SELECT * FROM articles WHERE id=?', (params['id'][0],)).fetchone()
                    self._json_response(dict_from_row(row) if row else None)
                else:
                    sql = 'SELECT * FROM articles WHERE published=1'
                    args = []
                    if 'category' in params and params['category'][0] != '全部':
                        sql += ' AND category=?'
                        args.append(params['category'][0])
                    if 'keyword' in params:
                        kw = '%' + params['keyword'][0] + '%'
                        sql += ' AND (title LIKE ? OR description LIKE ? OR content LIKE ?)'
                        args.extend([kw, kw, kw])
                    sql += ' ORDER BY date DESC'
                    rows = db.execute(sql, args).fetchall()
                    self._json_response(dicts_from_rows(rows))

            elif path == '/api/articles/all':
                rows = db.execute('SELECT * FROM articles ORDER BY date DESC').fetchall()
                self._json_response(dicts_from_rows(rows))

            # ===== 视频 =====
            elif path == '/api/videos':
                if 'id' in params:
                    row = db.execute('SELECT * FROM videos WHERE id=?', (params['id'][0],)).fetchone()
                    self._json_response(dict_from_row(row) if row else None)
                else:
                    sql = 'SELECT * FROM videos WHERE published=1'
                    args = []
                    if 'category' in params and params['category'][0] != '全部':
                        sql += ' AND category=?'
                        args.append(params['category'][0])
                    if 'keyword' in params:
                        kw = '%' + params['keyword'][0] + '%'
                        sql += ' AND (title LIKE ? OR description LIKE ?)'
                        args.extend([kw, kw])
                    sql += ' ORDER BY date DESC'
                    rows = db.execute(sql, args).fetchall()
                    self._json_response(dicts_from_rows(rows))

            elif path == '/api/videos/all':
                rows = db.execute('SELECT * FROM videos ORDER BY date DESC').fetchall()
                self._json_response(dicts_from_rows(rows))

            # ===== 分类 =====
            elif path == '/api/categories':
                rows = db.execute('SELECT * FROM categories ORDER BY sort_order ASC').fetchall()
                cats = ['全部'] + [r['name'] for r in rows]
                self._json_response(cats)

            # ===== 管理员 =====
            elif path == '/api/admin/config':
                if 'key' in params:
                    row = db.execute('SELECT * FROM admin_config WHERE key=?', (params['key'][0],)).fetchone()
                    self._json_response([dict_from_row(row)] if row else [])
                else:
                    rows = db.execute('SELECT * FROM admin_config').fetchall()
                    self._json_response(dicts_from_rows(rows))

            # ===== 搜索 =====
            elif path == '/api/search':
                kw = params.get('keyword', [''])[0]
                if not kw:
                    self._json_response({'articles': [], 'videos': []})
                    return
                like = '%' + kw + '%'
                articles = dicts_from_rows(db.execute(
                    'SELECT * FROM articles WHERE published=1 AND (title LIKE ? OR description LIKE ? OR content LIKE ?) ORDER BY date DESC',
                    (like, like, like)).fetchall())
                videos = dicts_from_rows(db.execute(
                    'SELECT * FROM videos WHERE published=1 AND (title LIKE ? OR description LIKE ?) ORDER BY date DESC',
                    (like, like)).fetchall())
                self._json_response({'articles': articles, 'videos': videos})

            else:
                self._json_response({'error': 'Not found'}, 404)

        except Exception as e:
            self._json_response({'error': str(e)}, 500)
        finally:
            db.close()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body()
        db = get_db()

        try:
            if path == '/api/articles':
                db.execute(
                    'INSERT OR REPLACE INTO articles (id,title,description,category,content,video_url,video_embed_code,video_storage_key,video_storage_path,date,published) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                    (body.get('id'), body.get('title'), body.get('desc',''), body.get('category',''),
                     body.get('content',''), body.get('videoUrl',''), body.get('videoEmbedCode',''),
                     body.get('videoStorageKey',''), body.get('videoStoragePath',''),
                     body.get('date',''), 1 if body.get('published', True) else 0))
                db.commit()
                self._json_response({'ok': True})

            elif path == '/api/videos':
                db.execute(
                    'INSERT OR REPLACE INTO videos (id,title,description,category,url,embed_code,storage_key,storage_path,date,published) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    (body.get('id'), body.get('title'), body.get('desc',''), body.get('category',''),
                     body.get('url',''), body.get('embedCode',''), body.get('storageKey',''),
                     body.get('storagePath',''), body.get('date',''), 1 if body.get('published', True) else 0))
                db.commit()
                self._json_response({'ok': True})

            elif path == '/api/categories':
                cats = body if isinstance(body, list) else body.get('categories', [])
                db.execute('DELETE FROM categories')
                for i, name in enumerate(cats):
                    if name != '全部':
                        db.execute('INSERT INTO categories (name, sort_order) VALUES (?, ?)', (name, i))
                db.commit()
                self._json_response({'ok': True})

            else:
                self._json_response({'error': 'Not found'}, 404)

        except Exception as e:
            self._json_response({'error': str(e)}, 500)
        finally:
            db.close()

    def do_PATCH(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        body = self._read_body()
        db = get_db()

        try:
            if path == '/api/articles' and 'id' in params:
                fields = []
                args = []
                for key, col in [('title','title'),('desc','description'),('category','category'),('content','content'),('videoUrl','video_url'),('videoEmbedCode','video_embed_code'),('videoStorageKey','video_storage_key'),('videoStoragePath','video_storage_path'),('date','date'),('published','published')]:
                    if key in body:
                        fields.append(f'{col}=?')
                        args.append(body[key])
                if 'published' in body:
                    args[-1] = 1 if body['published'] else 0
                args.append(params['id'][0])
                db.execute(f'UPDATE articles SET {", ".join(fields)} WHERE id=?', args)
                db.commit()
                self._json_response({'ok': True})

            elif path == '/api/videos' and 'id' in params:
                fields = []
                args = []
                for key, col in [('title','title'),('desc','description'),('category','category'),('url','url'),('embedCode','embed_code'),('storageKey','storage_key'),('storagePath','storage_path'),('date','date'),('published','published')]:
                    if key in body:
                        fields.append(f'{col}=?')
                        args.append(body[key])
                if 'published' in body:
                    args[-1] = 1 if body['published'] else 0
                args.append(params['id'][0])
                db.execute(f'UPDATE videos SET {", ".join(fields)} WHERE id=?', args)
                db.commit()
                self._json_response({'ok': True})

            elif path == '/api/admin/config' and 'key' in params:
                db.execute('UPDATE admin_config SET value=? WHERE key=?', (body.get('value',''), params['key'][0]))
                db.commit()
                self._json_response({'ok': True})

            else:
                self._json_response({'error': 'Not found'}, 404)

        except Exception as e:
            self._json_response({'error': str(e)}, 500)
        finally:
            db.close()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        db = get_db()

        try:
            if path == '/api/articles' and 'id' in params:
                db.execute('DELETE FROM articles WHERE id=?', (params['id'][0],))
                db.commit()
                self._json_response({'ok': True})

            elif path == '/api/videos' and 'id' in params:
                db.execute('DELETE FROM videos WHERE id=?', (params['id'][0],))
                db.commit()
                self._json_response({'ok': True})

            elif path == '/api/categories':
                db.execute('DELETE FROM categories')
                db.commit()
                self._json_response({'ok': True})

            else:
                self._json_response({'error': 'Not found'}, 404)

        except Exception as e:
            self._json_response({'error': str(e)}, 500)
        finally:
            db.close()

    def log_message(self, format, *args):
        pass  # 静默日志

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), APIHandler)
    print(f'API server running on port {PORT}')
    server.serve_forever()
