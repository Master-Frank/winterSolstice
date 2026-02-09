/**
 * 冬至暖心祝福留言板 - 交互逻辑
 * Winter Solstice Warm Blessings Message Board
 */

// ===== 常量配置 =====
const CONFIG = {
    API_BASE: '/api',
    TOAST_DURATION: 3000,
    CARD_AUTO_SHOW_INTERVAL: 15000, // 15秒自动展示一个祝福
    DUMPLING_POSITIONS: [
        { left: '10%', top: '20%' },
        { left: '30%', top: '40%' },
        { left: '50%', top: '15%' },
        { left: '70%', top: '35%' },
        { left: '20%', top: '55%' },
        { left: '45%', top: '60%' },
        { left: '65%', top: '50%' },
        { left: '15%', top: '35%' },
        { left: '55%', top: '25%' },
        { left: '75%', top: '20%' },
        { left: '25%', top: '65%' },
        { left: '60%', top: '70%' },
        { left: '35%', top: '30%' },
        { left: '80%', top: '45%' },
        { left: '5%', top: '50%' },
        { left: '40%', top: '50%' },
        { left: '85%', top: '25%' },
        { left: '10%', top: '65%' },
        { left: '90%', top: '55%' },
        { left: '50%', top: '40%' }
    ],
    SUCCESS_MESSAGES: [
        "这只饺子，已经有人记住了",
        "锅里又多了一份温暖",
        "冬至的温度，上升了一点点"
    ],
    PROGRESS_TEXTS: {
        cold: "锅还在慢慢热",
        warm: "锅里开始热闹了",
        hot: "这是一锅团圆",
        finale: "这一锅，是我们一起包的 ✨"
    }
};

// ===== 状态管理 =====
let state = {
    blessings: [],
    count: 0,
    isSubmitting: false,
    finaleTriggered: false,
    autoShowIndex: 0,
    snowIndex: 0,
    uiTab: 'wrap',
    delivery: 'public',
    lastShare: null,
    shareImageRemoteUrl: null
};

// ===== DOM 元素 =====
const elements = {
    blessingInput: document.getElementById('blessingInput'),
    charCount: document.getElementById('charCount'),
    submitBtn: document.getElementById('submitBtn'),
    dumplingsContainer: document.getElementById('dumplingsContainer'),
    dumplingCount: document.getElementById('dumplingCount'),
    progressText: document.getElementById('progressText'),
    successToast: document.getElementById('successToast'),
    toastMessage: document.getElementById('toastMessage'),
    blessingCard: document.getElementById('blessingCard'),
    cardTitle: document.getElementById('cardTitle'),
    cardPasscode: document.getElementById('cardPasscode'),
    cardText: document.getElementById('cardText'),
    cardNote: document.getElementById('cardNote'),
    cardClose: document.getElementById('cardClose'),
    finaleOverlay: document.getElementById('finaleOverlay'),
    steamLayer: document.querySelector('.steam-layer'),
    actionSwitch: document.getElementById('actionSwitch'),
    actionWrap: document.getElementById('actionWrap'),
    actionRedeem: document.getElementById('actionRedeem'),
    wrapPanel: document.getElementById('wrapPanel'),
    redeemPanel: document.getElementById('redeemPanel'),
    deliverySwitch: document.getElementById('deliverySwitch'),
    deliveryPublic: document.getElementById('deliveryPublic'),
    deliverySecret: document.getElementById('deliverySecret'),
    wrapInputSection: document.getElementById('wrapInputSection'),
    secretFields: document.getElementById('secretFields'),
    passcodeInput: document.getElementById('passcodeInput'),
    passcodeHintInput: document.getElementById('passcodeHintInput'),
    shareActions: document.getElementById('shareActions'),
    shareLinkBtn: document.getElementById('shareLinkBtn'),
    shareImageBtn: document.getElementById('shareImageBtn'),
    redeemPasscodeInput: document.getElementById('redeemPasscodeInput'),
    redeemBtn: document.getElementById('redeemBtn'),
    shareModal: document.getElementById('shareModal'),
    shareModalBackdrop: document.getElementById('shareModalBackdrop'),
    shareModalTitle: document.getElementById('shareModalTitle'),
    shareImagePreview: document.getElementById('shareImagePreview'),
    btnBackToShareSheet: document.getElementById('btnBackToShareSheet'),
    closeShareModal: document.getElementById('closeShareModal'),
    shareSheet: document.getElementById('shareSheet'),
    shareSheetBackdrop: document.getElementById('shareSheetBackdrop'),
    btnCloseShareSheet: document.getElementById('btnCloseShareSheet'),
    btnShareLink: document.getElementById('btnShareLink'),
    btnShareImage: document.getElementById('btnShareImage'),
    shareSheetInfo: document.getElementById('shareSheetInfo'),
    shareSheetInfoTitle: document.getElementById('shareSheetInfoTitle'),
    shareSheetInfoHighlight: document.getElementById('shareSheetInfoHighlight'),
    shareSheetInfoNote: document.getElementById('shareSheetInfoNote')
};

