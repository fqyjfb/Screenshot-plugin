import { useScreenshotStore, setScreenshotState, TextAnnotation, getScreenshotState } from './useScreenshotStore';

const { React, api, useAppStore } = window as any;

const fontSizes = { 1: 16, 2: 24, 3: 36 };
const lineW = { 1: 2, 2: 4, 3: 8 };

export const AnnotationLayer = ({ backgroundCanvasRef }: { backgroundCanvasRef: any }) => {
    const { selectionBox, activeTool, color, sizeLevel, texts, activeTextId } = useScreenshotStore();
    const canvasRef = React.useRef(null as HTMLCanvasElement | null);
    
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [paths, setPaths] = React.useState([] as any[]);
    const [currentPath, setCurrentPath] = React.useState(null as any);
    
    const [draggingTextId, setDraggingTextId] = React.useState(null as string | null);
    const [dragStartOffset, setDragStartOffset] = React.useState({x:0, y:0});

    React.useEffect(() => {
        const handleAction = async (e: any) => {
            const action = e.detail;
            if (action === 'copy' || action === 'save') {
                setScreenshotState({ activeTextId: null });
                setTimeout(() => compositeAndExport(action), 50);
            }
        };
        document.addEventListener('screenshot-action', handleAction);
        return () => document.removeEventListener('screenshot-action', handleAction);
    }, [selectionBox, paths, texts]);

    React.useEffect(() => {
        redraw();
    }, [paths, currentPath, selectionBox]);

    const redraw = () => {
        if (!canvasRef.current || !selectionBox) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, selectionBox.width, selectionBox.height);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const drawPath = (p: any) => {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = lineW[p.sizeLevel as 1|2|3] || 4;
            
            if (p.tool === 'pen') {
                if (p.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(p.points[0].x, p.points[0].y);
                for (let i = 1; i < p.points.length; i++) {
                    ctx.lineTo(p.points[i].x, p.points[i].y);
                }
                ctx.stroke();
            } else if (p.tool === 'rect') {
                ctx.strokeRect(p.start.x, p.start.y, p.end.x - p.start.x, p.end.y - p.start.y);
            } else if (p.tool === 'arrow') {
                const headlen = p.sizeLevel === 3 ? 20 : (p.sizeLevel === 2 ? 14 : 10);
                const dx = p.end.x - p.start.x;
                const dy = p.end.y - p.start.y;
                const angle = Math.atan2(dy, dx);
                ctx.beginPath();
                ctx.moveTo(p.start.x, p.start.y);
                ctx.lineTo(p.end.x, p.end.y);
                ctx.lineTo(p.end.x - headlen * Math.cos(angle - Math.PI / 6), p.end.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(p.end.x, p.end.y);
                ctx.lineTo(p.end.x - headlen * Math.cos(angle + Math.PI / 6), p.end.y - headlen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        };

        paths.forEach(drawPath);
        if (currentPath) drawPath(currentPath);
    };

    const getRelPos = (e: React.MouseEvent | MouseEvent) => {
        if (!selectionBox) return { x: 0, y: 0 };
        return { x: e.clientX - selectionBox.x, y: e.clientY - selectionBox.y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (activeTextId) {
            setScreenshotState({ activeTextId: null });
        }

        if (activeTool === 'select') return;
        
        const pos = getRelPos(e);

        if (activeTool === 'text') {
            const newText: TextAnnotation = {
                id: 'txt_' + Date.now(),
                text: '',
                x: pos.x,
                y: pos.y,
                color,
                sizeLevel
            };
            setScreenshotState({ texts: [...texts, newText], activeTextId: newText.id });
            return;
        }
        
        setIsDrawing(true);
        if (activeTool === 'pen') {
            setCurrentPath({ tool: 'pen', color, sizeLevel, points: [pos] });
        } else {
            setCurrentPath({ tool: activeTool, color, sizeLevel, start: pos, end: pos });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (draggingTextId) {
            const pos = getRelPos(e);
            setScreenshotState({
                texts: texts.map((t: TextAnnotation) => 
                    t.id === draggingTextId 
                        ? { ...t, x: pos.x - dragStartOffset.x, y: pos.y - dragStartOffset.y } 
                        : t
                )
            });
            return;
        }

        if (!isDrawing || !currentPath) return;
        const pos = getRelPos(e);
        
        if (activeTool === 'pen') {
            setCurrentPath({ ...currentPath, points: [...currentPath.points, pos] });
        } else {
            setCurrentPath({ ...currentPath, end: pos });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (draggingTextId) {
            setDraggingTextId(null);
            return;
        }

        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPath) {
            setPaths([...paths, currentPath]);
            setCurrentPath(null);
        }
    };

    const compositeAndExport = async (action: 'copy' | 'save') => {
        if (!selectionBox || !backgroundCanvasRef.current || !canvasRef.current) return;
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = selectionBox.width;
        exportCanvas.height = selectionBox.height;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            backgroundCanvasRef.current, 
            selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height,
            0, 0, selectionBox.width, selectionBox.height
        );

        ctx.drawImage(canvasRef.current, 0, 0);

        const currentTexts = getScreenshotState().texts;
        currentTexts.forEach((t: TextAnnotation) => {
            if (!t.text.trim()) return;
            const fSize = fontSizes[t.sizeLevel as 1|2|3];
            ctx.font = `${fSize}px "Space Grotesk", sans-serif`;
            ctx.fillStyle = t.color;
            ctx.textBaseline = 'top';
            const lines = t.text.split('\n');
            lines.forEach((line: string, i: number) => {
                ctx.fillText(line, t.x + 4, t.y + 4 + (i * fSize * 1.2));
            });
        });

        const dataUrl = exportCanvas.toDataURL('image/png');

        if (action === 'copy') {
            api.copyScreenshotToClipboard(dataUrl);
            api.sendNotification('Screenshot Copied', 'Saved to clipboard.');
        } else {
            const res = await api.saveScreenshot({ buffer: dataUrl, format: 'png' });
            if (res.success) {
                api.sendNotification('Screenshot Saved', `Saved to ${res.path}`);
            }
        }

        api.cancelScreenshot();
        useAppStore.setState({ activeExtensionPanelId: null });
    };

    if (!selectionBox) return null;

    return (
        <div
            className={`absolute z-40 no-drag-region ${activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'} ${activeTool === 'text' ? 'cursor-text' : (activeTool === 'select' ? '' : 'cursor-crosshair')}`}
            style={{ 
                left: selectionBox.x, 
                top: selectionBox.y, 
                width: selectionBox.width, 
                height: selectionBox.height
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                width={selectionBox.width}
                height={selectionBox.height}
            />
            
            {texts.map((t: TextAnnotation) => {
                const isActive = activeTextId === t.id;
                const fSize = fontSizes[t.sizeLevel as 1|2|3];
                return (
                    <div
                        key={t.id}
                        className={`absolute rounded-md ${isActive ? 'border-2 border-dashed border-white/50 bg-black/20' : 'border-2 border-transparent'} ${(!t.text.trim() && !isActive) ? 'pointer-events-none' : ''}`}
                        style={{
                            left: t.x,
                            top: t.y,
                            color: t.color,
                            fontSize: `${fSize}px`,
                            fontFamily: '"Space Grotesk", sans-serif',
                            padding: '4px',
                            minWidth: '20px',
                            minHeight: `${fSize * 1.2}px`,
                            lineHeight: 1.2,
                            cursor: draggingTextId === t.id ? 'grabbing' : (activeTool === 'select' || activeTool === 'text' ? 'grab' : 'default')
                        }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            if (activeTool !== 'text' && activeTool !== 'select') return;
                            setScreenshotState({ activeTextId: t.id, activeTool: 'text' });
                            
                            const pos = getRelPos(e);
                            setDragStartOffset({ x: pos.x - t.x, y: pos.y - t.y });
                            setDraggingTextId(t.id);
                        }}
                    >
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            className="select-text"
                            onMouseDown={(e) => {
                                if (isActive) e.stopPropagation();
                            }}
                            onInput={(e: any) => {
                                const newText = e.target.innerText;
                                setScreenshotState({
                                    texts: getScreenshotState().texts.map((tx: TextAnnotation) => tx.id === t.id ? { ...tx, text: newText } : tx)
                                });
                            }}
                            ref={(el) => {
                                if (el) {
                                    if (document.activeElement !== el && el.innerText !== t.text) {
                                        el.innerText = t.text;
                                    }
                                    if (isActive && document.activeElement !== el) {
                                        setTimeout(() => el.focus(), 50);
                                    }
                                }
                            }}
                            style={{ outline: 'none', whiteSpace: 'pre', cursor: 'text', WebkitUserSelect: 'text', userSelect: 'text', minWidth: '10px', minHeight: `${fSize * 1.2}px` }}
                        />
                    </div>
                );
            })}
        </div>
    );
};
