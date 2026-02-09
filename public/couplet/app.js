// 常量定义
const TAGS = ['升职加薪', '学业有成', '阖家团圆', '身体健康', '财源广进', '甜蜜爱情', '事业腾飞', '马到成功'];
const HISTORY_KEY = 'horse_couplet_history';

// DOM 元素
const wishInput = document.getElementById('wishInput');
const generateBtn = document.getElementById('generateBtn');
const tagsContainer = document.getElementById('tagsContainer');
const displaySection = document.getElementById('displaySection');
const emptyState = document.getElementById('emptyState');
const coupletContainer = document.getElementById('coupletContainer');
const actionSection = document.getElementById('actionSection');
const historyList = document.getElementById('historyList');
const toast = document.getElementById('toast');

// 状态
let isGenerating = false;

// 初始化
function init() {
    renderTags();
    loadHistory();
    initParticles();
    setupEventListeners();
}

// 渲染标签
function renderTags() {
    tagsContainer.innerHTML = TAGS.map(tag => `
        <div class="tag" onclick="selectTag('${tag}')">${tag}</div>
    `).join('');
}

// 选择标签
window.selectTag = function(tag) {
    wishInput.value = tag;
    wishInput.focus();
    // 简单的缩放反馈
    const tagEls = document.querySelectorAll('.tag');
    tagEls.forEach(el => {
        if(el.innerText === tag) {
            el.style.transform = 'scale(1.1)';
            setTimeout(() => el.style.transform = '', 200);
        }
    });
};

// 事件监听
function setupEventListeners() {
    generateBtn.addEventListener('click', handleGenerate);
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        // 退出动画
        coupletContainer.classList.add('anim-fade-out-up');
        actionSection.classList.add('hidden');
        
        setTimeout(() => {
            coupletContainer.classList.remove('anim-fade-out-up');
            coupletContainer.classList.add('hidden');
            handleGenerate();
        }, 500);
    });

    const shareEntry = document.getElementById('btnShare');
    shareEntry.addEventListener('click', openShareSheet);
    shareEntry.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openShareSheet();
        }
    });

    document.getElementById('btnCloseShareSheet').addEventListener('click', closeShareSheet);
    document.getElementById('shareSheetMask').addEventListener('click', closeShareSheet);
    document.getElementById('btnShareLink').addEventListener('click', async () => {
        closeShareSheet();
        await doShare();
    });
    document.getElementById('btnShareImage').addEventListener('click', async () => {
        closeShareSheet();
        try {
            await generateShareImagePreview();
        } catch (e) {
            showToast('生成失败，请稍后重试');
        }
    });

    document.getElementById('btnCloseShareImage').addEventListener('click', closeShareImageModal);
    document.getElementById('shareImageMask').addEventListener('click', closeShareImageModal);
}

// 生成逻辑
async function handleGenerate() {
    const keyword = wishInput.value.trim();
    if (!keyword) {
        showToast('请先输入心愿 💡');
        wishInput.classList.add('error');
        setTimeout(() => wishInput.classList.remove('error'), 500);
        return;
    }

    if (isGenerating) return;
    isGenerating = true;
    
    // UI 更新
    generateBtn.disabled = true;
    generateBtn.innerHTML = '挥毫中 <span class="loading-dots">...</span>';
    
    // 墨汁特效
    createInkSplash(generateBtn);

    try {
        // 模拟仪式感延迟
        await new Promise(resolve => setTimeout(resolve, 800));

        // 调用API
        const response = await fetch('/api/couplet/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword })
        });
        
        if (!response.ok) throw new Error('生成失败');
        
        const data = await response.json();
        
        // 渲染春联
        await renderCouplet(data);
        
        // 保存历史
        saveHistory({ ...data, keyword, timestamp: Date.now() });
        
    } catch (error) {
        console.error(error);
        showToast('生成失败，请重试 ❌');
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '生成春联 🖌️';
    }
}

