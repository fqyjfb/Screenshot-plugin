import { setScreenshotState } from './useScreenshotStore';
import { ScreenshotOverlay } from './ScreenshotOverlay';
import { SettingsPanel } from './SettingsPanel';

const { React, KoBarExtensions, api, useAppStore } = window as any;

if (KoBarExtensions.registerSettingsPanel) {
    KoBarExtensions.registerSettingsPanel('screenshot-studio-overlay', {
        id: 'screenshot-studio-overlay',
        render: () => React.createElement(SettingsPanel)
    });
}

KoBarExtensions.registerSidebarButton({
    id: 'screenshot-studio-btn',
    icon: 'screenshot_region',
    label: 'Screenshot Studio',
    onClick: async (e: any, anchorRect: any) => {
        try {
            // Close other panels
            useAppStore.getState().closeAllUtilityPopups?.();

            const data = await api.startScreenshotCapture();
            if (data && data.captures && data.captures.length > 0) {
                setScreenshotState({
                    isCapturing: true,
                    captures: data.captures,
                    windowPosition: data.windowPosition,
                    selectionBox: null,
                    texts: [],
                    activeTextId: null,
                    activeTool: 'select'
                });
                
                // Open panel to render our overlay
                useAppStore.setState({ 
                    activeExtensionPanelId: 'screenshot-studio-overlay',
                    activeExtensionAnchorRect: anchorRect
                });
            } else if (data?.error) {
               console.warn("Screenshot capture error or denied:", data.error);
            }
        } catch (error) {
            console.error("Screenshot capture failed:", error);
        }
    }
});

KoBarExtensions.registerPanel('screenshot-studio-overlay', {
    id: 'screenshot-studio-overlay',
    render: () => {
        return React.createElement(ScreenshotOverlay);
    }
});
