import { setScreenshotState } from './useScreenshotStore';
import { ScreenshotOverlay } from './ScreenshotOverlay';
import { SettingsPanel } from './SettingsPanel';
import { Toolbar } from './Toolbar';

const { React, ReactDOM, api } = window as any;

const PluginHeader: React.FC<{ title: string }> = ({ title }) => {
  const handleMinimize = () => {
    (window as any).electron?.plugin?.minimizeWindow();
  };

  const handleMaximize = () => {
    (window as any).electron?.plugin?.maximizeWindow();
  };

  const handleClose = () => {
    (window as any).electron?.plugin?.closeWindow();
  };

  return React.createElement('div', { className: 'plugin-header' },
    React.createElement('div', { className: 'plugin-header-title' }, title),
    React.createElement('div', { className: 'plugin-header-controls' },
      React.createElement('button', { onClick: handleMinimize },
        React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
          React.createElement('path', { d: 'M5 12h14' })
        )
      ),
      React.createElement('button', { onClick: handleMaximize },
        React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
          React.createElement('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' })
        )
      ),
      React.createElement('button', { onClick: handleClose },
        React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
          React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
        )
      )
    )
  );
};

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

const PluginApp: React.FC = () => {
  const pluginData = (window as any).__PLUGIN_DATA__;
  const title = pluginData?.pluginName || '截图工具';

  return React.createElement(React.Fragment, null,
    React.createElement(PluginHeader, { title }),
    React.createElement('div', { className: 'plugin-content' },
      React.createElement(ToolPanel)
    )
  );
};

function renderStandalone() {
  if (!React || !ReactDOM) {
    console.error('React or ReactDOM is not available');
    return;
  }

  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found');
    return;
  }

  if (ReactDOM.createRoot) {
    ReactDOM.createRoot(root).render(React.createElement(PluginApp));
  } else {
    ReactDOM.render(React.createElement(PluginApp), root);
  }
}

function registerPlugin(toolboxApi: any) {
  const { registerTool, registerSidebarButton, registerPanel, openPluginWindow } = toolboxApi;

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
    onClick: () => {
      openPluginWindow?.('plugin-screenshot');
    }
  });

  if (api.registerSettingsPanel) {
    api.registerSettingsPanel('plugin-screenshot', {
      id: 'plugin-screenshot',
      render: () => React.createElement(SettingsPanel)
    });
  }
}

const pluginData = (window as any).__PLUGIN_DATA__;

if (pluginData) {
  renderStandalone();
}

module.exports = {
  register: registerPlugin,
};