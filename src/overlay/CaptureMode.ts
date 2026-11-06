import type { CaptureData } from './store.js';
import { safeIpc } from './safeIpc.js';
import xhistory from './lib/history.js';
import { EraserBrush } from '@erase2d/fabric';
import chroma from 'chroma-js';
import {
    Canvas,
    Circle,
    classRegistry,
    type FabricObject,
    IText,
    Line,
    PencilBrush,
    Polygon,
    Polyline,
    Rect,
    SprayBrush,
} from 'fabric';

const MASK_COLOR = '#00000088';
const LINE_COLOR = '#ffffff';
const HANDLE_SIZE = 8;
const BAR_GAP = 8;
const SNAP_STEP = 1;
const MAG_SIZE = 80;

interface RectLike {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface HandlePos {
    cx: number;
    cy: number;
    dir: string;
}

type Mode = 'drawing' | 'resizing' | 'dragging' | 'idle' | 'shape' | 'free' | 'eraser' | 'spray' | 'poly';

const DEFAULT_COLORS = [
    '#000000', '#ffffff', '#ff0000', '#00aa00', '#0066ff',
    '#ffaa00', '#9900cc', '#00cccc', '#ff6699', '#888888',
];

class MaskCls extends Rect {
    static override type = 'mask';
    // fabric 默认不序列化自定义属性，撤销后重建会丢失挖空区域并恢复为可交互对象
    static override customProperties = ['rect', 'selectable', 'evented'];
    declare rect: { x: number; y: number; w: number; h: number };
    constructor(options?: Partial<Parameters<Rect['setOptions']>[0]>) {
        super();
        this.setOptions(options);
    }
    override render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.fillStyle = this.fill?.toString() || MASK_COLOR;
        const cx = this.width / 2;
        const cy = this.height / 2;
        ctx.fillRect(-cx, -cy, this.width, this.height);
        const r = this.rect;
        if (r) ctx.clearRect(r.x - cx, r.y - cy, r.w, r.h);
        ctx.restore();
    }
}
classRegistry.setClass(MaskCls);
class ArrowCls extends Line {
    static override type = 'arrow';
    override render(ctx: CanvasRenderingContext2D) {
        this._render(ctx);
        const p = this.calcLinePoints();
        const angle = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
        const headLen = Math.max(10, (this.strokeWidth ?? 2) * 4);
        ctx.save();
        ctx.translate(p.x2, p.y2);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headLen, -headLen / 2);
        ctx.lineTo(-headLen, headLen / 2);
        ctx.closePath();
        ctx.fillStyle = this.stroke?.toString() || LINE_COLOR;
        ctx.fill();
        ctx.restore();
    }
}
classRegistry.setClass(ArrowCls);

