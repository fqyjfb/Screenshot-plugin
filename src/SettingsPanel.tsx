import { useState, useEffect } from 'react';

const { React } = window as any;

export const SettingsPanel = () => {
    const [savePath, setSavePath] = useState('');

    useEffect(() => {
        const storedPath = localStorage.getItem('kobar_screenshot_save_path') || '';
        setSavePath(storedPath);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSavePath(val);
        localStorage.setItem('kobar_screenshot_save_path', val);
    };

    return (
        <div className="flex flex-col gap-4 p-4 text-slate-300">
            <div>
                <h3 className="text-sm font-bold text-slate-200 mb-1">Default Save Location</h3>
                <p className="text-xs text-slate-400 mb-3">
                    Specify the default directory path where screenshots will be saved. 
                    Leave empty to use your Desktop.
                </p>
                <input
                    type="text"
                    value={savePath}
                    onChange={handleChange}
                    placeholder="e.g. C:\Users\Username\Pictures\Screenshots"
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary/50 transition-colors"
                />
            </div>
        </div>
    );
};
