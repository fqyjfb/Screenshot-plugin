import { setScreenshotState } from './useScreenshotStore';
import { ScreenshotOverlay } from './ScreenshotOverlay';
import { SettingsPanel } from './SettingsPanel';

const { React, api } = window as any;

module.exports = {
  register: function(toolboxApi: any) {
    const { registerTool, registerSidebarButton, registerPanel } = toolboxApi;

    registerTool({
      id: 'plugin-screenshot',
      name: '截图工具',
      iconName: 'Camera',
      color: '#3b82f6',
      textColor: '#ffffff',
      path: '/tools/plugin-screenshot',
      component: require('./src/components/ToolPanel').default,
    });

    registerSidebarButton({
      id: 'plugin-screenshot-btn',
      icon: 'Camera',
      label: '截图工具',
      onClick: async (e: any, anchorRect: any) => {
        try {
          const data = await api.startScreenshotCapture?.();
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

            registerPanel('plugin-screenshot-overlay', {
              id: 'plugin-screenshot-overlay',
              render: () => React.createElement(ScreenshotOverlay)
            });
          } else if (data?.error) {
            console.warn("Screenshot capture error or denied:", data.error);
          }
        } catch (error) {
          console.error("Screenshot capture failed:", error);
        }
      }
    });

    if (api.registerSettingsPanel) {
      api.registerSettingsPanel('plugin-screenshot', {
        id: 'plugin-screenshot',
        render: () => React.createElement(SettingsPanel)
      });
    }
  }
};