class XNumberCls extends Circle {
    static override type = 'number';
    // 序号文字与字号需随画布一起序列化，否则撤销后编号为空
    static override customProperties = ['txt', 'fontSize'];
    declare fontSize: number;
    declare txt: string;
    constructor(options?: Partial<Parameters<Circle['setOptions']>[0]>) {
        super();
        this.setOptions(options);
    }
    override render(ctx: CanvasRenderingContext2D) {
        this._render(ctx);
        const fillStr = String(this.fill ?? '#ff0000');
        ctx.save();
        ctx.fillStyle = chroma.valid(fillStr) && chroma(fillStr).luminance() > 0.5 ? '#111827' : '#ffffff';
        ctx.font = `${this.fontSize || 14}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(this.txt || ''), 0, 0);
        ctx.restore();
    }
}
classRegistry.setClass(XNumberCls);

export function initCaptureMode(capture: CaptureData): void {
    const { dataUrl, width, height, scaleFactor = 1 } = capture;
    const effectiveW = Math.round(width * scaleFactor);
    const effectiveH = Math.round(height * scaleFactor);

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const overlayContainer = document.getElementById('overlay_container')!;
    const mainCanvas = document.getElementById('main_photo')! as HTMLCanvasElement;
    const drawCanvas = document.getElementById('draw_photo')! as HTMLCanvasElement;
    const clipCanvas = document.getElementById('clip_photo')! as HTMLCanvasElement;
    const clipMaskEl = document.getElementById('clip_mask')!;
    const clipLineEl = document.getElementById('clip_line')!;
    const toolBarEl = document.getElementById('tool_bar')!;
    const drawBarEl = document.getElementById('draw_bar')!;
    const drawSideEl = document.getElementById('draw_side')!;
    const mouseBarEl = document.getElementById('mouse_bar')!;
    const pointColorEl = document.getElementById('point_color')! as HTMLDivElement;
    const colorInfoEl = document.getElementById('color_info')!;
    const clipWhEl = document.getElementById('clip_wh')!;

    // ── Three-layer canvas setup ──────────────────────────────────────────────
    mainCanvas.width = drawCanvas.width = clipCanvas.width = effectiveW;
    mainCanvas.height = drawCanvas.height = clipCanvas.height = effectiveH;

    const mainCtx = mainCanvas.getContext('2d')!;
    const clipCtx = clipCanvas.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => mainCtx.drawImage(img, 0, 0, effectiveW, effectiveH);
    img.src = dataUrl;

    // ── Fabric canvas ─────────────────────────────────────────────────────────
    const fabricCanvas = new Canvas(drawCanvas.id);
    fabricCanvas.setDimensions({ width: effectiveW, height: effectiveH });
    fabricCanvas.backgroundColor = 'transparent';
    // fabric v7 会把 #draw_photo 包进 .canvas-container（内联 position:relative、无 z-index），
    // 内层 canvas 被置为 position:static → CSS 里 #draw_photo{ z-index:9 } 失效，
    // 而 #main_photo{ position:absolute; z-index:8 } 能形成层叠上下文，结果就是背景图压住了整个 fabric 标注层。
    // 归位 wrapper：绝对定位 + z9，使标注层绘制在 main_photo(8) 之上、clip_photo(10) 之下。
    const fabricWrapper = fabricCanvas.wrapperEl;
    fabricWrapper.style.position = 'absolute';
    fabricWrapper.style.zIndex = '9';
    fabricCanvas.renderAll();

    // ── 4-block mask divs ─────────────────────────────────────────────────────
    const maskEls = Array.from({ length: 4 }, () => {
        const d = document.createElement('div');
        d.style.background = MASK_COLOR;
        d.style.position = 'absolute';
        d.style.pointerEvents = 'none';
        clipMaskEl.appendChild(d);
        return d;
    });

    // ── Reference lines ───────────────────────────────────────────────────────
    const refLineEls: HTMLElement[] = [];
    for (let i = 0; i < 2; i++) {
        const d = document.createElement('div');
        d.style.position = 'absolute';
        d.style.pointerEvents = 'none';
        d.style.background = 'rgba(255,255,255,0.35)';
        clipLineEl.appendChild(d);
        refLineEls.push(d);
    }
    const selBorderEl = document.createElement('div');
    selBorderEl.style.position = 'absolute';
    selBorderEl.style.pointerEvents = 'none';
    selBorderEl.style.border = '1px dashed #fff';
    clipLineEl.appendChild(selBorderEl);

    // ── Selection state ───────────────────────────────────────────────────────
    let selection: RectLike | null = null;
    let mode: Mode = 'idle';
    let dragStart = { x: 0, y: 0 };
    let resizeDir = '';
    let startRect: RectLike = { x: 0, y: 0, w: 0, h: 0 };
    let showBars = false;
    let currentTool = 'select' as string;
    let shapeDrawStart: { x: number; y: number } | null = null;
    let tempShape: Rect | Line | null = null;

    // ── Drawing state ─────────────────────────────────────────────────────────
    let strokeColor = '#000000';
    let fillColor = 'transparent';
    let strokeWidth = 2;
    let colorMode: 'stroke' | 'fill' = 'stroke';
    let freeWidth = 3;
    let freeColor = '#000000';
    let isDrawingShape = false;
    let polyPoints: { x: number; y: number }[] = [];
    let polyTemp: Polyline | null = null;

    // ── Magnifier ─────────────────────────────────────────────────────────────
    const magCanvas = document.createElement('canvas');
    magCanvas.width = MAG_SIZE;
    magCanvas.height = MAG_SIZE;
    magCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;image-rendering:pixelated;';
    pointColorEl.appendChild(magCanvas);
    const magCtx = magCanvas.getContext('2d')!;

    // ── History (undo/redo for selection + fabric) ────────────────────────────
    interface HistEntry {
        rect: RectLike | null;
        canvas: string;
    }
    // 历史里的数据每次都是新克隆对象，引用比较永远不相等，改用序列化比较避免无变化的重复入栈
    const history = new xhistory<HistEntry, HistEntry>([], { rect: null, canvas: JSON.stringify(fabricCanvas.toJSON()) }, {
        diff: (last, now) => (JSON.stringify(last) === JSON.stringify(now) ? null : now),
        apply: (_, diff) => diff,
    });

    function snapshot(): string {
        return JSON.stringify(fabricCanvas.toJSON());
    }

    function pushHistory(des = 'draw') {
        history.setData({ rect: selection, canvas: snapshot() }, des);
        history.apply();
    }

    function doUndo() {
        if (history.index <= 0) return;
        // 先清理未提交的临时图形，避免撤销后残留预览/半成品
        isDrawingShape = false;
        shapeDrawStart = null;
        if (tempShape) {
            fabricCanvas.remove(tempShape);
            tempShape = null;
        }
        resetPoly();
        mode = 'idle';
        history.undo();
        const entry = history.getData();
        if (!entry) return;
        selection = entry.rect;
        fabricCanvas.loadFromJSON(entry.canvas, () => fabricCanvas.renderAll());
        refresh();
    }

    // ── Coordinate conversion ─────────────────────────────────────────────────
    function screenToCanvas(sx: number, sy: number): { x: number; y: number } {
        const rect = clipCanvas.getBoundingClientRect();
        const scaleX = effectiveW / rect.width;
        const scaleY = effectiveH / rect.height;
        return {
            x: Math.round((sx - rect.left) * scaleX),
            y: Math.round((sy - rect.top) * scaleY),
        };
    }

    function snap(v: number) {
        return Math.max(0, Math.round(v));
    }

    // ── get 8 handles ─────────────────────────────────────────────────────────
    function getHandles(r: RectLike): HandlePos[] {
        const { x, y, w, h } = r;
        return [
            { cx: x, cy: y, dir: 'nw' },
            { cx: x + w / 2, cy: y, dir: 'n' },
            { cx: x + w, cy: y, dir: 'ne' },
            { cx: x + w, cy: y + h / 2, dir: 'e' },
            { cx: x + w, cy: y + h, dir: 'se' },
            { cx: x + w / 2, cy: y + h, dir: 's' },
            { cx: x, cy: y + h, dir: 'sw' },
            { cx: x, cy: y + h / 2, dir: 'w' },
        ];
    }

    // ── Update 4-block mask ───────────────────────────────────────────────────
    function updateMask(r: RectLike) {
        const { x, y, w, h } = r;
        const cw = clipCanvas.clientWidth;
        const ch = clipCanvas.clientHeight;
        maskEls[0].style.left = '0';
        maskEls[0].style.top = '0';
        maskEls[0].style.width = cw + 'px';
        maskEls[0].style.height = Math.max(0, snap(y)) + 'px';
        maskEls[1].style.left = '0';
        maskEls[1].style.top = Math.max(0, snap(y + h)) + 'px';
        maskEls[1].style.width = cw + 'px';
        maskEls[1].style.height = Math.max(0, ch - snap(y + h)) + 'px';
        maskEls[2].style.left = '0';
        maskEls[2].style.top = Math.max(0, snap(y)) + 'px';
        maskEls[2].style.width = Math.max(0, snap(x)) + 'px';
        maskEls[2].style.height = Math.max(0, snap(y + h) - snap(y)) + 'px';
        maskEls[3].style.left = Math.max(0, snap(x + w)) + 'px';
        maskEls[3].style.top = Math.max(0, snap(y)) + 'px';
        maskEls[3].style.width = Math.max(0, cw - snap(x + w)) + 'px';
        maskEls[3].style.height = Math.max(0, snap(y + h) - snap(y)) + 'px';
    }

    // ── Draw selection border + handles on clip_canvas ────────────────────────
    function drawClipLine(r: RectLike) {
        clipCtx.clearRect(0, 0, clipCanvas.width, clipCanvas.height);
        if (!r || r.w < 1 || r.h < 1) {
            selBorderEl.style.display = 'none';
            return;
        }
        selBorderEl.style.display = 'block';
        const cr = clipCanvas.getBoundingClientRect();
        const scaleX = cr.width / effectiveW;
        const scaleY = cr.height / effectiveH;
        selBorderEl.style.left = (cr.left + r.x * scaleX) + 'px';
        selBorderEl.style.top = (cr.top + r.y * scaleY) + 'px';
        selBorderEl.style.width = (r.w * scaleX) + 'px';
        selBorderEl.style.height = (r.h * scaleY) + 'px';

        const dpr = window.devicePixelRatio || 1;
        clipCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        clipCtx.scale(cr.width / effectiveW, cr.height / effectiveH);
        clipCtx.setLineDash([6, 3]);
        clipCtx.strokeStyle = LINE_COLOR;
        clipCtx.lineWidth = 1;
        clipCtx.strokeRect(r.x, r.y, r.w, r.h);
        clipCtx.setLineDash([]);

        const hs = HANDLE_SIZE / dpr;
        clipCtx.fillStyle = LINE_COLOR;
        for (const h of getHandles(r)) {
            clipCtx.fillRect(h.cx - hs / 2, h.cy - hs / 2, hs, hs);
        }
        clipCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // ── Update reference lines ────────────────────────────────────────────────
    function updateRefLines(mx: number, my: number) {
        const r = clipCanvas.getBoundingClientRect();
        const scaleX = effectiveW / r.width;
        const scaleY = effectiveH / r.height;
        const cx = (mx - r.left) * scaleX;
        const cy = (my - r.top) * scaleY;
        const sel = selection || { x: 0, y: 0, w: effectiveW, h: effectiveH };
        const [x, y, w, h] = [sel.x, sel.y, sel.w, sel.h];

        refLineEls[0].style.top = r.top + 'px';
        refLineEls[0].style.width = '1px';
        refLineEls[0].style.height = r.height + 'px';
        refLineEls[0].style.display = cx >= x && cx <= x + w ? 'block' : 'none';
        refLineEls[0].style.left = (r.left + cx * (r.width / effectiveW)) + 'px';

        refLineEls[1].style.left = r.left + 'px';
        refLineEls[1].style.top = (r.top + cy * (r.height / effectiveH)) + 'px';
        refLineEls[1].style.width = r.width + 'px';
        refLineEls[1].style.height = '1px';
        refLineEls[1].style.display = cy >= y && cy <= y + h ? 'block' : 'none';
    }

    // ── whBar (size inputs) ────────────────────────────────────────────────────
    interface WhInput {
        el: HTMLInputElement;
        label: string;
    }
    const whInputs: WhInput[] = [];
    const whLabels = ['x0', 'y0', 'x1', 'y1', 'w', 'h'];

    for (const label of whLabels) {
        const wrap = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = label;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 8;
        inp.addEventListener('input', () => onWhChange());
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        });
        inp.addEventListener('blur', () => onWhChange());
        wrap.appendChild(span);
        wrap.appendChild(inp);
        clipWhEl.appendChild(wrap);
        whInputs.push({ el: inp, label });
    }

    function updateWhBar(r: RectLike) {
        const [x, y, w, h] = [r.x, r.y, r.w, r.h];
        whInputs[0].el.value = String(Math.round(x));
        whInputs[1].el.value = String(Math.round(y));
        whInputs[2].el.value = String(Math.round(x + w));
        whInputs[3].el.value = String(Math.round(y + h));
        whInputs[4].el.value = String(Math.round(w));
        whInputs[5].el.value = String(Math.round(h));
        for (const { el } of whInputs) {
            el.style.width = Math.max(2, el.value.length) + 'ch';
        }
        positionWhBar(r);
    }

    function positionWhBar(r: RectLike) {
        const cr = clipCanvas.getBoundingClientRect();
        const scaleX = cr.width / effectiveW;
        const scaleY = cr.height / effectiveH;
        const barW = clipWhEl.offsetWidth || 200;
        const barH = clipWhEl.offsetHeight || 40;
        let left = cr.left + r.x * scaleX + r.w * scaleX / 2 - barW / 2;
        let top = cr.top + r.y * scaleY - barH - BAR_GAP;
        left = Math.max(cr.left, Math.min(cr.right - barW, left));
        top = Math.max(cr.top, Math.min(cr.bottom - barH, top));
        clipWhEl.style.left = left + 'px';
        clipWhEl.style.top = top + 'px';
        clipWhEl.style.display = showBars ? 'flex' : 'none';
    }

    function onWhChange() {
        if (!selection) return;
        const vals = whInputs.map((i) => {
            const n = Number(i.el.value);
            return isNaN(n) ? null : n;
        });
        if (vals.some((v) => v === null)) return;
        const [x0, y0, x1, y1] = vals as [number, number, number, number, number, number];
        const nr: RectLike = {
            x: snap(Math.min(x0, x1)),
            y: snap(Math.min(y0, y1)),
            w: snap(Math.abs(x1 - x0)),
            h: snap(Math.abs(y1 - y0)),
        };
        history.setData({ rect: nr, canvas: snapshot() }, 'whEdit');
        history.apply();
        selection = nr;
        refresh();
    }

    // ── Magnifier ─────────────────────────────────────────────────────────────
    function updateMagnifier(mx: number, my: number) {
        if (!selection) {
            mouseBarEl.classList.add('mouse_bar_hide');
            return;
        }
        const { x, y, w, h } = selection;
        const inside = mx >= x && mx <= x + w && my >= y && my <= y + h;
        if (!inside) {
            mouseBarEl.classList.add('mouse_bar_hide');
            return;
        }
        mouseBarEl.classList.remove('mouse_bar_hide');
        const patchSize = MAG_SIZE;
        const srcX = Math.max(0, Math.min(effectiveW - patchSize, mx - patchSize / 2));
        const srcY = Math.max(0, Math.min(effectiveH - patchSize, my - patchSize / 2));
        const drawSize = Math.min(patchSize, effectiveW - srcX, effectiveH - srcY);
        magCtx.imageSmoothingEnabled = false;
        magCtx.drawImage(mainCanvas, srcX, srcY, drawSize, drawSize, 0, 0, MAG_SIZE, MAG_SIZE);

        let crossH = pointColorEl.querySelector('.cross-h') as HTMLElement | null;
        let crossV = pointColorEl.querySelector('.cross-v') as HTMLElement | null;
        let indicator = pointColorEl.querySelector('.indicator') as HTMLElement | null;
        if (!crossH) {
            crossH = document.createElement('div');
            crossH.className = 'cross-h';
            pointColorEl.appendChild(crossH);
        }
        if (!crossV) {
            crossV = document.createElement('div');
            crossV.className = 'cross-v';
            pointColorEl.appendChild(crossV);
        }
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'indicator';
            pointColorEl.appendChild(indicator);
        }
        const relX = mx - (srcX + (MAG_SIZE - drawSize) / 2);
        const relY = my - (srcY + (MAG_SIZE - drawSize) / 2);
        crossH.style.top = '50%';
        crossV.style.left = '50%';
        indicator.style.left = Math.max(0, Math.min(1, relX / MAG_SIZE)) * 100 + '%';
        indicator.style.top = Math.max(0, Math.min(1, relY / MAG_SIZE)) * 100 + '%';

        const barW = MAG_SIZE + 80;
        const barH = mouseBarEl.offsetHeight || 100;
        let left = mx + 16;
        let top = my - barH / 2;
        if (left + barW > window.innerWidth) left = mx - barW - 16;
        if (top < 0) top = 8;
        if (top + barH > window.innerHeight) top = window.innerHeight - barH - 8;
        mouseBarEl.style.left = left + 'px';
        mouseBarEl.style.top = top + 'px';

        // 10-format color info via chroma-js
        const sampleColor = magCtx.getImageData(
            Math.round(MAG_SIZE / 2),
            Math.round(MAG_SIZE / 2),
            1, 1,
        ).data;
        const formats = colorFormats(sampleColor[0], sampleColor[1], sampleColor[2]);
        colorRows.forEach((row, i) => {
            row.textContent = formats[i]!;
        });
        colorInfoEl.style.backgroundColor = formats[0]!.toUpperCase();
        colorInfoEl.style.color = pickTextColor(sampleColor[0], sampleColor[1], sampleColor[2]);
    }

    // ── 取色器：10 种格式，点击复制 ───────────────────────────────────────────
    const colorRows: HTMLElement[] = [];
    function initColorRows() {
        colorInfoEl.textContent = '';
        for (let i = 0; i < 10; i++) {
            const row = document.createElement('div');
            row.className = i === 0 ? 'color_format active' : 'color_format';
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = row.textContent ?? '';
                navigator.clipboard?.writeText(text).catch(() => { /* 剪贴板不可用时忽略 */ });
            });
            colorInfoEl.appendChild(row);
            colorRows.push(row);
        }
    }

    function colorFormats(r: number, g: number, b: number): string[] {
        const c = chroma.rgb(r, g, b);
        const hsl = c.hsl();
        const hsv = c.hsv();
        const lab = c.lab();
        const lch = c.lch();
        const oklab = c.oklab();
        const oklch = c.oklch();
        const cmyk = c.cmyk();
        const w = Math.min(r, g, b) / 255;
        const bl = 1 - Math.max(r, g, b) / 255;
        const wb = w + bl || 1;
        return [
            c.hex().toUpperCase(),
            `rgb(${r},${g},${b})`,
            `hsl(${hsl[0].toFixed(0)},${(hsl[1] * 100).toFixed(0)}%,${(hsl[2] * 100).toFixed(0)}%)`,
            `hsv(${hsv[0].toFixed(0)}°,${(hsv[1] * 100).toFixed(0)}%,${(hsv[2] * 100).toFixed(0)}%)`,
            `hwb(${hsv[0].toFixed(0)}°,${(w / wb * 100).toFixed(0)}%,${(bl / wb * 100).toFixed(0)}%)`,
            `lab(${lab[0].toFixed(1)},${lab[1].toFixed(1)},${lab[2].toFixed(1)})`,
            `lch(${lch[0].toFixed(1)},${lch[1].toFixed(1)},${lch[2].toFixed(0)}°)`,
            `oklab(${oklab[0].toFixed(3)},${oklab[1].toFixed(3)},${oklab[2].toFixed(3)})`,
            `oklch(${oklch[0].toFixed(3)},${oklch[1].toFixed(3)},${oklch[2].toFixed(0)}°)`,
            `cmyk(${(cmyk[0] * 100).toFixed(0)}%,${(cmyk[1] * 100).toFixed(0)}%,${(cmyk[2] * 100).toFixed(0)}%,${(cmyk[3] * 100).toFixed(0)}%)`,
        ];
    }

    function pickTextColor(r: number, g: number, b: number): string {
        return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#111827' : '#ffffff';
    }

    // ── SVG icon helpers ───────────────────────────────────────────────────────
    function svgIcon(path: string, viewBox = '0 0 24 24'): SVGSVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', viewBox);
        svg.innerHTML = path;
        return svg;
    }

    function addToolBtn(
        container: HTMLElement,
        title: string,
        iconSvg: SVGSVGElement,
        click: (e: MouseEvent) => void,
        isActive = false,
    ) {
        const div = document.createElement('div');
        div.title = title;
        div.appendChild(iconSvg);
        if (isActive) div.classList.add('select');
        div.addEventListener('click', click);
        container.appendChild(div);
        return div;
    }

    // ── ICONS ──────────────────────────────────────────────────────────────────
    const ICONS = {
        select: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/>',
        close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.49"/>',
        line: '<line x1="5" y1="19" x2="19" y2="5"/>',
        circle: '<circle cx="12" cy="12" r="9"/>',
        rect: '<rect x="4" y="4" width="16" height="16" rx="1"/>',
        poly: '<polygon points="12,3 21,21 3,21"/>',
        text: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9.5" y1="20" x2="14.5" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
        pen: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
        eraser: '<path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.8 1.4c.8-.8 2-.8 2.8 0l5 5c.8.8.8 2 0 2.8L10 20"/>',
        spray: '<circle cx="17" cy="4" r="2"/><circle cx="19" cy="8" r="1.5"/><circle cx="15" cy="7" r="1.5"/><circle cx="20" cy="12" r="1"/><circle cx="16" cy="11" r="1"/><path d="M5 22l7-7"/><path d="M12 15l3 3"/>',
        arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        mask: '<rect x="3" y="3" width="18" height="18" fill="currentColor" opacity="0.3"/><rect x="7" y="7" width="10" height="10" fill="white"/>',
        num: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">1</text>',
        help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 3.5"/><circle cx="12" cy="17.5" r="0.5"/>',
    };

    // ── Toolbar build ──────────────────────────────────────────────────────────
    addToolBtn(toolBarEl, '关闭 (Esc)', svgIcon(ICONS.close), doCancel);
    addToolBtn(toolBarEl, '复制 (Ctrl+C)', svgIcon(ICONS.copy), doCopy);
    addToolBtn(toolBarEl, '保存 (Enter)', svgIcon(ICONS.save), doSave);
    addToolBtn(toolBarEl, '撤销 (Ctrl+Z)', svgIcon(ICONS.undo), doUndo);
    addToolBtn(toolBarEl, '快捷键 (?)', svgIcon(ICONS.help), toggleHelp);

    // ── Draw bar (shapes + free tools) ────────────────────────────────────────
    const shapeIcons = [
        { key: 'line', icon: ICONS.line, title: '线条' },
        { key: 'circle', icon: ICONS.circle, title: '圆' },
        { key: 'rect', icon: ICONS.rect, title: '矩形' },
        { key: 'poly', icon: ICONS.poly, title: '多边形' },
        { key: 'text', icon: ICONS.text, title: '文字' },
        { key: 'arrow', icon: ICONS.arrow, title: '箭头' },
        { key: 'num', icon: ICONS.num, title: '序号' },
        { key: 'mask', icon: ICONS.mask, title: '遮罩' },
    ];
    const freeIcons = [
        { key: 'free', icon: ICONS.pen, title: '画笔' },
        { key: 'eraser', icon: ICONS.eraser, title: '橡皮' },
        { key: 'spray', icon: ICONS.spray, title: '喷刷' },
    ];

    // Shape sub-panel
    const shapePanel = document.createElement('div');
    shapePanel.id = 'draw_side_shapes';
    shapePanel.style.cssText = 'display:flex;flex-direction:column;gap:2px;padding:4px;';
    for (const s of shapeIcons) {
        const btn = addToolBtn(shapePanel, s.title, svgIcon(s.icon), () => setTool(s.key));
        btn.style.width = '48px';
        btn.style.height = '48px';
    }
    const freePanel = document.createElement('div');
    freePanel.id = 'draw_side_free';
    freePanel.style.cssText = 'display:flex;flex-direction:column;gap:2px;padding:4px;';
    for (const f of freeIcons) {
        const btn = addToolBtn(freePanel, f.title, svgIcon(f.icon), () => setTool(f.key));
        btn.style.width = '48px';
        btn.style.height = '48px';
    }

    const sideContents = [
        { key: 'select', el: null },
        { key: 'line', el: shapePanel },
        { key: 'circle', el: shapePanel },
        { key: 'rect', el: shapePanel },
        { key: 'poly', el: shapePanel },
        { key: 'text', el: shapePanel },
        { key: 'arrow', el: shapePanel },
        { key: 'num', el: shapePanel },
        { key: 'mask', el: shapePanel },
        { key: 'free', el: freePanel },
        { key: 'eraser', el: freePanel },
        { key: 'spray', el: freePanel },
    ];

    function showSide(key: string) {
        const item = sideContents.find((s) => s.key === key);
        if (!item) return;
        drawSideEl.innerHTML = '';
        if (item.el) drawSideEl.appendChild(item.el);
        drawSideEl.classList.remove('draw_side_hide');
    }
    function hideSide() {
        // 只收起二级面板，绘制工具栏本身需保持可见
        drawSideEl.innerHTML = '';
        drawSideEl.classList.add('draw_side_hide');
    }

    // Draw bar buttons
    const drawBarBtns = [
        { key: 'select', icon: ICONS.select, title: '选择' },
        { key: 'line', icon: ICONS.line, title: '线条' },
        { key: 'circle', icon: ICONS.circle, title: '圆' },
        { key: 'rect', icon: ICONS.rect, title: '矩形' },
        { key: 'free', icon: ICONS.pen, title: '画笔' },
        { key: 'color', icon: '<circle cx="12" cy="12" r="8"/>', title: '颜色' },
        { key: 'width', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="3" stroke="currentColor"/>', title: '线宽' },
    ];
    for (const b of drawBarBtns) {
        addToolBtn(drawBarEl, b.title, svgIcon(b.icon), () => onDrawBarClick(b.key), b.key === currentTool);
    }

    function onDrawBarClick(key: string) {
        if (key === 'color') {
            showColorPanel();
            return;
        }
        if (key === 'width') {
            showWidthPanel();
            return;
        }
        if (currentTool === key) {
            setTool('select');
            return;
        }
        setTool(key);
    }

    function setTool(tool: string) {
        // Commit any in-progress shape
        if (isDrawingShape && tempShape) {
            fabricCanvas.remove(tempShape);
            tempShape = null;
        }
        resetPoly();
        isDrawingShape = false;
        currentTool = tool;
        mode = 'idle';

        // Update draw bar selection state
        drawBarEl.querySelectorAll('div').forEach((div, i) => {
            div.classList.toggle('select', drawBarBtns[i]?.key === tool);
        });

        // Hide side panel unless in shape/free tool
        const shapeTools = ['line', 'circle', 'rect', 'poly', 'text', 'arrow', 'num', 'mask'];
        const freeTools = ['free', 'eraser', 'spray'];
        if (shapeTools.includes(tool) || freeTools.includes(tool)) {
            showSide(tool);
        } else {
            hideSide();
        }

        // Configure fabric
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        fabricCanvas.isDrawingMode = false;
        shapeDrawStart = null;

        if (tool === 'free') {
            fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.color = freeColor;
            fabricCanvas.freeDrawingBrush.width = freeWidth;
            setFreeCursor(freeWidth, freeColor, false);
            fabricCanvas.isDrawingMode = true;
            mode = 'free';
        } else if (tool === 'eraser') {
            const eraser = new EraserBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush = eraser;
            fabricCanvas.freeDrawingBrush.width = freeWidth;
            setFreeCursor(freeWidth, '#ffffff', true);
            fabricCanvas.isDrawingMode = true;
            mode = 'eraser';
        } else if (tool === 'spray') {
            fabricCanvas.freeDrawingBrush = new SprayBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.color = freeColor;
            fabricCanvas.freeDrawingBrush.width = freeWidth * 3;
            setFreeCursor(freeWidth * 3, freeColor, false);
            fabricCanvas.isDrawingMode = true;
            mode = 'spray';
        } else {
            fabricCanvas.freeDrawingCursor = 'auto';
        }
    }

    function setFreeCursor(size: number, color: string, isEraser: boolean) {
        const svgW = Math.max(10, size);
        const hW = svgW / 2;
        const r = svgW / 2;
        const fillStyle = isEraser ? 'fill:none;stroke:#000;stroke-width:1' : `fill:${color};`;
        const svg = `<svg width="${svgW}" height="${svgW}" xmlns="http://www.w3.org/2000/svg"><line x1="0" x2="${svgW}" y1="${hW}" y2="${hW}" stroke="#000"/><line y1="0" y2="${svgW}" x1="${hW}" x2="${hW}" stroke="#000"/><circle style="${fillStyle}cx="${hW}" cy="${hW}" r="${r}"/></svg>`;
        const d = document.createElement('div');
        d.innerHTML = svg;
        const s = new XMLSerializer().serializeToString(d.querySelector('svg') as SVGElement);
        const cursorUrl = `data:image/svg+xml;base64,${window.btoa(s)}`;
        fabricCanvas.freeDrawingCursor = `url("${cursorUrl}") ${hW} ${hW}, auto`;
    }

