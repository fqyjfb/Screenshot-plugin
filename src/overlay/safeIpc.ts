const electron = (window as any).electron;

export const safeIpc = {
    onData(cb: (data: any) => void): () => void {
        if (!electron?.screenshot?.onData) {
            throw new Error('[safeIpc] onData not available');
        }
        return electron.screenshot.onData(cb);
    },

    translate(dataUrl: string): Promise<any> {
        if (!electron?.screenshot?.translate) {
            throw new Error('[safeIpc] translate not available');
        }
        return electron.screenshot.translate(dataUrl);
    },

    copyToClipboard(dataUrl: string): void {
        if (!electron?.screenshot?.copyToClipboard) {
            throw new Error('[safeIpc] copyToClipboard not available');
        }
        electron.screenshot.copyToClipboard(dataUrl);
    },

    save(data: { buffer: string; format: string }): Promise<any> {
        if (!electron?.screenshot?.save) {
            throw new Error('[safeIpc] save not available');
        }
        return electron.screenshot.save(data);
    },

    cancel(): void {
        electron?.screenshot?.cancel?.();
    },

    complete(): void {
        electron?.screenshot?.complete?.();
    },
};
