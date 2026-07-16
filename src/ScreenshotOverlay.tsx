import { useEffect, useRef, useCallback } from 'react';
import { useScreenshotStore, setScreenshotState, addText, updateText } from './useScreenshotStore';
import { Toolbar } from './Toolbar';
import { AnnotationLayer } from './AnnotationLayer';

export const ScreenshotOverlay = () => {
    const { captures, selectionBox, activeTool, texts, activeTextId } = useScreenshotStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !captures || captures.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const totalWidth = captures.reduce((max, c) => Math.max(max, c.x + c.width), 0);
        const totalHeight = captures.reduce((max, c) => Math.max(max, c.y + c.height), 0);

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        captures.forEach(capture => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, capture.x, capture.y);
            };
            img.src = capture.dataUrl;
        });
    }, [captures]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'text') {
            const newText = {
                id: `text-${Date.now()}`,
                x,
                y,
                content: '',
                color: '#ffffff',
                fontSize: 14,
                isEditing: true
            };
            addText(newText);
        } else if (activeTool === 'select') {
            setScreenshotState({
                selectionBox: { x, y, width: 0, height: 0, isDrawing: true, startX: x, startY: y }
            });
        }
    }, [activeTool]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (selectionBox?.isDrawing) {
            const newWidth = x - selectionBox.startX;
            const newHeight = y - selectionBox.startY;
            setScreenshotState({
                selectionBox: {
                    ...selectionBox,
                    x: newWidth < 0 ? x : selectionBox.startX,
                    y: newHeight < 0 ? y : selectionBox.startY,
                    width: Math.abs(newWidth),
                    height: Math.abs(newHeight),
                    isDrawing: true
                }
            });
        }
    }, [selectionBox]);

    const handleMouseUp = useCallback(() => {
        if (selectionBox?.isDrawing) {
            setScreenshotState({
                selectionBox: {
                    ...selectionBox,
                    isDrawing: false
                }
            });
        }
    }, [selectionBox]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            const electron = (window as any).electron;
            electron?.screenshot?.cancel?.();
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const handleScreenshotAction = async (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const canvas = canvasRef.current;
            if (!canvas) return;

            let dataUrl: string;

            if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = selectionBox.width;
                tempCanvas.height = selectionBox.height;
                const ctx = tempCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(canvas, selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height, 0, 0, selectionBox.width, selectionBox.height);
                    dataUrl = tempCanvas.toDataURL('image/png');
                } else {
                    dataUrl = canvas.toDataURL('image/png');
                }
            } else {
                dataUrl = canvas.toDataURL('image/png');
            }

            const electron = (window as any).electron;

            if (detail === 'copy') {
                electron?.screenshot?.copyToClipboard?.(dataUrl);
            } else if (detail === 'save') {
                await electron?.screenshot?.save?.({ buffer: dataUrl, format: 'png' });
            }

            electron?.screenshot?.complete?.();
        };

        document.addEventListener('screenshot-action', handleScreenshotAction);
        return () => document.removeEventListener('screenshot-action', handleScreenshotAction);
    }, [selectionBox]);

    const handleTextInput = useCallback((id: string, content: string) => {
        updateText(id, { content });
    }, []);

    const handleTextBlur = useCallback((id: string) => {
        updateText(id, { isEditing: false });
    }, []);

    return (
        <div className="w-full h-full overflow-hidden" ref={containerRef}>
            <div className="absolute inset-0 bg-black/40" />
            
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        className="block cursor-crosshair"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                    
                    {selectionBox && (
                        <div
                            className="absolute border-2 border-blue-500 rounded-sm pointer-events-none"
                            style={{
                                left: selectionBox.x,
                                top: selectionBox.y,
                                width: selectionBox.width,
                                height: selectionBox.height
                            }}
                        />
                    )}

                    <AnnotationLayer 
                        texts={texts}
                        onTextInput={handleTextInput}
                        onTextBlur={handleTextBlur}
                    />

                    <Toolbar />
                </div>
            </div>
        </div>
    );
};