import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  pluginId?: string;
}

export const SettingsPanel = ({ pluginId }: SettingsPanelProps) => {
  const [settings, setSettings] = useState({
    defaultSavePath: '',
    saveFormat: 'png',
    showCursor: true,
    defaultSaveAction: 'copy',
    defaultFileName: '{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}'
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('screenshot-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('screenshot-settings', JSON.stringify(settings));
  };

  const formats = ['png', 'jpg', 'webp'];
  const saveActions = ['copy', 'save', 'both'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">截图工具设置</h2>
        <p className="text-sm text-gray-500">配置截图工具的默认行为和保存选项</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">默认保存路径</label>
          <input
            type="text"
            value={settings.defaultSavePath}
            onChange={(e) => setSettings({ ...settings, defaultSavePath: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="留空则使用默认下载目录"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">默认保存格式</label>
          <select
            value={settings.saveFormat}
            onChange={(e) => setSettings({ ...settings, saveFormat: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {formats.map(format => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">默认保存操作</label>
          <select
            value={settings.defaultSaveAction}
            onChange={(e) => setSettings({ ...settings, defaultSaveAction: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="copy">仅复制到剪贴板</option>
            <option value="save">仅保存到文件</option>
            <option value="both">复制并保存</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">文件名格式</label>
          <input
            type="text"
            value={settings.defaultFileName}
            onChange={(e) => setSettings({ ...settings, defaultFileName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}"
          />
          <p className="mt-1 text-xs text-gray-500">支持变量: {YYYY}, {MM}, {DD}, {HH}, {mm}, {ss}</p>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">截图时显示鼠标光标</label>
          <button
            onClick={() => setSettings({ ...settings, showCursor: !settings.showCursor })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.showCursor ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.showCursor ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          保存设置
        </button>
      </div>
    </div>
  );
};