// 渲染春联（核心动画）
async function renderCouplet(data) {
    emptyState.classList.add('hidden');
    coupletContainer.classList.remove('hidden');
    actionSection.classList.add('hidden'); // 先隐藏按钮
    
    // 清空旧内容
    const upperEl = document.getElementById('upperText');
    const lowerEl = document.getElementById('lowerText');
    const crossEl = document.getElementById('crossText');
    
    upperEl.innerHTML = '';
    lowerEl.innerHTML = '';
    crossEl.innerHTML = '';

    // 1. 横批入场
    const crossScroll = document.querySelector('.cross-scroll');
    crossScroll.classList.remove('anim-enter-top');
    void crossScroll.offsetWidth; // trigger reflow
    crossScroll.classList.add('anim-enter-top');
    
    // 渲染横批文字
    data.cross.split('').forEach((char, i) => {
        const span = createCharSpan(char);
        crossEl.appendChild(span);
        setTimeout(() => span.classList.add('visible'), 600 + i * 100);
    });

    // 2. 上联（右联）入场 - 延迟 300ms
    setTimeout(() => {
        const rightScroll = document.querySelector('.scroll-wrapper.right');
        rightScroll.classList.remove('anim-enter-top', 'anim-swing');
        void rightScroll.offsetWidth;
        rightScroll.classList.add('anim-enter-top');
        setTimeout(() => rightScroll.classList.add('anim-swing'), 600);
        
        // 渲染上联文字
        data.upper.split('').forEach((char, i) => {
            const span = createCharSpan(char);
            upperEl.appendChild(span);
            setTimeout(() => span.classList.add('visible'), 600 + i * 100);
        });
    }, 300);

    // 3. 下联（左联）入场 - 延迟 600ms
    setTimeout(() => {
        const leftScroll = document.querySelector('.scroll-wrapper.left');
        leftScroll.classList.remove('anim-enter-top', 'anim-swing');
        void leftScroll.offsetWidth;
        leftScroll.classList.add('anim-enter-top');
        setTimeout(() => leftScroll.classList.add('anim-swing'), 600);
        
        // 渲染下联文字
        data.lower.split('').forEach((char, i) => {
            const span = createCharSpan(char);
            lowerEl.appendChild(span);
            setTimeout(() => span.classList.add('visible'), 600 + i * 100);
        });
        
        // 全部完成后
        setTimeout(() => {
            createCelebration();
            actionSection.classList.remove('hidden');
        }, 600 + data.lower.length * 100 + 500);
        
    }, 600);
}

function createCharSpan(char) {
    const span = document.createElement('span');
    span.className = 'char-span';
    span.textContent = char;
    return span;
}

// 历史记录
function saveHistory(item) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift(item);
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const recent = history.slice(0, 6);
    
    historyList.innerHTML = recent.map((item, index) => `
        <div class="history-card" onclick="restoreHistory(${index})">
            <div class="h-cross">${item.cross}</div>
            <div class="h-couple">${item.upper.substring(0, 2)}...</div>
        </div>
    `).join('');
}

