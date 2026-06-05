import { useScreenshotStore, setScreenshotState } from './useScreenshotStore';
import { Toolbar } from './Toolbar';
import { AnnotationLayer } from './AnnotationLayer';

const { React, api } = window as any;

export const ScreenshotOverlay = () => {
    const { captures, windowPosition, selectionBox } = useScreenshotStore();
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState(null as { x: number; y: number } | null);
    const [dragCurrent, setDragCurrent] = React.useState(null as { x: number; y: number } | null);

    const canvasRef = React.useRef(null as HTMLCanvasElement | null);
    const dimLayerRef = React.useRef(null as HTMLCanvasElement | null);

    React.useEffect(() => {
        // Draw all captures onto the background canvas
        if (!canvasRef.current || captures.length === 0) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Ensure canvas is large enough
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;

        captures.forEach((capture: any) => {
            const img = new Image();
            img.onload = () => {
                // Calculate physical coordinates inside the ghost window
                const x = capture.bounds.x - windowPosition.x;
                const y = capture.bounds.y - windowPosition.y;
                ctx.drawImage(img, x, y, capture.bounds.width, capture.bounds.height);
            };
            img.src = capture.imageDataUrl;
        });
    }, [captures, windowPosition]);

    React.useEffect(() => {
        // Draw the dim layer and the cut-out hole
        if (!dimLayerRef.current) return;
        const ctx = dimLayerRef.current.getContext('2d');
        if (!ctx) return;

        dimLayerRef.current.width = window.innerWidth;
        dimLayerRef.current.height = window.innerHeight;

        ctx.clearRect(0, 0, dimLayerRef.current.width, dimLayerRef.current.height);

        // Fill with semi-transparent black
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, dimLayerRef.current.width, dimLayerRef.current.height);

        // Cut out the selection box
        const box = selectionBox || (dragStart && dragCurrent ? {
            x: Math.min(dragStart.x, dragCurrent.x),
            y: Math.min(dragStart.y, dragCurrent.y),
            width: Math.abs(dragCurrent.x - dragStart.x),
            height: Math.abs(dragCurrent.y - dragStart.y)
        } : null);

        if (box) {
            ctx.clearRect(box.x, box.y, box.width, box.height);
            // Draw a bright border
            ctx.strokeStyle = '#f4a125'; // KoBar primary color
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
    }, [selectionBox, dragStart, dragCurrent]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (selectionBox) return; // Already selected, wait for them to clear or draw
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setDragCurrent({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart) return;
        setDragCurrent({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        if (!isDragging || !dragStart || !dragCurrent) return;
        setIsDragging(false);
        const width = Math.abs(dragCurrent.x - dragStart.x);
        const height = Math.abs(dragCurrent.y - dragStart.y);
        
        if (width > 10 && height > 10) {
            setScreenshotState({
                selectionBox: {
                    x: Math.min(dragStart.x, dragCurrent.x),
                    y: Math.min(dragStart.y, dragCurrent.y),
                    width,
                    height
                }
            });
        }
        setDragStart(null);
        setDragCurrent(null);
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                api.cancelScreenshot();
                setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
                (window as any).useAppStore.setState({ activeExtensionPanelId: null });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[999999] pointer-events-auto cursor-crosshair no-drag-region"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ width: '100vw', height: '100vh', backgroundColor: 'transparent' }}
        >
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
            <canvas ref={dimLayerRef} className="absolute inset-0 pointer-events-none" />

            {selectionBox && (
                <AnnotationLayer backgroundCanvasRef={canvasRef} />
            )}

            {selectionBox && (
                <Toolbar />
            )}
        </div>
    );
};