    // ── Color panel ─────────────────────────────────────────────────────────────
    function showColorPanel() {
        drawSideEl.innerHTML = '';
        const panel = document.createElement('div');
        panel.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding:8px;';

        // Mode toggle: stroke / fill
        const modeRow = document.createElement('div');
        modeRow.style.cssText = 'display:flex;gap:4px;';
        const strokeBtn = document.createElement('div');
        strokeBtn.textContent = '描边';
        strokeBtn.style.cssText = 'padding:4px 8px;cursor:pointer;border-radius:4px;background:' + (colorMode === 'stroke' ? '#ddd' : 'transparent');
        strokeBtn.addEventListener('click', () => { colorMode = 'stroke'; showColorPanel(); });
        const fillBtn = document.createElement('div');
        fillBtn.textContent = '填充';
        fillBtn.style.cssText = 'padding:4px 8px;cursor:pointer;border-radius:4px;background:' + (colorMode === 'fill' ? '#ddd' : 'transparent');
        fillBtn.addEventListener('click', () => { colorMode = 'fill'; showColorPanel(); });
        modeRow.appendChild(strokeBtn);
        modeRow.appendChild(fillBtn);
        panel.appendChild(modeRow);

        // Color swatches
        const swatchRow = document.createElement('div');
        swatchRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
        for (const c of DEFAULT_COLORS) {
            const sw = document.createElement('div');
            sw.style.cssText = `width:24px;height:24px;border-radius:4px;cursor:pointer;border:2px solid ${c === '#ffffff' ? '#ccc' : c};background:${c};`;
            sw.addEventListener('click', () => {
                if (colorMode === 'stroke') {
                    strokeColor = c;
                    freeColor = c;
                    if (fabricCanvas.freeDrawingBrush) fabricCanvas.freeDrawingBrush.color = c;
                } else {
                    fillColor = c;
                }
            });
            swatchRow.appendChild(sw);
        }
        // Custom color input
        const customWrap = document.createElement('div');
        customWrap.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:4px;';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = strokeColor;
        colorInput.style.width = '32px';
        colorInput.style.height = '24px';
        colorInput.addEventListener('input', (e) => {
            const v = (e.target as HTMLInputElement).value;
            if (colorMode === 'stroke') {
                strokeColor = v;
                freeColor = v;
                if (fabricCanvas.freeDrawingBrush) fabricCanvas.freeDrawingBrush.color = v;
            } else {
                fillColor = v;
            }
        });
        const colorHex = document.createElement('span');
        colorHex.textContent = strokeColor.toUpperCase();
        colorHex.style.cssText = 'font-family:monospace;font-size:12px;';
        customWrap.appendChild(colorInput);
        customWrap.appendChild(colorHex);
        panel.appendChild(swatchRow);
        panel.appendChild(customWrap);

        drawSideEl.appendChild(panel);
        drawSideEl.classList.remove('draw_side_hide');
    }