window.restoreHistory = function(index) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const item = history[index];
    if (item) {
        wishInput.value = item.keyword;
        renderCouplet(item);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

let shareImageObjectUrl = null;

function getCurrentCoupletText() {
    const cross = document.getElementById('crossText').innerText.replace(/\n/g, '').trim();
    const upper = document.getElementById('upperText').innerText.replace(/\n/g, '').trim();
    const lower = document.getElementById('lowerText').innerText.replace(/\n/g, '').trim();
    return { cross, upper, lower };
}

function shareText() {
    const { cross, upper, lower } = getCurrentCoupletText();
    const keyword = (wishInput?.value || '').trim();
    const head = keyword ? `🧧 我用「马年春联生成器」为「${keyword}」写了一副春联！` : '🧧 我用「马年春联生成器」写了一副春联！';
    return `${head}\n\n📜 上联：${upper}\n📜 下联：${lower}\n🏮 横批：${cross}\n\n#TRAE 新春码力全开  #马年大吉\n👉 打开链接也来生成你的专属春联`;
}

async function doShare() {
    const { cross, upper, lower } = getCurrentCoupletText();
    if (!cross || !upper || !lower) {
        showToast('请先生成春联');
        return;
    }

    const text = shareText();
    const url = location.href;
    try {
        await navigator.clipboard.writeText(text + "\n" + url);
        showToast('已复制分享文案');
    } catch (e) {
        prompt('复制以下文案分享给朋友：', text + "\n" + url);
    }
}

function openShareSheet() {
    const { cross, upper, lower } = getCurrentCoupletText();
    if (!cross || !upper || !lower) {
        showToast('请先生成春联');
        return;
    }
    document.getElementById('shareSheet').classList.remove('hidden');
}

function closeShareSheet() {
    document.getElementById('shareSheet').classList.add('hidden');
}

function openShareImageModal() {
    document.getElementById('shareImageModal').classList.remove('hidden');
}

function closeShareImageModal() {
    document.getElementById('shareImageModal').classList.add('hidden');
    const preview = document.getElementById('shareImagePreview');
    preview.removeAttribute('src');
    if (shareImageObjectUrl) {
        try { URL.revokeObjectURL(shareImageObjectUrl); } catch (e) {}
        shareImageObjectUrl = null;
    }
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

async function uploadShareImage(blob) {
    const res = await fetch('/api/share-image', {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob
    });
    if (!res.ok) throw new Error('share_image_http_' + res.status);
    return await res.json();
}

async function fetchQrImage(url) {
    const res = await fetch('/api/share-qr?data=' + encodeURIComponent(url));
    if (!res.ok) throw new Error('qr_http_' + res.status);
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    try {
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = obj;
        });
        return img;
    } finally {
        URL.revokeObjectURL(obj);
    }
}

async function fetchStaticImage(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('img_http_' + res.status);
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    try {
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = obj;
        });
        return img;
    } finally {
        URL.revokeObjectURL(obj);
    }
}

