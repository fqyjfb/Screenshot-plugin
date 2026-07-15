import { setScreenshotState } from './useScreenshotStore';
import { ScreenshotOverlay } from './ScreenshotOverlay';
import { SettingsPanel } from './SettingsPanel';
import { Toolbar } from './Toolbar';

const { React, api } = window as any;

const ToolPanel = () => {
  return React.createElement('div', { className: 'h-full flex flex-col' },
    React.createElement('div', { className: 'p-4 border-b bg-gray-50' },
      React.createElement('h2', { className: 'text-lg font-semibold text-gray-800' }, '截图工具'),
      React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, '点击下方按钮开始截图')
    ),
    React.createElement('div', { className: 'flex-1 flex items-center justify-center' },
      React.createElement('button', {
        onClick: async () => {
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
            }
          } catch (error) {
            console.error("Screenshot capture failed:", error);
          }
        },
        className: 'px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
      },
      React.createElement('span', null, '开始截图')
      )
    )
  );
};

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
      component: ToolPanel,
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