    // ── Stroke width panel ──────────────────────────────────────────────────────
    function showWidthPanel() {
        drawSideEl.innerHTML = '';
        const panel = document.createElement('div');
        panel.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px;';

        const label = document.createElement('span');
        label.textContent = `线宽: ${strokeWidth}px`;
        label.style.cssText = 'font-size:12px;font-family:monospace;';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '20';
        slider.value = String(strokeWidth);
        slider.style.width = '120px';
        slider.addEventListener('input', () => {
            strokeWidth = Number(slider.value);
            freeWidth = strokeWidth;
            label.textContent = `线宽: ${strokeWidth}px`;
            if (fabricCanvas.freeDrawingBrush) fabricCanvas.freeDrawingBrush.width = strokeWidth;
            fabricCanvas.forEachObject((obj) => {
                if ('strokeWidth' in obj) obj.set('strokeWidth', strokeWidth);
            });
            fabricCanvas.requestRenderAll();
        });

        panel.appendChild(label);
        panel.appendChild(slider);
        drawSideEl.appendChild(panel);
        drawSideEl.classList.remove('draw_side_hide');
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    /** 把背景截图与 fabric 标注合成，按当前选区裁切 */
    function renderComposite(done: (dataUrl: string) => void) {
        if (!selection) {
            done(mainCanvas.toDataURL('image/png'));
            return;
        }
        const { x, y, w, h } = selection;
        const tmp = document.createElement('canvas');
        tmp.width = w;
        tmp.height = h;
        const tmpCtx = tmp.getContext('2d')!;
        tmpCtx.drawImage(mainCanvas, x, y, w, h, 0, 0, w, h);
        const annotation = fabricCanvas.toDataURL({ format: 'png', multiplier: 1, left: x, top: y, width: w, height: h });
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            tmpCtx.drawImage(img, 0, 0);
            done(tmp.toDataURL('image/png'));
        };
        img.src = annotation;
    }

