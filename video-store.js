/**
 * 郑医有话 — 视频文件存储层
 * 使用 IndexedDB 存储视频文件（blob），支持大文件（几百MB）
 */
const VideoStore = (() => {
    const DB_NAME = 'zhengyiyouhua_videos';
    const STORE_NAME = 'videos';
    const DB_VERSION = 1;

    let _db = null;

    function _openDB() {
        return new Promise((resolve, reject) => {
            if (_db) return resolve(_db);
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    return {
        /**
         * 保存视频文件
         * @param {string} key - 唯一 key，格式 "art_xxx" 或 "vid_xxx"
         * @param {File} file - 视频文件对象
         * @returns {Promise<{key, name, size, type}>}
         */
        async save(key, file) {
            const db = await _openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(file, key);
                tx.oncomplete = () => resolve({ key, name: file.name, size: file.size, type: file.type });
                tx.onerror = (e) => reject(e.target.error);
            });
        },

        /**
         * 读取视频文件，返回 blob URL
         * @param {string} key
         * @returns {Promise<string|null>} blob URL
         */
        async getURL(key) {
            const db = await _openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(key);
                req.onsuccess = () => {
                    if (req.result) {
                        resolve(URL.createObjectURL(req.result));
                    } else {
                        resolve(null);
                    }
                };
                req.onerror = (e) => reject(e.target.error);
            });
        },

        /**
         * 获取视频文件元信息（不读取 blob 本身）
         * @param {string} key
         * @returns {Promise<{name, size, type}|null>}
         */
        async getMeta(key) {
            const db = await _openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(key);
                req.onsuccess = () => {
                    const f = req.result;
                    if (f) {
                        resolve({ name: f.name, size: f.size, type: f.type });
                    } else {
                        resolve(null);
                    }
                };
                req.onerror = (e) => reject(e.target.error);
            });
        },

        /**
         * 删除视频文件
         * @param {string} key
         * @returns {Promise<void>}
         */
        async remove(key) {
            const db = await _openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e.target.error);
            });
        },

        /**
         * 判断视频文件是否存在
         * @param {string} key
         * @returns {Promise<boolean>}
         */
        async has(key) {
            const db = await _openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).count(key);
                req.onsuccess = () => resolve(req.result > 0);
                req.onerror = (e) => reject(e.target.error);
            });
        }
    };
})();