// ===== API 调用 =====
const api = {
    async getBlessings() {
        const response = await fetch(`${CONFIG.API_BASE}/blessings`);
        if (!response.ok) throw new Error('Failed to fetch blessings');
        return response.json();
    },

    async getCount() {
        const response = await fetch(`${CONFIG.API_BASE}/blessings/count`);
        if (!response.ok) throw new Error('Failed to fetch count');
        return response.json();
    },

    async createBlessing(payload) {
        const response = await fetch(`${CONFIG.API_BASE}/blessings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const code = data && typeof data.error === 'string' ? data.error : `http_${response.status}`;
            const err = new Error(code);
            err.code = code;
            throw err;
        }
        return response.json();
    },

    async redeemBlessing(passcode) {
        const response = await fetch(`${CONFIG.API_BASE}/blessings/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const code = data && typeof data.error === 'string' ? data.error : `http_${response.status}`;
            const err = new Error(code);
            err.code = code;
            throw err;
        }
        return response.json();
    }
};

// ===== 雪花效果 =====
function initSnow() {
    const container = document.getElementById('snowContainer');
    if (!container) return;

    setInterval(() => {
        if (document.querySelectorAll('.snowflake').length > 30) return;

        const idx = state.snowIndex++;
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = idx % 2 === 0 ? '❄' : '❅';
        snowflake.style.left = `${(idx * 13) % 100}vw`;
        snowflake.style.animationDuration = `${8 + (idx % 9)}s`;
        snowflake.style.opacity = `${0.32 + ((idx % 5) * 0.12)}`;
        snowflake.style.fontSize = `${0.6 + ((idx % 6) * 0.15)}rem`;
        container.appendChild(snowflake);

        setTimeout(() => snowflake.remove(), 16000);
    }, 500);
}

// ===== 工具函数 =====
function stableHash(input) {
    const str = String(input ?? '');
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function getProgressText(count) {
    if (count >= 50) return CONFIG.PROGRESS_TEXTS.finale;
    if (count >= 30) return CONFIG.PROGRESS_TEXTS.hot;
    if (count >= 10) return CONFIG.PROGRESS_TEXTS.warm;
    return CONFIG.PROGRESS_TEXTS.cold;
}

// ===== 饺子管理 =====
function createDumplingElement(blessing, position, isNew = false) {
    const dumpling = document.createElement('div');
    dumpling.className = `dumpling${isNew ? ' dropping' : ''}`;
    dumpling.style.left = position.left;
    dumpling.style.top = position.top;
    const h = stableHash(blessing?.id ?? blessing?.content ?? '');
    dumpling.style.animationDelay = `${(h % 80) / 10}s`;
    dumpling.style.animationDuration = `${6 + ((h % 41) / 10)}s`;
    dumpling.dataset.blessingId = blessing.id;
    dumpling.dataset.content = blessing.content;

    dumpling.innerHTML = '<div class="dumpling-body"></div>';

    // 点击显示祝福
    dumpling.addEventListener('click', () => showBlessingCard(blessing.content));

    return dumpling;
}

function addDumplingToContainer(blessing, isNew = false) {
    const existingDumplings = elements.dumplingsContainer.querySelectorAll('.dumpling');
    const positionIndex = existingDumplings.length % CONFIG.DUMPLING_POSITIONS.length;

    const position = CONFIG.DUMPLING_POSITIONS[positionIndex];

    const dumpling = createDumplingElement(blessing, position, isNew);
    elements.dumplingsContainer.appendChild(dumpling);

    // 如果是新饺子，添加水波纹
    if (isNew) {
        createRipple(position);

        // 动画结束后移除 dropping 类
        setTimeout(() => {
            dumpling.classList.remove('dropping');
        }, 800);
    }
}

function createRipple(position) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = position.left;
    ripple.style.top = position.top;

    elements.dumplingsContainer.appendChild(ripple);

    // 动画结束后移除
    setTimeout(() => ripple.remove(), 1000);
}