    function doCopy() {
        renderComposite((dataUrl) => {
            safeIpc.copyToClipboard(dataUrl);
            safeIpc.complete();
        });
    }

    function doSave() {
        renderComposite((dataUrl) => {
            safeIpc.save({ buffer: dataUrl, format: 'png' }).then((res) => {
                // 只有真正写入文件后才结束会话；取消对话框应回到标注状态
                if (res?.success) safeIpc.complete();
            });
        });
    }

    function doCancel() {
        safeIpc.cancel();
    }

    // ── followBar ──────────────────────────────────────────────────────────────
    function followBar() {
        if (!selection) {
            toolBarEl.style.left = '10px';
            toolBarEl.style.top = '100px';
            return;
        }
        const cr = clipCanvas.getBoundingClientRect();
        const scaleX = cr.width / effectiveW;
        const scaleY = cr.height / effectiveH;
        const sr = {
            left: cr.left + selection.x * scaleX,
            top: cr.top + selection.y * scaleY,
            right: cr.left + (selection.x + selection.w) * scaleX,
            bottom: cr.top + (selection.y + selection.h) * scaleY,
        };
        const midX = (sr.left + sr.right) / 2;
        const midY = (sr.top + sr.bottom) / 2;
        const toolW = toolBarEl.offsetWidth;
        const gap = 12;
        if (midX <= window.innerWidth / 2) {
            toolBarEl.style.left = Math.max(gap, sr.right + gap) + 'px';
        } else {
            toolBarEl.style.left = Math.max(gap, sr.left - toolW - gap) + 'px';
        }
        const toolH = toolBarEl.offsetHeight;
        toolBarEl.style.top = Math.max(gap, Math.min(window.innerHeight - toolH - gap, midY - toolH / 2)) + 'px';
    }

