import { useScreenshotStore, setScreenshotState, updateColor, updateSizeLevel } from './useScreenshotStore';

const { React, api, useAppStore } = window as any;

export const Toolbar = () => {
    const { selectionBox, activeTool, color, sizeLevel } = useScreenshotStore();
    
    if (!selectionBox) return null;

    let top = selectionBox.y + selectionBox.height + 16;
    let left = selectionBox.x + selectionBox.width / 2 - 190;

    if (top + 100 > window.innerHeight) {
        top = selectionBox.y - 100;
        if (top < 16) {
            top = window.innerHeight - 110;
        }
    }

    if (left < 16) left = 16;
    if (left + 390 > window.innerWidth) left = window.innerWidth - 390;
    
    const tools = [
        { id: 'select', icon: 'mouse-pointer' },
        { id: 'pen', icon: 'pencil' },
        { id: 'rect', icon: 'square' },
        { id: 'arrow', icon: 'arrow-right' },
        { id: 'text', icon: 'type' }
    ];

    const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ffffff'];

    const handleCancel = () => {
        setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
    };

    const handleExit = () => {
        api.cancelScreenshot?.();
        useAppStore?.getState?.()?.setState?.({ activeExtensionPanelId: null });
    };

    const renderIcon = (iconName: string) => {
        const iconPaths: Record<string, string> = {
            'mouse-pointer': 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
            'pencil': 'M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7.5 19l-4 1 1-4L16.5 3.5z',
            'square': 'M3 3h18v18H3z',
            'arrow-right': 'M5 12h14M12 5l7 7-7 7',
            'type': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6M8 13h2M8 17h2M12 13h4M12 17h4'
        };

        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPaths[iconName] || iconPaths['mouse-pointer']} />
            </svg>
        );
    };

    const closeIcon = () => (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );

    const copyIcon = () => (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
    );

    const saveIcon = () => (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    );

    return (
        <div 
            className="absolute z-50 flex flex-col gap-2 p-2 rounded-lg bg-gray-900/95 shadow-lg border border-gray-700/50 cursor-default"
            style={{ top, left }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div className="flex items-center gap-1 border-b border-gray-700/50 pb-2">
                {tools.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setScreenshotState({ activeTool: t.id as any })}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${activeTool === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 active:scale-95'}`}
                    >
                        {renderIcon(t.icon)}
                    </button>
                ))}
                
                <div className="w-[1px] h-6 bg-gray-700/50 mx-1" />

                <div className="flex items-center gap-1 px-1">
                    {[1, 2, 3].map((size) => (
                        <button
                            key={size}
                            onClick={() => updateSizeLevel(size as 1|2|3)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-gray-700/50 active:scale-95 ${sizeLevel === size ? 'bg-gray-700/50' : ''}`}
                        >
                            <div className={`rounded-full transition-all ${sizeLevel === size ? 'bg-white' : 'bg-gray-400'}`} style={{ width: size * 3 + 2, height: size * 3 + 2 }} />
                        </button>
                    ))}
                </div>

                <div className="w-[1px] h-6 bg-gray-700/50 mx-1" />

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
                    className="text-xs text-gray-400 hover:text-white transition-all px-2 py-1 rounded-md hover:bg-gray-700/50 active:scale-95"
                >
                    重选
                </button>
                <button 
                    onClick={handleExit}
                    className="text-xs text-gray-400 hover:text-red-400 transition-all px-2 py-1 rounded-md hover:bg-red-400/10 active:scale-95 flex items-center gap-1"
                >
                    {closeIcon()}
                    退出
                </button>
                <button
                    onClick={() => document.dispatchEvent(new CustomEvent('screenshot-action', { detail: 'copy' }))}
                    className="text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-medium ml-2"
                >
                    {copyIcon()}
                    复制
                </button>
                <button
                    onClick={() => document.dispatchEvent(new CustomEvent('screenshot-action', { detail: 'save' }))}
                    className="text-xs text-white bg-gray-700 hover:bg-gray-600 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-medium ml-1"
                >
                    {saveIcon()}
                    保存
                </button>
            </div>
        </div>
    );
};