function drawDeterministicDots(ctx, seed, bounds, count) {
    const { x, y, w, h } = bounds;
    for (let i = 0; i < count; i++) {
        const m1 = 2654435761;
        const m2 = 1597334677;
        const v1 = (seed + Math.imul(i + 1, m1)) >>> 0;
        const v2 = (Math.imul(seed ^ (i + 17), m2) + 1013904223) >>> 0;
        const cx = x + (v1 % Math.max(1, Math.floor(w)));
        const cy = y + (v2 % Math.max(1, Math.floor(h)));
        const r = 1 + (((v1 ^ v2) >>> 0) % 4);
        const a = 0.10 + (((v1 >>> 8) & 0xff) / 255) * 0.30;
        ctx.fillStyle = `rgba(255, 215, 0, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawScroll(ctx, text, x, y, w, h, isVertical, seed) {
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, '#D93025');
    bg.addColorStop(1, '#B10A12');

    ctx.save();
    roundRectPath(ctx, x, y, w, h, 26);
    ctx.fillStyle = bg;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, x, y, w, h, 26);
    ctx.clip();
    drawDeterministicDots(ctx, seed, { x, y, w, h }, 26);
    ctx.restore();

    roundRectPath(ctx, x, y, w, h, 26);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(255,215,0,0.25)';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#1a0a0a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isVertical) {
        ctx.font = '900 56px "Ma Shan Zheng", "楷体", "STKaiti", serif';
        const chars = text.split('');
        const padY = Math.max(22, Math.min(48, Math.floor(h * 0.12)));
        const innerH = Math.max(1, h - padY * 2);
        const charHeight = innerH / Math.max(1, chars.length);
        for (let i = 0; i < chars.length; i++) {
            ctx.fillText(chars[i], x + w / 2, y + padY + charHeight / 2 + i * charHeight);
        }
    } else {
        ctx.font = '900 58px "Ma Shan Zheng", "楷体", "STKaiti", serif';
        const chars = text.split('');
        const charWidth = w / Math.max(1, chars.length);
        for (let i = 0; i < chars.length; i++) {
            ctx.fillText(chars[i], x + charWidth / 2 + i * charWidth, y + h / 2);
        }
    }
}

async function generateShareImagePreview() {
    const { cross, upper, lower } = getCurrentCoupletText();
    if (!cross || !upper || !lower) {
        showToast('请先生成春联');
        return;
    }

    showToast('正在生成分享图片…');

    const shareUrl = location.href;
    const [qrImg, logoImg] = await Promise.all([
        fetchQrImage(shareUrl),
        fetchStaticImage('trae.image').catch(() => null)
    ]);
    const seed = hashString(cross + '|' + upper + '|' + lower);

    const W = 1080;
    const H = 1520;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#4a0000');
    bg.addColorStop(1, '#0f0505');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const bgGlowA = ctx.createRadialGradient(W * 0.18, H * 0.22, 0, W * 0.18, H * 0.22, W * 0.62);
    bgGlowA.addColorStop(0, 'rgba(255, 215, 0, 0.18)');
    bgGlowA.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = bgGlowA;
    ctx.fillRect(0, 0, W, H);

    const bgGlowB = ctx.createRadialGradient(W * 0.86, H * 0.78, 0, W * 0.86, H * 0.78, W * 0.62);
    bgGlowB.addColorStop(0, 'rgba(217, 48, 37, 0.22)');
    bgGlowB.addColorStop(1, 'rgba(217, 48, 37, 0)');
    ctx.fillStyle = bgGlowB;
    ctx.fillRect(0, 0, W, H);

    roundRectPath(ctx, 22, 22, W - 44, H - 44, 54);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.78)';
    ctx.lineWidth = 10;
    ctx.stroke();
    roundRectPath(ctx, 38, 38, W - 76, H - 76, 48);
    ctx.strokeStyle = 'rgba(154, 0, 7, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const glowA = ctx.createRadialGradient(W * 0.18, H * 0.22, 0, W * 0.18, H * 0.22, W * 0.55);
    glowA.addColorStop(0, 'rgba(255,215,0,0.14)');
    glowA.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, W, H);

    const glowB = ctx.createRadialGradient(W * 0.86, H * 0.86, 0, W * 0.86, H * 0.86, W * 0.55);
    glowB.addColorStop(0, 'rgba(217,48,37,0.18)');
    glowB.addColorStop(1, 'rgba(217,48,37,0)');
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, W, H);

    drawDeterministicDots(ctx, seed, { x: 0, y: 0, w: W, h: H }, 96);

    const cardX = 70;
    const cardY = 90;
    const cardW = W - 140;
    const cardH = H - 180;
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 46);
    const cardBg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    cardBg.addColorStop(0, 'rgba(154, 0, 7, 0.22)');
    cardBg.addColorStop(1, 'rgba(15, 5, 5, 0.88)');
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.38)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const logoSize = 76;
    const logoX = cardX + 54;
    const logoY = cardY + 58;
    if (logoImg) {
        roundRectPath(ctx, logoX - 10, logoY - 10, logoSize + 20, logoSize + 20, 20);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.32)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }

    let y = cardY + 110;
    const titleX = logoImg ? (logoX + logoSize + 26) : (cardX + 64);

    ctx.fillStyle = 'rgba(255, 236, 209, 0.96)';
    ctx.font = '900 54px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('马年春联生成器', titleX, y);
    y += 52;
    ctx.fillStyle = 'rgba(255, 236, 209, 0.72)';
    ctx.font = '600 30px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('你的专属春联', titleX, y);

    const crossW = 520;
    const crossH = 120;
    const crossX = cardX + Math.floor((cardW - crossW) / 2);
    const crossY = y + 64;
    drawScroll(ctx, cross, crossX, crossY, crossW, crossH, false, seed ^ 0x13579bdf);

    const qrSize = 250;
    const qrBoxX = cardX + cardW - 44 - qrSize;
    const qrBoxY = cardY + cardH - 44 - qrSize;

    const vW = 170;
    const vY = crossY + crossH + 72;
    const vMaxH = Math.floor(qrBoxY - 44 - vY);
    const vH = Math.max(0, Math.min(880, vMaxH));
    const leftX = cardX + 96;
    const rightX = cardX + cardW - 96 - vW;
    drawScroll(ctx, lower, leftX, vY, vW, vH, true, seed ^ 0x2468ace1);
    drawScroll(ctx, upper, rightX, vY, vW, vH, true, seed ^ 0xdeadbeef);

    ctx.font = '220px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐎', cardX + cardW / 2, vY + vH / 2 + 40);
    roundRectPath(ctx, qrBoxX, qrBoxY, qrSize, qrSize, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.75)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.drawImage(qrImg, qrBoxX + 16, qrBoxY + 16, qrSize - 32, qrSize - 32);

    const footerX = cardX + 64;
    const footerY1 = cardY + cardH - 98;
    const footerY2 = cardY + cardH - 54;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = 'rgba(255, 236, 209, 0.86)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 34px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('扫码生成你的春联', footerX, footerY1);

    ctx.fillStyle = 'rgba(255, 215, 0, 0.92)';
    ctx.font = '800 30px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('#TRAE 新春码力全开', footerX, footerY2);
    ctx.restore();

    if (shareImageObjectUrl) {
        try { URL.revokeObjectURL(shareImageObjectUrl); } catch (e) {}
        shareImageObjectUrl = null;
    }

    const blob = (await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.92))) || (await new Promise(resolve => canvas.toBlob(resolve, 'image/png')));
    if (blob) {
        try {
            const data = await uploadShareImage(blob);
            if (data && data.url) {
                document.getElementById('shareImagePreview').setAttribute('src', data.url);
                openShareImageModal();
                showToast('图片已生成，长按保存');
                return;
            }
            throw new Error('bad_share_image_payload');
        } catch (e) {}

        const obj = URL.createObjectURL(blob);
        shareImageObjectUrl = obj;
        document.getElementById('shareImagePreview').setAttribute('src', obj);
        openShareImageModal();
        showToast('图片已生成，长按保存');
        return;
    }

    document.getElementById('shareImagePreview').setAttribute('src', canvas.toDataURL('image/png'));
    openShareImageModal();
    showToast('图片已生成，长按保存');
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// --- 特效系统 ---

// 金粉粒子
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * height; // 初始随机分布
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = -10;
            this.size = Math.random() * 3 + 2;
            this.speed = Math.random() * 1 + 0.5;
            this.angle = Math.random() * Math.PI * 2;
            this.color = `rgba(212, 160, 23, ${Math.random() * 0.5 + 0.3})`;
        }
        
        update() {
            this.y += this.speed;
            this.x += Math.sin(this.angle) * 0.5;
            this.angle += 0.02;
            
            if (this.y > height) {
                this.reset();
            }
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 创建粒子
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 墨汁飞溅
function createInkSplash(target) {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 5; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: fixed;
            width: ${Math.random() * 6 + 4}px;
            height: ${Math.random() * 6 + 4}px;
            background: #111;
            border-radius: 50%;
            left: ${centerX}px;
            top: ${centerY}px;
            pointer-events: none;
            z-index: 100;
            transition: all 0.6s ease-out;
        `;
        document.body.appendChild(dot);
        
        // 强制重绘
        void dot.offsetWidth;
        
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 80 + 20;
        
        dot.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`;
        dot.style.opacity = '0';
        
        setTimeout(() => dot.remove(), 600);
    }
}

// 庆祝特效
function createCelebration() {
    // 1. 金色闪光
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(255, 215, 0, 0.2);
        pointer-events: none; z-index: 999;
        animation: fadeOutUp 0.5s forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    
    // 2. 简单的 Emoji 烟花
    const container = document.getElementById('celebrationContainer');
    const emojis = ['🎊', '🎆', '✨', '🧧'];
    
    for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            font-size: 30px;
            pointer-events: none;
            z-index: 998;
            animation: fadeOutUp 1s forwards;
            opacity: 0;
        `;
        
        // 简单的从中心向外动画
        // 这里简化为随机位置上浮
        
        container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = 1;
            el.style.transform = `translateY(-50px)`;
        }, 10);
        
        setTimeout(() => el.remove(), 1000);
    }
}

// 启动
init();
