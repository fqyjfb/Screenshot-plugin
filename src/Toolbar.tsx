import { useScreenshotStore, setScreenshotState, updateColor, updateSizeLevel } from './useScreenshotStore';

const { React, api, useAppStore } = window as any;

export const Toolbar = () => {
    const { selectionBox, activeTool, color, sizeLevel } = useScreenshotStore();
    
    if (!selectionBox) return null;

    let top = selectionBox.y + selectionBox.height + 16;
    let left = selectionBox.x + selectionBox.width / 2 - 190;

    // If it goes off the bottom of the screen
    if (top + 100 > window.innerHeight) {
        // Try putting it above the selection box
        top = selectionBox.y - 100;
        
        // If putting it above the selection box goes off the top of the screen (e.g. full screen)
        // Then place it inside the selection box at the bottom of the screen
        if (top < 16) {
            top = window.innerHeight - 110;
        }
    }

    // Keep it horizontally within the screen
    if (left < 16) left = 16;
    if (left + 390 > window.innerWidth) left = window.innerWidth - 390;
    
    const tools = [
        { id: 'select', icon: 'near_me' },
        { id: 'pen', icon: 'draw' },
        { id: 'rect', icon: 'rectangle' },
        { id: 'arrow', icon: 'arrow_right_alt' },
        { id: 'text', icon: 'title' }
    ];

    const colors = ['#f4a125', '#ef4444', '#3b82f6', '#22c55e', '#ffffff'];

    const handleCancel = () => {
        setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
    };

    const handleExit = () => {
        api.cancelScreenshot();
        useAppStore.setState({ activeExtensionPanelId: null });
    };

    return (
        <div 
            className="absolute z-50 flex flex-col gap-2 p-2 rounded-xl bg-slate-900/90 shadow-2xl border border-slate-700/50 backdrop-blur-xl no-drag-region cursor-default"
            style={{ top, left }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div className="flex items-center gap-1 border-b border-slate-700/50 pb-2">
                {tools.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setScreenshotState({ activeTool: t.id as any })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTool === t.id ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/10 active:scale-95'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                    </button>
                ))}
                
                <div className="w-[1px] h-6 bg-slate-700/50 mx-1" />

                <div className="flex items-center gap-1 px-1">
                    {[1, 2, 3].map((size) => (
                        <button
                            key={size}
                            onClick={() => updateSizeLevel(size as 1|2|3)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-white/10 active:scale-95 ${sizeLevel === size ? 'bg-white/20' : ''}`}
                        >
                            <div className={`rounded-full transition-all ${sizeLevel === size ? 'bg-white' : 'bg-slate-400'}`} style={{ width: size * 3 + 2, height: size * 3 + 2 }} />
                        </button>
                    ))}
                </div>

                <div className="w-[1px] h-6 bg-slate-700/50 mx-1" />

                {colors.map(c => (
                    <button
                        key={c}
                        onClick={() => updateColor(c)}
                        className={`w-6 h-6 rounded-full transition-all border-2 ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between pt-1 px-1">
                <button 
                    onClick={handleCancel}
                    className="text-xs text-slate-400 hover:text-white transition-all px-2 py-1 rounded-md hover:bg-white/10 active:scale-95"
                >
                    Retake
                </button>
                <button 
                    onClick={handleExit}
                    className="text-xs text-slate-400 hover:text-red-400 transition-all px-2 py-1 rounded-md hover:bg-red-400/10 active:scale-95 flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    Exit
                </button>
                <button
                    onClick={() => document.dispatchEvent(new CustomEvent('screenshot-action', { detail: 'copy' }))}
                    className="text-xs text-white bg-primary hover:bg-primary/80 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-bold ml-2"
                >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy
                </button>
                <button
                    onClick={() => document.dispatchEvent(new CustomEvent('screenshot-action', { detail: 'save' }))}
                    className="text-xs text-white bg-slate-700 hover:bg-slate-600 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-bold ml-1"
                >
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    Save
                </button>
            </div>
        </div>
    );
};
