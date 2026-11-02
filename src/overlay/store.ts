export interface CaptureData {
    dataUrl: string;
    width: number;
    height: number;
    id: string;
    scaleFactor?: number;
}

export interface ScreenshotData {
    capture: CaptureData;
    mode: 'translate' | 'capture';
}

export type EventType = 'selection-change' | 'translate-ready' | 'action-copy' | 'action-save' | 'action-cancel' | 'action-complete';

class EventEmitter {
    private map = new Map<EventType, Array<(data: any) => void>>();

    on(type: EventType, fn: (data: any) => void) {
        const list = this.map.get(type) || [];
        list.push(fn);
        this.map.set(type, list);
        return () => this.off(type, fn);
    }

    off(type: EventType, fn: (data: any) => void) {
        const list = this.map.get(type);
        if (list) {
            this.map.set(type, list.filter((f) => f !== fn));
        }
    }

    emit(type: EventType, data?: any) {
        this.map.get(type)?.forEach((fn) => fn(data));
    }
}

export const emitter = new EventEmitter();
