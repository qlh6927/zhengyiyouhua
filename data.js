/**
 * 郑医有话 — 共享数据层
 * 使用 localStorage 持久化所有文章和视频数据
 */
const ZYData = (() => {
    const STORAGE_KEY = 'zhengyiyouhua_data';
    const ADMIN_KEY = 'zhengyiyouhua_admin';

    // ===== 默认数据（首次加载时写入 localStorage）=====
    const DEFAULT_DATA = {
        categories: ['全部', '新生儿护理', '喂养指导', '黄疸', '早产儿', '睡眠', '其他'],
        articles: [
            {
                id: 'art_001',
                title: '新生儿黄疸：新手父母必读指南',
                desc: '了解生理性黄疸与病理性黄疸的区别，学会判断何时需要就医。',
                category: '黄疸',
                content: '<h2>什么是新生儿黄疸？</h2><p>新生儿黄疸是指新生儿时期，由于胆红素代谢异常，引起血中胆红素水平升高，而出现以皮肤、黏膜及巩膜黄染为特征的病症。</p><h2>生理性黄疸 vs 病理性黄疸</h2><p><strong>生理性黄疸</strong>：通常在出生后 2-3 天出现，4-5 天达到高峰，7-10 天消退。早产儿可能持续更久。</p><p><strong>病理性黄疸</strong>：出生后 24 小时内出现，或黄疸程度过重、进展过快、消退延迟或退而复现。需要及时就医。</p><h2>何时需要就医？</h2><ul><li>出生后 24 小时内出现黄疸</li><li>黄疸进展迅速，皮肤颜色加深</li><li>宝宝精神差、吃奶不好</li><li>大便颜色发白或灰白</li><li>黄疸持续超过 2 周（足月儿）或 4 周（早产儿）</li></ul><h2>居家护理建议</h2><p>保证充足的奶量摄入，促进胆红素通过大便排出。适当晒太阳（避免直射眼睛），但不要依赖晒太阳来退黄疸。</p>',
                videoUrl: '',
                videoEmbedCode: '',
                date: '2026-05-01',
                published: true
            },
            {
                id: 'art_002',
                title: '早产儿出院后护理要点',
                desc: '早产宝宝回家后的喂养、保暖、随访注意事项。',
                category: '早产儿',
                content: '<h2>早产儿出院标准</h2><p>体重达到 2000g 以上，能维持正常体温，能自主吸吮和吞咽，呼吸平稳无呼吸暂停发作。</p><h2>居家环境</h2><p>室温保持在 24-26°C，湿度 50-60%。避免过多人员探视，减少感染风险。</p><h2>喂养指导</h2><p>优先母乳喂养，必要时添加母乳强化剂。按需喂养，每 2-3 小时一次。注意观察体重增长。</p><h2>随访计划</h2><p>出院后 1 周内首次随访，之后每月随访一次，关注生长发育、视力听力筛查。</p>',
                videoUrl: '',
                videoEmbedCode: '',
                date: '2026-04-28',
                published: true
            },
            {
                id: 'art_003',
                title: '母乳喂养常见误区',
                desc: '关于初乳、喂养频率、奶量判断的科学解读。',
                category: '喂养指导',
                content: '<h2>误区一：初乳颜色黄就不干净</h2><p>初乳被称为「液体黄金」，富含免疫球蛋白和抗体，是宝宝的第一剂天然疫苗。颜色偏黄是正常现象，营养价值极高。</p><h2>误区二：定时定量喂奶</h2><p>新生儿应按需喂养，不必严格定时。观察宝宝的饥饿信号：张嘴、转头寻找、吸吮手指。</p><h2>误区三：奶水清就是没营养</h2><p>母乳分为前奶和后奶。前奶较稀，富含水分和蛋白质；后奶较浓，富含脂肪。两者都很重要。</p>',
                videoUrl: '',
                videoEmbedCode: '',
                date: '2026-04-25',
                published: true
            },
            {
                id: 'art_004',
                title: '新生儿脐带护理全攻略',
                desc: '消毒方法、异常信号识别、何时需要就医。',
                category: '新生儿护理',
                content: '<h2>脐带护理原则</h2><p>保持脐带残端清洁干燥，这是最重要的原则。</p><h2>正确消毒方法</h2><p>每次洗澡后用 75% 酒精棉签，从脐带根部由内向外螺旋消毒。每天 1-2 次。</p><h2>异常信号</h2><ul><li>脐周皮肤红肿、发热</li><li>有脓性分泌物或异味</li><li>脐部出血不止</li><li>脐带超过 3 周未脱落</li></ul>',
                videoUrl: '',
                videoEmbedCode: '',
                date: '2026-04-20',
                published: true
            },
            {
                id: 'art_005',
                title: '宝宝哭闹不止？可能是肠绞痛',
                desc: '识别肠绞痛症状，实用缓解方法分享。',
                category: '新生儿护理',
                content: '<h2>什么是肠绞痛？</h2><p>肠绞痛是新生儿期常见的功能性胃肠疾病，多发生在 2-4 周龄，通常在 3-4 月龄自行缓解。</p><h2>诊断标准（Wessel 标准）</h2><p>每天哭闹超过 3 小时，每周超过 3 天，持续超过 3 周。</p><h2>缓解方法</h2><ul><li>飞机抱：让宝宝趴在前臂上</li><li>腹部按摩：顺时针轻轻按摩</li><li>白噪音：模拟子宫内环境</li><li>包裹法：用包被适度包裹</li></ul>',
                videoUrl: '',
                videoEmbedCode: '',
                date: '2026-04-15',
                published: true
            },
            {
                id: 'art_006',
                title: '新生儿睡眠规律与安全睡姿',
                desc: '建立健康睡眠习惯，预防婴儿猝死综合征。',
                category: '睡眠',
                content: '<h2>新生儿睡眠特点</h2><p>新生儿每天睡 16-20 小时，每 2-4 小时醒来一次吃奶。这是正常的生理节奏。</p><h2>安全睡姿</h2><p><strong>仰卧位是最安全的睡姿。</strong>美国儿科学会建议所有 1 岁以下婴儿仰卧入睡。</p><h2>预防 SIDS（婴儿猝死综合征）</h2><ul><li>使用硬质平整的床垫</li><li>不放置枕头、被子、毛绒玩具</li><li>不与成人同床睡</li><li>室温适宜，不要过度包裹</li><li>鼓励使用安抚奶嘴</li></ul>',
                videoUrl: '',
                videoEmbedCode: '',
                date: '2026-04-10',
                published: true
            }
        ],
        videos: [
            {
                id: 'vid_001',
                title: '新生儿黄疸居家观察指南',
                desc: '3分钟教你判断宝宝黄疸程度',
                url: '',
                embedCode: '',
                category: '黄疸',
                date: '2026-05-01',
                published: true
            },
            {
                id: 'vid_002',
                title: '正确的母乳喂养姿势',
                desc: '四种常用哺乳姿势演示',
                url: '',
                embedCode: '',
                category: '喂养指导',
                date: '2026-04-25',
                published: true
            },
            {
                id: 'vid_003',
                title: '新生儿脐带消毒实操',
                desc: '手把手教你脐带护理',
                url: '',
                embedCode: '',
                category: '新生儿护理',
                date: '2026-04-20',
                published: true
            }
        ]
    };

    // ===== 数据读写 =====
    function _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('数据加载失败，使用默认数据', e);
        }
        // 首次加载，写入默认数据
        _save(DEFAULT_DATA);
        return DEFAULT_DATA;
    }

    function _save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function _genId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    async function _sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ===== 公开 API =====
    return {
        _sha256,

        // 获取所有数据
        getAll() {
            return _load();
        },

        // ===== 文章 =====
        getArticles(options = {}) {
            const data = _load();
            let list = data.articles.filter(a => a.published);
            if (options.category && options.category !== '全部') {
                list = list.filter(a => a.category === options.category);
            }
            if (options.keyword) {
                const kw = options.keyword.toLowerCase();
                list = list.filter(a =>
                    a.title.toLowerCase().includes(kw) ||
                    a.desc.toLowerCase().includes(kw) ||
                    (a.content && a.content.toLowerCase().includes(kw))
                );
            }
            // 按日期降序
            list.sort((a, b) => new Date(b.date) - new Date(a.date));
            return list;
        },

        getArticleById(id) {
            const data = _load();
            return data.articles.find(a => a.id === id) || null;
        },

        saveArticle(article) {
            const data = _load();
            const idx = data.articles.findIndex(a => a.id === article.id);
            if (idx >= 0) {
                data.articles[idx] = article;
            } else {
                article.id = article.id || _genId('art');
                data.articles.push(article);
            }
            _save(data);
            return article;
        },

        deleteArticle(id) {
            const data = _load();
            data.articles = data.articles.filter(a => a.id !== id);
            _save(data);
        },

        // ===== 视频 =====
        getVideos(options = {}) {
            const data = _load();
            let list = data.videos.filter(v => v.published);
            if (options.category && options.category !== '全部') {
                list = list.filter(v => v.category === options.category);
            }
            if (options.keyword) {
                const kw = options.keyword.toLowerCase();
                list = list.filter(v =>
                    v.title.toLowerCase().includes(kw) ||
                    v.desc.toLowerCase().includes(kw)
                );
            }
            list.sort((a, b) => new Date(b.date) - new Date(a.date));
            return list;
        },

        getVideoById(id) {
            const data = _load();
            return data.videos.find(v => v.id === id) || null;
        },

        saveVideo(video) {
            const data = _load();
            const idx = data.videos.findIndex(v => v.id === video.id);
            if (idx >= 0) {
                data.videos[idx] = video;
            } else {
                video.id = video.id || _genId('vid');
                data.videos.push(video);
            }
            _save(data);
            return video;
        },

        deleteVideo(id) {
            const data = _load();
            data.videos = data.videos.filter(v => v.id !== id);
            _save(data);
        },

        // ===== 分类 =====
        getCategories() {
            return _load().categories;
        },

        saveCategories(cats) {
            const data = _load();
            data.categories = cats;
            _save(data);
        },

        // ===== 搜索（合并文章+视频）=====
        search(keyword) {
            const kw = keyword.toLowerCase().trim();
            if (!kw) return { articles: [], videos: [] };
            return {
                articles: this.getArticles({ keyword: kw }),
                videos: this.getVideos({ keyword: kw })
            };
        },

        // ===== 管理员认证 =====
        async adminLogin(password) {
            const hashed = await ZYData._sha256(password);
            const stored = localStorage.getItem(ADMIN_KEY);
            const correct = stored || '4a246ecc3d477378bb5ca04032a7a9fed4c07c1bd61ac63362ee03d23172abaf';
            if (hashed === correct) {
                sessionStorage.setItem('zy_admin', '1');
                return true;
            }
            return false;
        },

        isAdmin() {
            return sessionStorage.getItem('zy_admin') === '1';
        },

        adminLogout() {
            sessionStorage.removeItem('zy_admin');
        },

        async changeAdminPassword(newPwd) {
            const hashed = await ZYData._sha256(newPwd);
            localStorage.setItem(ADMIN_KEY, hashed);
        },

        // 获取所有文章（含未发布，管理后台用）
        getAllArticles() {
            const data = _load();
            return [...data.articles].sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        getAllVideos() {
            const data = _load();
            return [...data.videos].sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        // 重置为默认数据
        resetToDefault() {
            _save(DEFAULT_DATA);
        }
    };
})();