    // ── Refresh all visuals ───────────────────────────────────────────────────
    function refresh() {
        if (selection) {
            updateMask(selection);
            drawClipLine(selection);
            updateWhBar(selection);
            showBars = true;
        } else {
            for (const d of maskEls) {
                d.style.width = '0';
                d.style.height = '0';
            }
            selBorderEl.style.display = 'none';
            clipWhEl.style.display = 'none';
            showBars = false;
        }
        clipWhEl.style.display = showBars ? 'flex' : 'none';
        followBar();
    }

    // ── Hit test ──────────────────────────────────────────────────────────────
    function hitTestHandle(px: number, py: number): string {
        if (!selection) return '';
        for (const h of getHandles(selection)) {
            if (Math.abs(px - h.cx) <= HANDLE_SIZE && Math.abs(py - h.cy) <= HANDLE_SIZE)
                return h.dir;
        }
        return '';
    }

    function hitTestDrag(px: number, py: number): boolean {
        if (!selection) return false;
        return px >= selection.x && px <= selection.x + selection.w &&
               py >= selection.y && py <= selection.y + selection.h;
    }

    // ── Apply rect with validation ───────────────────────────────────────────
    function applyRect(r: RectLike) {
        r.x = snap(Math.max(0, Math.min(effectiveW, r.x)));
        r.y = snap(Math.max(0, Math.min(effectiveH, r.y)));
        r.w = snap(Math.min(effectiveW - r.x, Math.max(0, r.w)));
        r.h = snap(Math.min(effectiveH - r.y, Math.max(0, r.h)));
    }

    function commitRect(r: RectLike, des = 'move') {
        selection = r;
        pushHistory(des);
        refresh();
    }

    // ── Shape drawing on fabric ────────────────────────────────────────────────
    function createShape(shapeType: string, x1: number, y1: number, x2: number, y2: number) {
        const pro = { fc: fillColor, sc: strokeColor, sw: strokeWidth };
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2);
        const h = Math.abs(y1 - y2);

