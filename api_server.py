import json,sqlite3,hashlib
from http.server import HTTPServer,BaseHTTPRequestHandler
from urllib.parse import urlparse,parse_qs

DB='/var/www/zhengyiyouhua/zhengyiyouhua.db'

def db():
    c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c

def sha256(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
        self.send_header('Content-Type','application/json; charset=utf-8')

    def _j(self,d,s=200):
        self.send_response(s);self._cors();self.end_headers()
        self.wfile.write(json.dumps(d,ensure_ascii=False).encode('utf-8'))

    def _b(self):
        l=int(self.headers.get('Content-Length',0))
        return json.loads(self.rfile.read(l)) if l else {}

    def do_OPTIONS(self):
        self.send_response(204);self._cors();self.end_headers()

    def do_GET(self):
        p=urlparse(self.path);pa=p.path;q=parse_qs(p.query);c=db()
        try:
            if pa=='/api/articles':
                if 'id' in q:
                    r=c.execute('SELECT * FROM articles WHERE id=?',(q['id'][0],)).fetchone()
                    self._j(dict(r) if r else None)
                else:
                    s='SELECT * FROM articles WHERE published=1';a=[]
                    if 'category' in q and q['category'][0]!='全部':s+=' AND category=?';a.append(q['category'][0])
                    if 'keyword' in q:
                        k='%'+q['keyword'][0]+'%'
                        s+=' AND (title LIKE ? OR description LIKE ? OR content LIKE ?)';a+=[k,k,k]
                    self._j([dict(x) for x in c.execute(s+' ORDER BY date DESC',a).fetchall()])

            elif pa=='/api/articles/all':
                self._j([dict(x) for x in c.execute('SELECT * FROM articles ORDER BY date DESC').fetchall()])

            elif pa=='/api/videos':
                if 'id' in q:
                    r=c.execute('SELECT * FROM videos WHERE id=?',(q['id'][0],)).fetchone()
                    self._j(dict(r) if r else None)
                else:
                    s='SELECT * FROM videos WHERE published=1';a=[]
                    if 'category' in q and q['category'][0]!='全部':s+=' AND category=?';a.append(q['category'][0])
                    if 'keyword' in q:
                        k='%'+q['keyword'][0]+'%'
                        s+=' AND (title LIKE ? OR description LIKE ?)';a+=[k,k]
                    self._j([dict(x) for x in c.execute(s+' ORDER BY date DESC',a).fetchall()])

            elif pa=='/api/videos/all':
                self._j([dict(x) for x in c.execute('SELECT * FROM videos ORDER BY date DESC').fetchall()])

            elif pa=='/api/categories':
                rows=c.execute('SELECT * FROM categories ORDER BY sort_order').fetchall()
                self._j(['全部']+[r['name'] for r in rows])

            elif pa=='/api/admin/config':
                if 'key' in q:
                    rows=c.execute('SELECT * FROM admin_config WHERE key=?',(q['key'][0],)).fetchall()
                    self._j([dict(x) for x in rows])
                else:
                    self._j([dict(x) for x in c.execute('SELECT * FROM admin_config').fetchall()])

            elif pa=='/api/search':
                k=q.get('keyword',[''])[0]
                if not k:self._j({'articles':[],'videos':[]});return
                lk='%'+k+'%'
                arts=[dict(x) for x in c.execute('SELECT * FROM articles WHERE published=1 AND (title LIKE ? OR description LIKE ? OR content LIKE ?) ORDER BY date DESC',(lk,lk,lk)).fetchall()]
                vids=[dict(x) for x in c.execute('SELECT * FROM videos WHERE published=1 AND (title LIKE ? OR description LIKE ?) ORDER BY date DESC',(lk,lk)).fetchall()]
                self._j({'articles':arts,'videos':vids})

            elif pa=='/api/admin/login':
                pwd=q.get('password',[''])[0]
                stored=c.execute("SELECT value FROM admin_config WHERE key='password'").fetchone()
                if stored and stored['value']==sha256(pwd):
                    self._j({'ok':True})
                else:
                    self._j({'ok':False},401)

            else:
                self._j({'error':'Not found'},404)
        except Exception as e:
            self._j({'error':str(e)},500)
        finally:
            c.close()

    def do_POST(self):
        pa=urlparse(self.path).path;b=self._b();c=db()
        try:
            if pa=='/api/articles':
                c.execute('INSERT OR REPLACE INTO articles(id,title,description,category,content,video_url,video_embed_code,video_storage_key,video_storage_path,date,published) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
                    (b.get('id'),b.get('title'),b.get('desc',''),b.get('category',''),b.get('content',''),
                     b.get('videoUrl',''),b.get('videoEmbedCode',''),b.get('videoStorageKey',''),
                     b.get('videoStoragePath',''),b.get('date',''),1 if b.get('published',True) else 0))
                c.commit();self._j({'ok':True})

            elif pa=='/api/videos':
                c.execute('INSERT OR REPLACE INTO videos(id,title,description,category,url,embed_code,storage_key,storage_path,date,published) VALUES(?,?,?,?,?,?,?,?,?,?)',
                    (b.get('id'),b.get('title'),b.get('desc',''),b.get('category',''),b.get('url',''),
                     b.get('embedCode',''),b.get('storageKey',''),b.get('storagePath',''),
                     b.get('date',''),1 if b.get('published',True) else 0))
                c.commit();self._j({'ok':True})

            elif pa=='/api/categories':
                c.execute('DELETE FROM categories')
                cats=b if isinstance(b,list) else b.get('categories',[])
                for i,n in enumerate(cats):
                    if n!='全部':c.execute('INSERT INTO categories(name,sort_order) VALUES(?,?)',(n,i))
                c.commit();self._j({'ok':True})

            else:
                self._j({'error':'Not found'},404)
        except Exception as e:
            self._j({'error':str(e)},500)
        finally:
            c.close()

    def do_PATCH(self):
        pa=urlparse(self.path).path;q=parse_qs(urlparse(self.path).query);b=self._b();c=db()
        try:
            if pa=='/api/articles' and 'id' in q:
                f=[];a=[]
                for k,col in [('title','title'),('desc','description'),('category','category'),('content','content'),('videoUrl','video_url'),('videoEmbedCode','video_embed_code'),('videoStorageKey','video_storage_key'),('videoStoragePath','video_storage_path'),('date','date'),('published','published')]:
                    if k in b:
                        f.append(col+'=?')
                        val=b[k]
                        if k=='published':val=1 if val else 0
                        a.append(val)
                a.append(q['id'][0])
                c.execute('UPDATE articles SET '+','.join(f)+' WHERE id=?',a);c.commit();self._j({'ok':True})

            elif pa=='/api/videos' and 'id' in q:
                f=[];a=[]
                for k,col in [('title','title'),('desc','description'),('category','category'),('url','url'),('embedCode','embed_code'),('storageKey','storage_key'),('storagePath','storage_path'),('date','date'),('published','published')]:
                    if k in b:
                        f.append(col+'=?')
                        val=b[k]
                        if k=='published':val=1 if val else 0
                        a.append(val)
                a.append(q['id'][0])
                c.execute('UPDATE videos SET '+','.join(f)+' WHERE id=?',a);c.commit();self._j({'ok':True})

            elif pa=='/api/admin/config' and 'key' in q:
                val=b.get('value','')
                # If it looks like a plaintext password (not a hash), hash it
                if len(val)!=64 or not all(c in '0123456789abcdef' for c in val):
                    val=sha256(val)
                c.execute('UPDATE admin_config SET value=? WHERE key=?',(val,q['key'][0]))
                c.commit();self._j({'ok':True})

            else:
                self._j({'error':'Not found'},404)
        except Exception as e:
            self._j({'error':str(e)},500)
        finally:
            c.close()

    def do_DELETE(self):
        pa=urlparse(self.path).path;q=parse_qs(urlparse(self.path).query);c=db()
        try:
            if pa=='/api/articles' and 'id' in q:
                c.execute('DELETE FROM articles WHERE id=?',(q['id'][0],));c.commit();self._j({'ok':True})
            elif pa=='/api/videos' and 'id' in q:
                c.execute('DELETE FROM videos WHERE id=?',(q['id'][0],));c.commit();self._j({'ok':True})
            elif pa=='/api/categories':
                c.execute('DELETE FROM categories');c.commit();self._j({'ok':True})
            else:
                self._j({'error':'Not found'},404)
        except Exception as e:
            self._j({'error':str(e)},500)
        finally:
            c.close()

    def log_message(self,*a):pass

if __name__=='__main__':
    s=HTTPServer(('127.0.0.1',8000),H)
    print('API on :8000')
    s.serve_forever()
