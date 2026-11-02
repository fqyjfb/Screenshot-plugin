import type { CaptureData } from './store.js';
import { safeIpc } from './safeIpc.js';

const MAGNIFIER_ZOOM = 3;
const MIN_SELECTION = 5;

export function initTranslateMode(capture: CaptureData): void {
    const overlayContainer = document.getElementById('overlay_container');
    if (!overlayContainer) return;

    overlayContainer.style.position = 'fixed';
    overlayContainer.style.inset = '0';
    overlayContainer.style.overflow = 'hidden';
    overlayContainer.style.background = '#000';

    // Background image layer
    const bgBlock = document.createElement('div');
    bgBlock.id = 'bgBlock';
    bgBlock.style.position = 'absolute';
    bgBlock.style.top = '0';
    bgBlock.style.left = '0';
    overlayContainer.appendChild(bgBlock);

    const bgImg = document.createElement('img');
    bgImg.id = 'bgImg';
    bgImg.style.position = 'absolute';
    bgImg.style.pointerEvents = 'none';
    bgImg.src = capture.dataUrl;
    bgBlock.appendChild(bgImg);

    // Selection canvas
    const selCanvas = document.createElement('canvas');
    selCanvas.id = 'selCanvas';
    selCanvas.style.position = 'absolute';
    selCanvas.style.top = '0';
    selCanvas.style.left = '0';
    selCanvas.style.zIndex = '1';
    selCanvas.style.cursor = 'crosshair';
    overlayContainer.appendChild(selCanvas);

    const selCtx = selCanvas.getContext('2d');
    if (!selCtx) return;

    selCanvas.width = capture.width;
    selCanvas.height = capture.height;

    // Background offscreen canvas
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = capture.width;
    bgCanvas.height = capture.height;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    const bgImage = new Image();
    bgImage.onload = () => {
        bgCtx.drawImage(bgImage, 0, 0, capture.width, capture.height);
        selCtx.drawImage(bgCanvas, 0, 0);
    };
    bgImage.src = capture.dataUrl;

    // Magnifier
    const magnifier = document.createElement('div');
    magnifier.id = 'magnifier';
    magnifier.style.position = 'absolute';
    magnifier.style.width = `${120}px`;
    magnifier.style.height = `${120}px`;
    magnifier.style.borderRadius = '50%';
    magnifier.style.border = '2px solid rgba(255,255,255,0.6)';
    magnifier.style.overflow = 'hidden';
    magnifier.style.pointerEvents = 'none';
    magnifier.style.cursor = 'none';
    magnifier.style.display = 'none';
    magnifier.style.zIndex = '3';

    const magContent = document.createElement('div');
    magContent.id = 'magContent';
    magContent.style.position = 'absolute';
    magContent.style.width = `${capture.width * MAGNIFIER_ZOOM}px`;
    magContent.style.height = `${capture.height * MAGNIFIER_ZOOM}px`;
    magContent.style.backgroundRepeat = 'no-repeat';
    magContent.style.pointerEvents = 'none';
    magContent.style.display = 'none';

    // Clone bgBlock at 3x zoom for magnifier
    const clone = bgBlock.cloneNode(true) as HTMLElement;
    clone.style.zoom = String(MAGNIFIER_ZOOM);
    clone.style.width = `${capture.width * MAGNIFIER_ZOOM}px`;
    clone.style.height = `${capture.height * MAGNIFIER_ZOOM}px`;
    clone.style.position = 'absolute';
    clone.querySelector('img')!.removeAttribute('class');
    magContent.appendChild(clone);

    magnifier.appendChild(magContent);
    bgBlock.appendChild(magnifier);

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let magReady = false;

    overlayContainer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.pageX;
        startY = e.pageY;
        isDrawing = true;
    });

    overlayContainer.addEventListener('mousemove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;

        const cx = e.pageX;
        const cy = e.pageY;
        const w = cx - startX;
        const h = cy - startY;
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        const left = w < 0 ? cx : startX;
        const top = h < 0 ? cy : startY;

        selCtx.clearRect(0, 0, selCanvas.width, selCanvas.height);
        selCtx.drawImage(bgCanvas, 0, 0);
        selCtx.fillStyle = 'rgba(35,113,248,0.18)';
        selCtx.fillRect(left, top, absW, absH);
        selCtx.strokeStyle = '#2371F8';
        selCtx.lineWidth = 1;
        selCtx.strokeRect(left, top, absW, absH);

        if (magReady) {
            magnifier.style.display = 'block';
            magnifier.style.left = `${-60 + e.pageX}px`;
            magnifier.style.top = `${-60 + e.pageY}px`;
            magContent.style.left = `${(e.pageX - magnifier.offsetLeft) / MAGNIFIER_ZOOM - e.pageX}px`;
            magContent.style.top = `${(e.pageY - magnifier.offsetTop) / MAGNIFIER_ZOOM - e.pageY}px`;
        }
    });

    overlayContainer.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        magReady = true;

        const w = e.pageX - startX;
        const h = e.pageY - startY;
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        const left = w < 0 ? e.pageX : startX;
        const top = h < 0 ? e.pageY : startY;

        if (absW > MIN_SELECTION && absH > MIN_SELECTION) {
            const imgData = bgCtx.getImageData(left, top, absW, absH);
            const outCanvas = document.createElement('canvas');
            outCanvas.width = absW;
            outCanvas.height = absH;
            outCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
            const dataUrl = outCanvas.toDataURL('image/png');
            safeIpc.translate(dataUrl);
        }
    });

    overlayContainer.addEventListener('mouseleave', () => {
        magnifier.style.display = 'none';
    });

    overlayContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            safeIpc.cancel();
            return;
        }
        // In translate mode, selection auto-triggers on mouseup.
        // 'T' key is not used here since the flow is selection-only.
    });
}