        let obj: FabricObject | null = null;
        if (shapeType === 'line') {
            obj = new Line([x1, y1, x2, y2], {
                stroke: pro.sc,
                strokeWidth: pro.sw,
                originX: 'left',
                originY: 'top',
            });
        } else if (shapeType === 'circle') {
            obj = new Circle({
                radius: Math.max(w, h) / 2,
                left: x,
                top: y,
                fill: pro.fc,
                stroke: pro.sc,
                strokeWidth: pro.sw,
                originX: 'left',
                originY: 'top',
            });
        } else if (shapeType === 'rect') {
            obj = new Rect({
                left: x,
                top: y,
                width: w,
                height: h,
                fill: pro.fc,
                stroke: pro.sc,
                strokeWidth: pro.sw,
                originX: 'left',
                originY: 'top',
            });
        } else if (shapeType === 'arrow') {
            obj = new ArrowCls([x1, y1, x2, y2], {
                stroke: pro.sc,
                strokeWidth: pro.sw,
                originX: 'left',
                originY: 'top',
            });
        } else if (shapeType === 'mask') {
            obj = new MaskCls({
                left: 0,
                top: 0,
                width: effectiveW,
                height: effectiveH,
                fill: pro.fc === 'transparent' ? MASK_COLOR : pro.fc,
                rect: { x, y, w, h },
                selectable: false,
                evented: false,
            });
        } else if (shapeType === 'num') {
            const next = fabricCanvas.getObjects().reduce((max, o) => {
                return o.type === 'number' ? Math.max(max, Number((o as XNumberCls).txt) || 0) : max;
            }, 0) + 1;
            obj = new XNumberCls({
                radius: 12,
                left: x1,
                top: y1,
                originX: 'center',
                originY: 'center',
                fill: pro.fc === 'transparent' ? '#ff0000' : pro.fc,
                stroke: pro.sc,
                strokeWidth: 1,
                fontSize: 14,
                txt: String(next),
            });
        } else if (shapeType === 'text') {
            obj = new IText('文字', {
                left: x,
                top: y,
                fill: pro.sc,
                fontSize: 20,
                originX: 'left',
                originY: 'top',
            });
        }
        if (obj) {
            fabricCanvas.add(obj);
            fabricCanvas.setActiveObject(obj);
            fabricCanvas.requestRenderAll();
        }
    }

    // ── Polygon tool（单击落点，双击闭合）─────────────────────────────────────
    function resetPoly() {
        if (polyTemp) {
            fabricCanvas.remove(polyTemp);
            polyTemp = null;
        }
        polyPoints = [];
    }

    function updatePolyPreview(px: number, py: number) {
        if (!polyPoints.length) return;
        const pts = [...polyPoints];
        const cursor = { x: px, y: py };
        while (pts.length < 2) pts.push({ ...cursor });
        pts.push(cursor);
        if (!polyTemp) {
            polyTemp = new Polyline(pts, {
                fill: 'transparent',
                stroke: strokeColor,
                strokeWidth,
                strokeDashArray: [5, 3],
                selectable: false,
                evented: false,
                objectCaching: false,
            });
            fabricCanvas.add(polyTemp);
        } else {
            polyTemp.set({ points: pts });
            polyTemp.setBoundingBox(true);
            polyTemp.set({ dirty: true });
        }
        fabricCanvas.requestRenderAll();
    }

    function finishPoly() {
        const pts = polyPoints.filter((p, i) => {
            const prev = polyPoints[i - 1];
            return !prev || Math.abs(p.x - prev.x) > 1 || Math.abs(p.y - prev.y) > 1;
        });
        resetPoly();
        mode = 'idle';
        if (pts.length < 3) return;
        const obj = new Polygon(pts, {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
        });
        fabricCanvas.add(obj);
        fabricCanvas.setActiveObject(obj);
        fabricCanvas.requestRenderAll();
        pushHistory();
    }

    function moveLayer(dir: 1 | -1) {
        const objs = fabricCanvas.getObjects();
        const obj = fabricCanvas.getActiveObject() ?? objs[objs.length - 1];
        const from = obj ? objs.indexOf(obj) : -1;
        const to = from + dir;
        if (from < 0 || to < 0 || to >= objs.length) return;
        fabricCanvas.remove(obj!);
        fabricCanvas.insertAt(to, obj!);
        fabricCanvas.setActiveObject(obj!);
        fabricCanvas.requestRenderAll();
        pushHistory();
    }

    // ── Mouse events ──────────────────────────────────────────────────────────
    overlayContainer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        // UI 面板（工具栏/编辑栏/色板/尺寸栏/帮助面板）均为 overlay_container 子元素，
        // mousedown 会冒泡至此。点击面板应只触发自身 click，不进入"新建选区/拖拽/缩放"逻辑。
        const uiHit = (e.target as HTMLElement).closest(
            '#tool_bar,#draw_bar,#draw_side,#clip_wh,#mouse_bar,#shortcut_help'
        );
        if (uiHit) return;

        const { x: px, y: py } = screenToCanvas(e.clientX, e.clientY);

        // Polygon: 单击落点，双击闭合
        if (currentTool === 'poly') {
            if (e.detail >= 2) return;
            polyPoints.push({ x: px, y: py });
            mode = 'poly';
            updatePolyPreview(px, py);
            return;
        }

        // Free drawing / spray
        if (mode === 'free' || mode === 'eraser' || mode === 'spray') {
            fabricCanvas.isDrawingMode = true;
            return;
        }

        // Shape tools
        const shapeTools = ['line', 'circle', 'rect', 'text', 'arrow', 'num', 'mask'];
        if (shapeTools.includes(currentTool)) {
            isDrawingShape = true;
            shapeDrawStart = { x: px, y: py };
            mode = 'drawing';
            startRect = { x: px, y: py, w: 0, h: 0 };
            // Create temp shape for live preview
            if (currentTool !== 'text' && currentTool !== 'num') {
                tempShape = new Rect({
                    left: px, top: py, width: 0, height: 0,
                    fill: 'transparent',
                    stroke: strokeColor,
                    strokeWidth: strokeWidth,
                    strokeDashArray: [5, 3],
                    selectable: false,
                    evented: false,
                });
                fabricCanvas.add(tempShape);
                fabricCanvas.requestRenderAll();
            }
            return;
        }

        // Select / default mode
        if (selection && mode === 'idle') {
            const dir = hitTestHandle(px, py);
            if (dir) {
                mode = 'resizing';
                resizeDir = dir;
                startRect = { ...selection };
                dragStart = { x: px, y: py };
                return;
            }
            if (hitTestDrag(px, py)) {
                mode = 'dragging';
                dragStart = { x: px - selection.x, y: py - selection.y };
                return;
            }
        }

        // Start new selection
        mode = 'drawing';
        startRect = { x: px, y: py, w: 0, h: 0 };
        selection = null;
        pushHistory();
        refresh();
    });

    overlayContainer.addEventListener('mousemove', (e) => {
        const { x: px, y: py } = screenToCanvas(e.clientX, e.clientY);

        // Update magnifier
        updateMagnifier(px, py);
        updateRefLines(px, py);

        if (currentTool === 'poly') {
            if (polyPoints.length) updatePolyPreview(px, py);
            return;
        }

        // Free drawing cursor handled by fabric
        if (mode === 'free' || mode === 'eraser' || mode === 'spray') return;

        // Shape preview
        if (isDrawingShape && shapeDrawStart && tempShape) {
            const x = Math.min(shapeDrawStart.x, px);
            const y = Math.min(shapeDrawStart.y, py);
            const w = Math.abs(px - shapeDrawStart.x);
            const h = Math.abs(py - shapeDrawStart.y);
            tempShape.set({ left: x, top: y, width: w, height: h });
            fabricCanvas.requestRenderAll();
            return;
        }

        if (mode === 'drawing') {
            const r: RectLike = {
                x: Math.min(startRect.x, px),
                y: Math.min(startRect.y, py),
                w: Math.abs(px - startRect.x),
                h: Math.abs(py - startRect.y),
            };
            applyRect(r);
            selection = r;
            refresh();
        } else if (mode === 'resizing' && selection) {
            const dr = { ...startRect };
            const dx = px - dragStart.x;
            const dy = py - dragStart.y;
            if (resizeDir.includes('e')) dr.w = Math.max(1, startRect.w + dx);
            if (resizeDir.includes('w')) { dr.x = startRect.x + dx; dr.w = Math.max(1, startRect.w - dx); }
            if (resizeDir.includes('s')) dr.h = Math.max(1, startRect.h + dy);
            if (resizeDir.includes('n')) { dr.y = startRect.y + dy; dr.h = Math.max(1, startRect.h - dy); }
            applyRect(dr);
            selection = dr;
            refresh();
        } else if (mode === 'dragging' && selection) {
            const dr: RectLike = {
                x: snap(px - dragStart.x),
                y: snap(py - dragStart.y),
                w: selection.w,
                h: selection.h,
            };
            applyRect(dr);
            selection = dr;
            refresh();
        } else {
            const dir = selection ? hitTestHandle(px, py) : '';
            const cursors: Record<string, string> = {
                nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
                e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
                sw: 'nesw-resize', w: 'ew-resize',
            };
            clipCanvas.style.cursor = dir ? cursors[dir]! : (hitTestDrag(px, py) ? 'move' : 'crosshair');
        }
    });

    overlayContainer.addEventListener('mouseup', (e) => {
        if (mode === 'poly') return;
        const { x: px, y: py } = screenToCanvas(e.clientX, e.clientY);

        // Finalize shape
        if (isDrawingShape && shapeDrawStart) {
            isDrawingShape = false;
            if (tempShape) {
                fabricCanvas.remove(tempShape);
                tempShape = null;
            }
            const w = Math.abs(px - shapeDrawStart.x);
            const h = Math.abs(py - shapeDrawStart.y);
            if (w > 3 && h > 3) {
                createShape(currentTool, shapeDrawStart.x, shapeDrawStart.y, px, py);
                pushHistory();
            }
            shapeDrawStart = null;
            mode = 'idle';
            return;
        }

        if (mode === 'drawing' && selection && selection.w < 5 && selection.h < 5) {
            selection = null;
            refresh();
        }
        if (mode === 'drawing' || mode === 'resizing' || mode === 'dragging') {
            pushHistory();
        }
        mode = 'idle';
    });

    // 双击闭合多边形
    overlayContainer.addEventListener('dblclick', (e) => {
        if (currentTool !== 'poly' || !polyPoints.length) return;
        e.preventDefault();
        finishPoly();
    });

    // ── 快捷键帮助 ────────────────────────────────────────────────────────────
    const helpEl = document.createElement('div');
    helpEl.id = 'shortcut_help';
    const helpTitle = document.createElement('h3');
    helpTitle.textContent = '快捷键';
    helpEl.appendChild(helpTitle);
    const shortcutRows: [string, string][] = [
        ['新建选区', '拖拽空白处'],
        ['调整 / 移动选区', '拖拽控制点 / 方向键'],
        ['撤销', 'Ctrl+Z'],
        ['复制', 'Ctrl+C'],
        ['保存', 'Enter'],
        ['上移图层', 'Ctrl+]'],
        ['下移图层', 'Ctrl+['],
        ['多边形落点 / 闭合', '单击 / 双击'],
        ['长截屏', '点击工具（Shift 横向）'],
        ['关闭', 'Esc'],
        ['显示 / 隐藏本表', '?'],
    ];
    for (const [name, key] of shortcutRows) {
        const row = document.createElement('div');
        row.className = 'row';
        const label = document.createElement('span');
        label.textContent = name;
        const keyEl = document.createElement('span');
        keyEl.className = 'key';
        keyEl.textContent = key;
        row.append(label, keyEl);
        helpEl.appendChild(row);
    }
    overlayContainer.appendChild(helpEl);

    function toggleHelp() {
        helpEl.classList.toggle('visible');
    }

    // ── Keyboard ──────────────────────────────────────────────────────────────
    window.addEventListener('keydown', (e) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        const active = fabricCanvas.getActiveObject();
        if (active instanceof IText && active.isEditing) return;
        if (e.key === 'Escape') {
            if (helpEl.classList.contains('visible')) { helpEl.classList.remove('visible'); return; }
            if (polyPoints.length) { resetPoly(); mode = 'idle'; return; }
            doCancel();
            return;
        }
        if (e.key === '?' || e.key === 'F1') { e.preventDefault(); toggleHelp(); return; }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doUndo(); return; }
        if (e.key === 'c' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doCopy(); return; }
        if (e.key === ']' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); moveLayer(1); return; }
        if (e.key === '[' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); moveLayer(-1); return; }
        if (e.key === 'Enter' && selection) { doSave(); return; }

        // Arrow key movement for selection
        if (!selection || mode !== 'idle') return;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const step = e.ctrlKey ? SNAP_STEP * 5 : e.shiftKey ? SNAP_STEP * 10 : SNAP_STEP;
        const { x, y, w, h } = selection;
        if (e.key === 'ArrowUp') commitRect({ x, y: y - step, w, h }, 'arrow');
        else if (e.key === 'ArrowDown') commitRect({ x, y: y + step, w, h }, 'arrow');
        else if (e.key === 'ArrowLeft') commitRect({ x: x - step, y, w, h }, 'arrow');
        else if (e.key === 'ArrowRight') commitRect({ x: x + step, y, w, h }, 'arrow');
    });

    // 右键展开/收起全部颜色格式
    overlayContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!selection) return;
        mouseBarEl.classList.toggle('color_expanded');
    });

    // ── Init ──────────────────────────────────────────────────────────────────
    fabricCanvas.on('path:created', () => pushHistory());
    initColorRows();
    pushHistory();
    refresh();
}
