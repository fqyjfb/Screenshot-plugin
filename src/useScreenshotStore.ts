export interface CaptureData {
    displayId: string;
    bounds: { x: number; y: number; width: number; height: number };
    scaleFactor: number;
    imageDataUrl: string;
}

export interface SelectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TextAnnotation {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    sizeLevel: 1 | 2 | 3;
}

export interface ScreenshotState {
    isCapturing: boolean;
    captures: CaptureData[];
    windowPosition: { x: number; y: number };
    selectionBox: SelectionBox | null;
    activeTool: 'select' | 'pen' | 'rect' | 'arrow' | 'text';
    color: string;
    sizeLevel: 1 | 2 | 3;
    texts: TextAnnotation[];
    activeTextId: string | null;
}

const { React } = window as any;

let listeners: any[] = [];
let state: ScreenshotState = {
    isCapturing: false,
    captures: [],
    windowPosition: { x: 0, y: 0 },
    selectionBox: null,
    activeTool: 'select',
    color: '#f4a125', // KoBar primary theme fallback
    sizeLevel: 2,
    texts: [],
    activeTextId: null
};

export const getScreenshotState = () => state;

export const setScreenshotState = (newState: Partial<ScreenshotState>) => {
    state = { ...state, ...newState };
    listeners.forEach(l => l(state));
};

export const updateColor = (newColor: string) => {
    const updates: Partial<ScreenshotState> = { color: newColor };
    if (state.activeTextId) {
        updates.texts = state.texts.map(t => t.id === state.activeTextId ? { ...t, color: newColor } : t);
    }
    setScreenshotState(updates);
};

export const updateSizeLevel = (newSize: 1 | 2 | 3) => {
    const updates: Partial<ScreenshotState> = { sizeLevel: newSize };
    if (state.activeTextId) {
        updates.texts = state.texts.map(t => t.id === state.activeTextId ? { ...t, sizeLevel: newSize } : t);
    }
    setScreenshotState(updates);
};

export const useScreenshotStore = () => {
    const [snap, setSnap] = React.useState(state);
    React.useEffect(() => {
        listeners.push(setSnap);
        return () => {
            listeners = listeners.filter(l => l !== setSnap);
        };
    }, []);
    return snap;
};
