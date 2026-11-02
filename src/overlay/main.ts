import type { ScreenshotData } from './store.js';
import { safeIpc } from './safeIpc.js';
import { initTranslateMode } from './TranslateMode.js';
import { initCaptureMode } from './CaptureMode.js';

window.__SHOT_DATA__ = null;
window.__BOOTSTRAP__ = null;

// 顶层同步注册：classic script 保证此处早于 did-finish-load 执行
safeIpc.onData((data: ScreenshotData) => {
    window.__SHOT_DATA__ = data;
    if (typeof window.__BOOTSTRAP__ === 'function') {
        window.__BOOTSTRAP__(data);
    }
});

let booted = false;

function bootstrap(data: ScreenshotData) {
    if (booted) return;
    booted = true;
    window.__SHOT_DATA__ = data;

    const container = document.getElementById('overlay_container');
    if (!container) return;

    if (data.mode === 'translate') {
        // 翻译模式自行构建界面，先清空截图模式的静态 DOM
        container.innerHTML = '';
        initTranslateMode(data.capture);
    } else {
        // 截图模式复用 overlay.html 中的静态 DOM
        initCaptureMode(data.capture);
    }
}

window.__BOOTSTRAP__ = bootstrap;

// 如果数据已在 __SHOT_DATA__（页面刷新等极端情况），立即处理
if (window.__SHOT_DATA__) {
    bootstrap(window.__SHOT_DATA__);
}
