(function(react) {
  "use strict";
  const { React: React$1 } = window;
  let listeners = [];
  let state = {
    isCapturing: false,
    captures: [],
    windowPosition: { x: 0, y: 0 },
    selectionBox: null,
    activeTool: "select",
    color: "#3b82f6",
    sizeLevel: 2,
    texts: [],
    activeTextId: null
  };
  const setScreenshotState = (newState) => {
    state = { ...state, ...newState };
    listeners.forEach((l) => l(state));
  };
  const updateColor = (newColor) => {
    const updates = { color: newColor };
    if (state.activeTextId) {
      updates.texts = state.texts.map(
        (t) => t.id === state.activeTextId ? { ...t, color: newColor } : t
      );
    }
    setScreenshotState(updates);
  };
  const updateSizeLevel = (newSize) => {
    const updates = { sizeLevel: newSize };
    if (state.activeTextId) {
      updates.texts = state.texts.map(
        (t) => t.id === state.activeTextId ? { ...t, fontSize: newSize * 5 + 9 } : t
      );
    }
    setScreenshotState(updates);
  };
  const addText = (text) => {
    setScreenshotState({
      texts: [...state.texts, text],
      activeTextId: text.id
    });
  };
  const updateText = (id, updates) => {
    setScreenshotState({
      texts: state.texts.map(
        (t) => t.id === id ? { ...t, ...updates } : t
      ),
      activeTextId: updates.isEditing === false ? null : state.activeTextId
    });
  };
  const useScreenshotStore = () => {
    const [snap, setSnap] = React$1.useState(state);
    React$1.useEffect(() => {
      listeners.push(setSnap);
      return () => {
        listeners = listeners.filter((l) => l !== setSnap);
      };
    }, []);
    return snap;
  };
  const { api: api$1, useAppStore } = window;
  const Toolbar = () => {
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
      { id: "select", icon: "mouse-pointer" },
      { id: "pen", icon: "pencil" },
      { id: "rect", icon: "square" },
      { id: "arrow", icon: "arrow-right" },
      { id: "text", icon: "type" }
    ];
    const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#ffffff"];
    const handleCancel = () => {
      setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
    };
    const handleExit = () => {
      var _a, _b, _c, _d;
      (_a = api$1.cancelScreenshot) == null ? void 0 : _a.call(api$1);
      (_d = (_c = (_b = useAppStore == null ? void 0 : useAppStore.getState) == null ? void 0 : _b.call(useAppStore)) == null ? void 0 : _c.setState) == null ? void 0 : _d.call(_c, { activeExtensionPanelId: null });
    };
    const renderIcon = (iconName) => {
      const iconPaths = {
        "mouse-pointer": "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
        "pencil": "M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7.5 19l-4 1 1-4L16.5 3.5z",
        "square": "M3 3h18v18H3z",
        "arrow-right": "M5 12h14M12 5l7 7-7 7",
        "type": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6M8 13h2M8 17h2M12 13h4M12 17h4"
      };
      return /* @__PURE__ */ window.React.createElement("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ window.React.createElement("path", { d: iconPaths[iconName] || iconPaths["mouse-pointer"] }));
    };
    const closeIcon = () => /* @__PURE__ */ window.React.createElement("svg", { className: "w-3.5 h-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ window.React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ window.React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }));
    const copyIcon = () => /* @__PURE__ */ window.React.createElement("svg", { className: "w-3.5 h-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ window.React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), /* @__PURE__ */ window.React.createElement("path", { d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" }));
    const saveIcon = () => /* @__PURE__ */ window.React.createElement("svg", { className: "w-3.5 h-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ window.React.createElement("path", { d: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" }), /* @__PURE__ */ window.React.createElement("polyline", { points: "17 21 17 13 7 13 7 21" }), /* @__PURE__ */ window.React.createElement("polyline", { points: "7 3 7 8 15 8" }));
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        className: "absolute z-50 flex flex-col gap-2 p-2 rounded-lg bg-gray-900/95 shadow-lg border border-gray-700/50 cursor-default",
        style: { top, left },
        onMouseDown: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-1 border-b border-gray-700/50 pb-2" }, tools.map((t) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: t.id,
          onClick: () => setScreenshotState({ activeTool: t.id }),
          className: `w-8 h-8 rounded-md flex items-center justify-center transition-all ${activeTool === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700/50 active:scale-95"}`
        },
        renderIcon(t.icon)
      )), /* @__PURE__ */ window.React.createElement("div", { className: "w-[1px] h-6 bg-gray-700/50 mx-1" }), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-1 px-1" }, [1, 2, 3].map((size) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: size,
          onClick: () => updateSizeLevel(size),
          className: `w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-gray-700/50 active:scale-95 ${sizeLevel === size ? "bg-gray-700/50" : ""}`
        },
        /* @__PURE__ */ window.React.createElement("div", { className: `rounded-full transition-all ${sizeLevel === size ? "bg-white" : "bg-gray-400"}`, style: { width: size * 3 + 2, height: size * 3 + 2 } })
      ))), /* @__PURE__ */ window.React.createElement("div", { className: "w-[1px] h-6 bg-gray-700/50 mx-1" }), colors.map((c) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: c,
          onClick: () => updateColor(c),
          className: `w-6 h-6 rounded-full transition-all border-2 ${color === c ? "border-white scale-110" : "border-transparent hover:scale-110"}`,
          style: { backgroundColor: c }
        }
      ))),
      /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center justify-between pt-1 px-1" }, /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: handleCancel,
          className: "text-xs text-gray-400 hover:text-white transition-all px-2 py-1 rounded-md hover:bg-gray-700/50 active:scale-95"
        },
        "重选"
      ), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: handleExit,
          className: "text-xs text-gray-400 hover:text-red-400 transition-all px-2 py-1 rounded-md hover:bg-red-400/10 active:scale-95 flex items-center gap-1"
        },
        closeIcon(),
        "退出"
      ), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: () => document.dispatchEvent(new CustomEvent("screenshot-action", { detail: "copy" })),
          className: "text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-medium ml-2"
        },
        copyIcon(),
        "复制"
      ), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: () => document.dispatchEvent(new CustomEvent("screenshot-action", { detail: "save" })),
          className: "text-xs text-white bg-gray-700 hover:bg-gray-600 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-medium ml-1"
        },
        saveIcon(),
        "保存"
      ))
    );
  };
  const AnnotationLayer = ({ texts, onTextInput, onTextBlur }) => {
    if (!texts || texts.length === 0) return null;
    return /* @__PURE__ */ window.React.createElement("div", { className: "absolute inset-0 pointer-events-none" }, texts.map((text) => /* @__PURE__ */ window.React.createElement(
      "div",
      {
        key: text.id,
        className: "absolute",
        style: {
          left: text.x,
          top: text.y,
          color: text.color,
          fontSize: text.fontSize,
          fontFamily: "sans-serif",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          pointerEvents: text.isEditing ? "auto" : "none",
          whiteSpace: "pre-wrap"
        }
      },
      text.isEditing ? /* @__PURE__ */ window.React.createElement(
        "input",
        {
          type: "text",
          value: text.content,
          onChange: (e) => onTextInput(text.id, e.target.value),
          onBlur: () => onTextBlur(text.id),
          className: "bg-transparent border-none outline-none p-0 min-w-[60px] text-white font-medium",
          autoFocus: true,
          placeholder: "输入文字..."
        }
      ) : /* @__PURE__ */ window.React.createElement("span", { className: "font-medium" }, text.content)
    )));
  };
  const ScreenshotOverlay = () => {
    const { captures, selectionBox, activeTool, texts, activeTextId } = useScreenshotStore();
    const canvasRef = react.useRef(null);
    const containerRef = react.useRef(null);
    react.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !captures || captures.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const totalWidth = captures.reduce((max, c) => Math.max(max, c.x + c.width), 0);
      const totalHeight = captures.reduce((max, c) => Math.max(max, c.y + c.height), 0);
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      captures.forEach((capture) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, capture.x, capture.y);
        };
        img.src = capture.dataUrl;
      });
    }, [captures]);
    const handleMouseDown = react.useCallback((e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (activeTool === "text") {
        const newText = {
          id: `text-${Date.now()}`,
          x,
          y,
          content: "",
          color: "#ffffff",
          fontSize: 14,
          isEditing: true
        };
        addText(newText);
      } else if (activeTool === "select") {
        setScreenshotState({
          selectionBox: { x, y, width: 0, height: 0, isDrawing: true, startX: x, startY: y }
        });
      }
    }, [activeTool]);
    const handleMouseMove = react.useCallback((e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (selectionBox == null ? void 0 : selectionBox.isDrawing) {
        const newWidth = x - selectionBox.startX;
        const newHeight = y - selectionBox.startY;
        setScreenshotState({
          selectionBox: {
            ...selectionBox,
            x: newWidth < 0 ? x : selectionBox.startX,
            y: newHeight < 0 ? y : selectionBox.startY,
            width: Math.abs(newWidth),
            height: Math.abs(newHeight),
            isDrawing: true
          }
        });
      }
    }, [selectionBox]);
    const handleMouseUp = react.useCallback(() => {
      if (selectionBox == null ? void 0 : selectionBox.isDrawing) {
        setScreenshotState({
          selectionBox: {
            ...selectionBox,
            isDrawing: false
          }
        });
      }
    }, [selectionBox]);
    const handleKeyDown = react.useCallback((e) => {
      if (e.key === "Escape") {
        setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
      }
    }, []);
    react.useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
    const handleTextInput = react.useCallback((id, content) => {
      updateText(id, { content });
    }, []);
    const handleTextBlur = react.useCallback((id) => {
      updateText(id, { isEditing: false });
    }, []);
    return /* @__PURE__ */ window.React.createElement("div", { className: "fixed inset-0 z-50 overflow-hidden", ref: containerRef }, /* @__PURE__ */ window.React.createElement("div", { className: "absolute inset-0 bg-black/40" }), /* @__PURE__ */ window.React.createElement("div", { className: "absolute inset-0 flex items-center justify-center p-4" }, /* @__PURE__ */ window.React.createElement("div", { className: "relative" }, /* @__PURE__ */ window.React.createElement(
      "canvas",
      {
        ref: canvasRef,
        className: "block cursor-crosshair rounded-md",
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp
      }
    ), selectionBox && /* @__PURE__ */ window.React.createElement(
      "div",
      {
        className: "absolute border-2 border-blue-500 rounded-sm pointer-events-none",
        style: {
          left: selectionBox.x,
          top: selectionBox.y,
          width: selectionBox.width,
          height: selectionBox.height
        }
      }
    ), /* @__PURE__ */ window.React.createElement(
      AnnotationLayer,
      {
        texts,
        onTextInput: handleTextInput,
        onTextBlur: handleTextBlur
      }
    ), /* @__PURE__ */ window.React.createElement(Toolbar, null))));
  };
  const SettingsPanel = ({ pluginId }) => {
    const [settings, setSettings] = react.useState({
      defaultSavePath: "",
      saveFormat: "png",
      showCursor: true,
      defaultSaveAction: "copy",
      defaultFileName: "{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}"
    });
    react.useEffect(() => {
      const savedSettings = localStorage.getItem("screenshot-settings");
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch {
        }
      }
    }, []);
    const handleSave = () => {
      localStorage.setItem("screenshot-settings", JSON.stringify(settings));
    };
    const formats = ["png", "jpg", "webp"];
    return /* @__PURE__ */ window.React.createElement("div", { className: "p-6" }, /* @__PURE__ */ window.React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ window.React.createElement("h2", { className: "text-lg font-semibold text-gray-900 mb-1" }, "截图工具设置"), /* @__PURE__ */ window.React.createElement("p", { className: "text-sm text-gray-500" }, "配置截图工具的默认行为和保存选项")), /* @__PURE__ */ window.React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ window.React.createElement("div", null, /* @__PURE__ */ window.React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "默认保存路径"), /* @__PURE__ */ window.React.createElement(
      "input",
      {
        type: "text",
        value: settings.defaultSavePath,
        onChange: (e) => setSettings({ ...settings, defaultSavePath: e.target.value }),
        className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        placeholder: "留空则使用默认下载目录"
      }
    )), /* @__PURE__ */ window.React.createElement("div", null, /* @__PURE__ */ window.React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "默认保存格式"), /* @__PURE__ */ window.React.createElement(
      "select",
      {
        value: settings.saveFormat,
        onChange: (e) => setSettings({ ...settings, saveFormat: e.target.value }),
        className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      },
      formats.map((format) => /* @__PURE__ */ window.React.createElement("option", { key: format, value: format }, format.toUpperCase()))
    )), /* @__PURE__ */ window.React.createElement("div", null, /* @__PURE__ */ window.React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "默认保存操作"), /* @__PURE__ */ window.React.createElement(
      "select",
      {
        value: settings.defaultSaveAction,
        onChange: (e) => setSettings({ ...settings, defaultSaveAction: e.target.value }),
        className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      },
      /* @__PURE__ */ window.React.createElement("option", { value: "copy" }, "仅复制到剪贴板"),
      /* @__PURE__ */ window.React.createElement("option", { value: "save" }, "仅保存到文件"),
      /* @__PURE__ */ window.React.createElement("option", { value: "both" }, "复制并保存")
    )), /* @__PURE__ */ window.React.createElement("div", null, /* @__PURE__ */ window.React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "文件名格式"), /* @__PURE__ */ window.React.createElement(
      "input",
      {
        type: "text",
        value: settings.defaultFileName,
        onChange: (e) => setSettings({ ...settings, defaultFileName: e.target.value }),
        className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        placeholder: "{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}"
      }
    ), /* @__PURE__ */ window.React.createElement("p", { className: "mt-1 text-xs text-gray-500" }, "支持变量: ", YYYY, ", ", MM, ", ", DD, ", ", HH, ", ", mm, ", ", ss)), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ window.React.createElement("label", { className: "text-sm font-medium text-gray-700" }, "截图时显示鼠标光标"), /* @__PURE__ */ window.React.createElement(
      "button",
      {
        onClick: () => setSettings({ ...settings, showCursor: !settings.showCursor }),
        className: `relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.showCursor ? "bg-blue-600" : "bg-gray-300"}`
      },
      /* @__PURE__ */ window.React.createElement("span", { className: `inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.showCursor ? "translate-x-5" : "translate-x-1"}` })
    ))), /* @__PURE__ */ window.React.createElement("div", { className: "mt-8 flex justify-end" }, /* @__PURE__ */ window.React.createElement(
      "button",
      {
        onClick: handleSave,
        className: "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      },
      "保存设置"
    )));
  };
  const { React, api } = window;
  module.exports = {
    register: function(toolboxApi) {
      const { registerTool, registerSidebarButton, registerPanel } = toolboxApi;
      registerTool({
        id: "plugin-screenshot",
        name: "截图工具",
        iconName: "Camera",
        color: "#3b82f6",
        textColor: "#ffffff",
        path: "/tools/plugin-screenshot",
        component: require("./src/components/ToolPanel").default
      });
      registerSidebarButton({
        id: "plugin-screenshot-btn",
        icon: "Camera",
        label: "截图工具",
        onClick: async (e, anchorRect) => {
          var _a;
          try {
            const data = await ((_a = api.startScreenshotCapture) == null ? void 0 : _a.call(api));
            if (data && data.captures && data.captures.length > 0) {
              setScreenshotState({
                isCapturing: true,
                captures: data.captures,
                windowPosition: data.windowPosition,
                selectionBox: null,
                texts: [],
                activeTextId: null,
                activeTool: "select"
              });
              registerPanel("plugin-screenshot-overlay", {
                id: "plugin-screenshot-overlay",
                render: () => React.createElement(ScreenshotOverlay)
              });
            } else if (data == null ? void 0 : data.error) {
              console.warn("Screenshot capture error or denied:", data.error);
            }
          } catch (error) {
            console.error("Screenshot capture failed:", error);
          }
        }
      });
      if (api.registerSettingsPanel) {
        api.registerSettingsPanel("plugin-screenshot", {
          id: "plugin-screenshot",
          render: () => React.createElement(SettingsPanel)
        });
      }
    }
  };
})(window.React);
