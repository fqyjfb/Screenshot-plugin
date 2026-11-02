import React from 'react';
import ReactDOM from 'react-dom/client';

const ToolPanel = () => {
  return React.createElement('div', { className: 'h-full flex flex-col bg-white' },
    React.createElement('div', { className: 'p-4 border-b border-gray-200 bg-gray-50' },
      React.createElement('h2', { className: 'text-lg font-semibold text-gray-800' }, '截图工具'),
      React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, '点击下方按钮开始截图')
    ),
    React.createElement('div', { className: 'flex-1 flex items-center justify-center bg-white' },
      React.createElement('button', {
        onClick: async () => {
          try {
            const electron = (window as any).electron;
            await electron?.screenshot?.startCapture?.();
          } catch (error) {
            console.error('Screenshot capture failed:', error);
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
  return React.createElement(ToolPanel);
};

function renderStandalone() {
  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found');
    return;
  }

  ReactDOM.createRoot(root).render(React.createElement(PluginApp));
}

const pluginData = (window as any).__PLUGIN_DATA__;
if (pluginData) {
  renderStandalone();
}