// ===== 祝福卡片 =====
function showBlessingCard(content, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const passcode = typeof opts.passcode === 'string' ? opts.passcode : '';

    if (elements.cardTitle) {
        elements.cardTitle.hidden = !Boolean(opts.title);
        if (opts.title) elements.cardTitle.textContent = String(opts.title);
    }
    if (elements.cardPasscode) {
        elements.cardPasscode.hidden = !Boolean(passcode);
        if (passcode) elements.cardPasscode.textContent = `暗号：${passcode}`;
        else elements.cardPasscode.textContent = '';
    }
    if (elements.cardNote) {
        elements.cardNote.hidden = !Boolean(opts.note);
        if (opts.note) elements.cardNote.textContent = String(opts.note);
    }

    elements.cardText.textContent = content;
    elements.blessingCard.classList.add('show');
}

function hideBlessingCard() {
    elements.blessingCard.classList.remove('show');
}

// ===== Toast 提示 =====
function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.successToast.classList.add('show');

    setTimeout(() => {
        elements.successToast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

function showActionChooser() {
    elements.actionWrap.classList.add('active');
    elements.actionRedeem.classList.remove('active');
    elements.actionSwitch.hidden = false;
    elements.wrapPanel.hidden = true;
    elements.redeemPanel.hidden = true;
    elements.shareActions.hidden = true;
    closeShareSheet();
    closeShareModal();
}

function showWrapDeliveryChooser() {
    elements.actionWrap.classList.add('active');
    elements.actionRedeem.classList.remove('active');
    elements.actionSwitch.hidden = true;
    elements.wrapPanel.hidden = false;
    elements.redeemPanel.hidden = true;
    elements.deliverySwitch.hidden = false;
    elements.wrapInputSection.hidden = true;
    elements.shareActions.hidden = true;
    closeShareModal();
}

function showWrapInput() {
    elements.actionWrap.classList.add('active');
    elements.actionRedeem.classList.remove('active');
    elements.actionSwitch.hidden = true;
    elements.wrapPanel.hidden = false;
    elements.redeemPanel.hidden = true;
    elements.deliverySwitch.hidden = true;
    elements.wrapInputSection.hidden = false;
    elements.shareActions.hidden = true;
    closeShareModal();
    updateSubmitState();
}

function showRedeem() {
    elements.actionRedeem.classList.add('active');
    elements.actionWrap.classList.remove('active');
    elements.actionSwitch.hidden = true;
    elements.wrapPanel.hidden = true;
    elements.redeemPanel.hidden = false;
    elements.shareActions.hidden = true;
    closeShareModal();
    updateRedeemState();
}

function setUiTab(tab) {
    const next = tab === 'redeem' ? 'redeem' : 'wrap';
    state.uiTab = next;

    if (next === 'wrap') {
        showActionChooser();
    } else {
        showRedeem();
    }
}

function setDelivery(delivery) {
    const next = delivery === 'secret' ? 'secret' : 'public';
    state.delivery = next;

    if (next === 'public') {
        elements.deliveryPublic.classList.add('active');
        elements.deliverySecret.classList.remove('active');
        elements.secretFields.hidden = true;
    } else {
        elements.deliverySecret.classList.add('active');
        elements.deliveryPublic.classList.remove('active');
        elements.secretFields.hidden = false;
    }

    elements.shareActions.hidden = true;
    state.lastShare = null;
    state.shareImageRemoteUrl = null;
    updateSubmitState();
}

function updateSubmitState() {
    const content = elements.blessingInput.value.trim();
    const passcode = elements.passcodeInput ? elements.passcodeInput.value.trim() : '';
    const ok = state.delivery === 'public' ? Boolean(content) : Boolean(content && passcode);
    elements.submitBtn.disabled = !ok || state.isSubmitting;
}

function updateRedeemState() {
    const passcode = elements.redeemPasscodeInput.value.trim();
    elements.redeemBtn.disabled = !passcode;
}

function redeemUrl() {
    return new URL('/dumpling/?tab=redeem', location.origin).toString();
}

function redeemUrlWithPasscode(passcode) {
    const u = new URL('/dumpling/', location.origin);
    u.searchParams.set('tab', 'redeem');
    u.searchParams.set('code', String(passcode || ''));
    return u.toString();
}

function shareLinkText() {
    if (!state.lastShare) return '';
    if (state.lastShare.delivery === 'secret') {
        const parts = [];
        parts.push('我给你留了一只「专属祝福饺子」🥟');
        if (state.lastShare.passcodeHint) {
            parts.push(`暗号提示：${state.lastShare.passcodeHint}`);
        } else {
            parts.push(`暗号：${state.lastShare.passcode}`);
        }
        const url = state.lastShare.passcodeHint ? redeemUrl() : redeemUrlWithPasscode(state.lastShare.passcode);
        parts.push(`打开链接扫码查看你的专属祝福：${url}`);
        parts.push('饺子会散，心意不会 💛');
        return parts.join('\n');
    }
    return `我在《冬至暖心祝福留言板》包了一只饺子：\n${state.lastShare.content}\n来锅里看看：${location.href}`;
}

function fallbackCopyText(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', 'true');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '0';
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, el.value.length);
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(el);
    return Boolean(ok);
}

function doShareLink() {
    const text = shareLinkText();
    if (!text) return;
    const writeText = navigator.clipboard && typeof navigator.clipboard.writeText === 'function' ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
    if (writeText) {
        writeText(text)
            .then(() => showToast('已复制分享内容'))
            .catch(() => {
                const ok = fallbackCopyText(text);
                if (ok) showToast('已复制分享内容');
                else prompt('复制以下内容分享给朋友：', text);
            });
        return;
    }
    const ok = fallbackCopyText(text);
    if (ok) showToast('已复制分享内容');
    else prompt('复制以下内容分享给朋友：', text);
}

function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
    const s = String(text || '');
    if (!s) return [''];
    if (ctx.measureText(s).width <= maxWidth) return [s];
    const parts = s.split(/\\s+/).filter(Boolean);
    const useWords = parts.length > 1;
    const units = useWords ? parts : Array.from(s);
    const joiner = useWords ? ' ' : '';
    const lines = [];
    let cur = '';
    for (const u of units) {
        const next = cur ? (cur + joiner + u) : u;
        if (ctx.measureText(next).width <= maxWidth) {
            cur = next;
            continue;
        }
        if (cur) lines.push(cur);
        cur = u;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [s];
}

function drawSnowOverlay(ctx, width, height) {
    const snowLayers = [
        { count: 26, size: 3, alpha: 0.32 },
        { count: 18, size: 5, alpha: 0.18 },
        { count: 12, size: 7, alpha: 0.12 }
    ];

    for (let layerIndex = 0; layerIndex < snowLayers.length; layerIndex++) {
        const layer = snowLayers[layerIndex];
        ctx.fillStyle = `rgba(255,255,255,${layer.alpha})`;

        for (let i = 0; i < layer.count; i++) {
            const x = ((i * 97 + layerIndex * 41) % 1000) / 1000 * width;
            const y = ((i * 173 + layerIndex * 59 + 210) % 1000) / 1000 * height;
            ctx.beginPath();
            ctx.arc(x, y, layer.size, 0, Math.PI * 2);
            ctx.fill();

            const cross = layer.size * 1.35;
            ctx.strokeStyle = `rgba(255,255,255,${layer.alpha * 0.75})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - cross, y);
            ctx.lineTo(x + cross, y);
            ctx.moveTo(x, y - cross);
            ctx.lineTo(x, y + cross);
            ctx.stroke();
        }
    }
}

async function uploadShareImage(blob) {
    const res = await fetch('/api/share-image', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
    if (!res.ok) throw new Error(`share_image_http_${res.status}`);
    return await res.json();
}

async function fetchQrImage(url) {
    const res = await fetch('/api/share-qr?data=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`qr_http_${res.status}`);
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

async function generateShareImage() {
    if (!state.lastShare) return null;

    const W = 1080;
    const H = 1520;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a2a4a');
    bg.addColorStop(0.5, '#2d3a5a');
    bg.addColorStop(1, '#3d4a6a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawSnowOverlay(ctx, W, H);

    const pad = 92;
    const contentMaxWidth = W - pad * 2 - 40;

    const titleX = pad;
    let y = 150;

    ctx.fillStyle = '#fff5e6';
    ctx.font = '900 66px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('冬至暖心祝福', titleX, y);
    y += 72;
    ctx.fillStyle = 'rgba(255, 245, 230, 0.92)';
    ctx.font = '900 46px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('🥟 一只饺子，一份团圆', titleX, y);
    y += 64;

    if (state.lastShare.delivery === 'public') {
        ctx.fillStyle = '#fff5e6';
        ctx.font = '900 44px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
        ctx.fillText('锅里有一只饺子，等你来捞', titleX, y);
        y += 74;
        ctx.fillStyle = 'rgba(255, 245, 230, 0.78)';
        ctx.font = '750 34px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
        const lines = wrapLines(ctx, '扫码打开，一起把这份团圆端起来。', contentMaxWidth);
        for (const line of lines.slice(0, 2)) {
            ctx.fillText(line, titleX, y);
            y += 48;
        }
    } else {
        const centerX = W / 2;
        ctx.textAlign = 'center';

        const centerStartY = Math.floor(H / 2) - 90;
        ctx.fillStyle = '#fff5e6';
        ctx.font = '950 58px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
        ctx.fillText('你的专属祝福暗号', centerX, centerStartY);
        const centerText = state.lastShare.passcodeHint ? `暗号提示：${state.lastShare.passcodeHint}` : `暗号：${state.lastShare.passcode}`;
        ctx.fillText(centerText, centerX, centerStartY + 86);

        ctx.textAlign = 'left';
    }

    const qrSize = 320;
    const qrX = W - pad - qrSize;
    const qrY = H - pad - qrSize;
    const secretQrUrl = state.lastShare.passcodeHint ? redeemUrl() : redeemUrlWithPasscode(state.lastShare.passcode);
    const qrImg = await fetchQrImage(state.lastShare.delivery === 'secret' ? secretQrUrl : location.href);
    roundRectPath(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 32);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 245, 230, 0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    ctx.fillStyle = 'rgba(255, 245, 230, 0.92)';
    ctx.font = '900 40px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    const qrLabel = state.lastShare.delivery === 'secret' ? '扫码查看你的专属祝福' : '扫码看看锅里的祝福';
    const qrLabelLines = wrapLines(ctx, qrLabel, qrSize + 10);
    let qrLabelY = qrY - 32;
    for (let i = qrLabelLines.length - 1; i >= 0; i--) {
        const line = qrLabelLines[i];
        const w = ctx.measureText(line).width;
        ctx.fillText(line, qrX + (qrSize - w) / 2, qrLabelY);
        qrLabelY -= 50;
    }

    ctx.fillStyle = 'rgba(255, 245, 230, 0.96)';
    ctx.font = '950 46px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif';
    ctx.fillText('饺子会散，心意不会 💛', pad, H - pad + 6);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92));
    if (!blob) throw new Error('share_image_failed');
    return blob;
}

function openShareModal() {
    elements.shareModal.hidden = false;
}

function closeShareModal() {
    elements.shareModal.hidden = true;
    elements.shareImagePreview.removeAttribute('src');
    state.shareImageRemoteUrl = null;
}

function openShareSheet() {
    renderShareSheetInfo();
    elements.shareSheet.hidden = false;
}

function closeShareSheet() {
    elements.shareSheet.hidden = true;
}

function renderShareSheetInfo() {
    if (!elements.shareSheetInfo) return;
    if (!state.lastShare || state.lastShare.delivery !== 'secret') {
        elements.shareSheetInfo.hidden = true;
        return;
    }

    elements.shareSheetInfo.hidden = false;
    elements.shareSheetInfoTitle.textContent = '你的专属祝福饺子已包好';
    elements.shareSheetInfoHighlight.textContent = state.lastShare.passcodeHint
        ? `暗号提示：${state.lastShare.passcodeHint}`
        : `暗号：${state.lastShare.passcode}`;
    const url = state.lastShare.passcodeHint ? redeemUrl() : redeemUrlWithPasscode(state.lastShare.passcode);
    elements.shareSheetInfoNote.textContent = `打开链接扫码查看你的专属祝福：${url}`;
}

async function doShareImage() {
    if (!state.lastShare) return;
    closeShareSheet();
    showToast('正在生成分享图片…');
    const blob = await generateShareImage();
    const { url } = await uploadShareImage(blob);
    const full = new URL(url, location.origin).toString();
    state.shareImageRemoteUrl = full;
    elements.shareImagePreview.src = full;
    openShareModal();
}

// ===== 进度更新 =====
function updateProgress(count) {
    state.count = count;
    elements.dumplingCount.textContent = count;
    elements.progressText.textContent = getProgressText(count);

    // 终局效果
    if (count >= 50 && !state.finaleTriggered) {
        triggerFinale();
    }
}

function triggerFinale() {
    state.finaleTriggered = true;
    document.body.classList.add('warm-finale');
    elements.finaleOverlay.classList.add('active');

    // 3秒后隐藏终局文字
    setTimeout(() => {
        elements.finaleOverlay.classList.remove('active');
    }, 4000);
}

// ===== 提交祝福 =====
async function handleSubmit() {
    const content = elements.blessingInput.value.trim();
    const passcode = elements.passcodeInput ? elements.passcodeInput.value.trim() : '';
    const passcodeHint = elements.passcodeHintInput ? elements.passcodeHintInput.value.trim() : '';

    if (!content) {
        elements.blessingInput.focus();
        return;
    }

    if (state.delivery === 'secret' && !passcode) {
        elements.passcodeInput.focus();
        return;
    }

    if (state.isSubmitting) return;

    state.isSubmitting = true;
    elements.submitBtn.disabled = true;

    try {
        const payload =
            state.delivery === 'secret'
                ? { content, delivery: 'secret', passcode, passcodeHint }
                : { content, delivery: 'public' };
        const result = await api.createBlessing(payload);

        // 清空输入
        elements.blessingInput.value = '';
        elements.charCount.textContent = '0';
        if (elements.passcodeInput) elements.passcodeInput.value = '';
        if (elements.passcodeHintInput) elements.passcodeHintInput.value = '';

        if (result && result.blessing && result.delivery === 'public') {
            state.blessings.unshift(result.blessing);
            addDumplingToContainer(result.blessing, true);
        }

        // 更新进度
        updateProgress(result.publicCount);

        // 显示成功提示
        const msgIndex = Math.max(0, result.publicCount - 1) % CONFIG.SUCCESS_MESSAGES.length;
        showToast(CONFIG.SUCCESS_MESSAGES[msgIndex]);
        state.lastShare =
            result.delivery === 'secret'
                ? { delivery: 'secret', content, passcode, passcodeHint }
                : { delivery: 'public', content };
        elements.shareActions.hidden = true;
        elements.shareModalTitle.textContent = result.delivery === 'secret' ? '图片分享' : '图片分享';
        openShareSheet();

    } catch (error) {
        const code = error && error.code ? String(error.code) : '';
        if (code === 'passcode_taken') {
            showToast('这个暗号已经被用过了，换一个吧');
        } else {
            console.error('提交失败:', error);
            showToast('提交失败，请稍后重试');
        }
    } finally {
        state.isSubmitting = false;
        updateSubmitState();
    }
}

// ===== 自动展示祝福 =====
function startAutoShowBlessings() {
    setInterval(() => {
        if (state.blessings.length > 0 && !elements.blessingCard.classList.contains('show')) {
            const randomBlessing = state.blessings[state.autoShowIndex++ % state.blessings.length];
            showBlessingCard(randomBlessing.content);

            // 5秒后自动关闭
            setTimeout(() => {
                hideBlessingCard();
            }, 5000);
        }
    }, CONFIG.CARD_AUTO_SHOW_INTERVAL);
}

// ===== 事件绑定 =====
function bindEvents() {
    elements.actionWrap.addEventListener('click', () => {
        setDelivery('public');
        showWrapDeliveryChooser();
    });
    elements.actionRedeem.addEventListener('click', () => setUiTab('redeem'));
    elements.deliveryPublic.addEventListener('click', () => {
        setDelivery('public');
        showWrapInput();
    });
    elements.deliverySecret.addEventListener('click', () => {
        setDelivery('secret');
        showWrapInput();
    });

    // 输入字数统计
    elements.blessingInput.addEventListener('input', () => {
        elements.charCount.textContent = elements.blessingInput.value.length;
        updateSubmitState();
    });

    // 输入时蒸汽减弱
    elements.blessingInput.addEventListener('focus', () => {
        elements.steamLayer.classList.add('dimmed');
    });

    elements.blessingInput.addEventListener('blur', () => {
        elements.steamLayer.classList.remove('dimmed');
    });

    if (elements.passcodeInput) {
        elements.passcodeInput.addEventListener('input', updateSubmitState);
    }
    if (elements.passcodeHintInput) {
        elements.passcodeHintInput.addEventListener('input', updateSubmitState);
    }

    // 提交按钮
    elements.submitBtn.addEventListener('click', handleSubmit);

    // 回车提交（Shift+Enter 换行）
    elements.blessingInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });

    elements.shareLinkBtn.addEventListener('click', doShareLink);
    elements.shareImageBtn.addEventListener('click', () => {
        doShareImage().catch((err) => {
            console.error('生成分享图失败:', err);
            showToast('生成图片失败，请稍后重试');
        });
    });
    elements.btnBackToShareSheet.addEventListener('click', () => {
        closeShareModal();
        openShareSheet();
    });

    const afterCloseShareModal = () => {
        closeShareModal();
        closeShareSheet();
        showActionChooser();
    };
    elements.closeShareModal.addEventListener('click', afterCloseShareModal);
    elements.shareModalBackdrop.addEventListener('click', afterCloseShareModal);

    const afterCloseShareSheet = () => {
        closeShareSheet();
        showActionChooser();
    };
    elements.btnCloseShareSheet.addEventListener('click', afterCloseShareSheet);
    elements.shareSheetBackdrop.addEventListener('click', afterCloseShareSheet);

    elements.btnShareLink.addEventListener('click', () => {
        doShareLink();
    });
    elements.btnShareImage.addEventListener('click', () => {
        doShareImage().catch((err) => {
            console.error('生成分享图失败:', err);
            showToast('生成图片失败，请稍后重试');
            openShareSheet();
        });
    });

    elements.redeemPasscodeInput.addEventListener('input', updateRedeemState);
    elements.redeemPasscodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.redeemBtn.click();
        }
    });
    elements.redeemBtn.addEventListener('click', async () => {
        const passcode = elements.redeemPasscodeInput.value.trim();
        if (!passcode) return;
        elements.redeemBtn.disabled = true;
        try {
            const { blessing } = await api.redeemBlessing(passcode);
            showBlessingCard(blessing.content, {
                title: '你捞到了专属祝福饺子 🥟',
                passcode,
                note: '这是专门留给你的冬至祝福，记得好好热一热心里的那口锅。'
            });
        } catch (error) {
            const code = error && error.code ? String(error.code) : '';
            if (code === 'not_found') {
                showToast('没找到这只饺子，再试试？');
            } else {
                console.error('兑换失败:', error);
                showToast('兑换失败，请稍后重试');
            }
        } finally {
            updateRedeemState();
        }
    });

    // 关闭祝福卡片
    elements.cardClose.addEventListener('click', hideBlessingCard);
    elements.blessingCard.addEventListener('click', (e) => {
        if (e.target === elements.blessingCard) {
            hideBlessingCard();
        }
    });
}

// ===== 初始化 =====
async function init() {
    bindEvents();
    const params = new URLSearchParams(location.search);
    setUiTab(params.get('tab') === 'redeem' ? 'redeem' : 'wrap');
    setDelivery('public');
    updateSubmitState();
    updateRedeemState();

    try {
        // 加载现有祝福
        const blessings = await api.getBlessings();
        state.blessings = blessings;

        const displayBlessings = blessings.slice(0, 20);

        displayBlessings.forEach(blessing => {
            addDumplingToContainer(blessing, false);
        });

        // 获取总数
        const { count } = await api.getCount();
        updateProgress(count);

        // 启动雪花效果
        initSnow();

        const codeParam = params.get('code');
        if (state.uiTab === 'redeem' && codeParam) {
            elements.redeemPasscodeInput.value = codeParam;
            updateRedeemState();
            elements.redeemBtn.disabled = true;
            try {
                const { blessing } = await api.redeemBlessing(codeParam);
                showBlessingCard(blessing.content, {
                    title: '你捞到了专属祝福饺子 🥟',
                    passcode: codeParam,
                    note: '这是专门留给你的冬至祝福，记得好好热一热心里的那口锅。'
                });
            } catch (error) {
                const errCode = error && error.code ? String(error.code) : '';
                if (errCode === 'not_found') {
                    showToast('这条链接的暗号已经失效了，再试试其他暗号？');
                } else {
                    console.error('自动兑换失败:', error);
                    showToast('打开失败，请稍后重试');
                }
            } finally {
                updateRedeemState();
            }
        }

    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
