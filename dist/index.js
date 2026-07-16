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
  const getScreenshotState = () => state;
  window.getScreenshotState = getScreenshotState;
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
      var _a, _b;
      const electron = window.electron;
      (_b = (_a = electron == null ? void 0 : electron.screenshot) == null ? void 0 : _a.cancel) == null ? void 0 : _b.call(_a);
      setScreenshotState({ isCapturing: false, selectionBox: null, texts: [], activeTextId: null });
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
    react.useEffect(() => {
      const handleScreenshotAction = async (e) => {
        var _a, _b, _c, _d;
        const detail = e.detail;
        const canvas = canvasRef.current;
        if (!canvas) return;
        let dataUrl;
        if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = selectionBox.width;
          tempCanvas.height = selectionBox.height;
          const ctx = tempCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height, 0, 0, selectionBox.width, selectionBox.height);
            dataUrl = tempCanvas.toDataURL("image/png");
          } else {
            dataUrl = canvas.toDataURL("image/png");
          }
        } else {
          dataUrl = canvas.toDataURL("image/png");
        }
        const electron = window.electron;
        if (detail === "copy") {
          (_b = (_a = electron == null ? void 0 : electron.screenshot) == null ? void 0 : _a.copyToClipboard) == null ? void 0 : _b.call(_a, dataUrl);
          setScreenshotState({ isCapturing: false, selectionBox: null, texts: [], activeTextId: null });
        } else if (detail === "save") {
          await ((_d = (_c = electron == null ? void 0 : electron.screenshot) == null ? void 0 : _c.save) == null ? void 0 : _d.call(_c, { buffer: dataUrl, format: "png" }));
          setScreenshotState({ isCapturing: false, selectionBox: null, texts: [], activeTextId: null });
        }
      };
      document.addEventListener("screenshot-action", handleScreenshotAction);
      return () => document.removeEventListener("screenshot-action", handleScreenshotAction);
    }, [selectionBox]);
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
  const { React, ReactDOM } = window;
  const PluginHeader = ({ title }) => {
    const handleMinimize = () => {
      var _a, _b;
      (_b = (_a = window.electron) == null ? void 0 : _a.plugin) == null ? void 0 : _b.minimizeWindow();
    };
    const handleMaximize = () => {
      var _a, _b;
      (_b = (_a = window.electron) == null ? void 0 : _a.plugin) == null ? void 0 : _b.maximizeWindow();
    };
    const handleClose = () => {
      var _a, _b;
      (_b = (_a = window.electron) == null ? void 0 : _a.plugin) == null ? void 0 : _b.closeWindow();
    };
    return React.createElement(
      "div",
      { className: "plugin-header" },
      React.createElement("div", { className: "plugin-header-title" }, title),
      React.createElement(
        "div",
        { className: "plugin-header-controls" },
        React.createElement(
          "button",
          { onClick: handleMinimize },
          React.createElement(
            "svg",
            { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
            React.createElement("path", { d: "M5 12h14" })
          )
        ),
        React.createElement(
          "button",
          { onClick: handleMaximize },
          React.createElement(
            "svg",
            { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
            React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" })
          )
        ),
        React.createElement(
          "button",
          { onClick: handleClose },
          React.createElement(
            "svg",
            { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
            React.createElement("path", { d: "M18 6L6 18M6 6l12 12" })
          )
        )
      )
    );
  };
  const ToolPanel = () => {
    return React.createElement(
      "div",
      { className: "h-full flex flex-col" },
      React.createElement(
        "div",
        { className: "p-4 border-b bg-gray-50" },
        React.createElement("h2", { className: "text-lg font-semibold text-gray-800" }, "截图工具"),
        React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "点击下方按钮开始截图")
      ),
      React.createElement(
        "div",
        { className: "flex-1 flex items-center justify-center" },
        React.createElement(
          "button",
          {
            onClick: async () => {
              var _a, _b;
              try {
                const electron = window.electron;
                const data = await ((_b = (_a = electron == null ? void 0 : electron.screenshot) == null ? void 0 : _a.startCapture) == null ? void 0 : _b.call(_a));
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
                }
              } catch (error) {
                console.error("Screenshot capture failed:", error);
              }
            },
            className: "px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          },
          React.createElement("span", null, "开始截图")
        )
      )
    );
  };
  const PluginApp = () => {
    const pluginData2 = window.__PLUGIN_DATA__;
    const title = (pluginData2 == null ? void 0 : pluginData2.pluginName) || "截图工具";
    const { isCapturing } = useScreenshotStore();
    if (isCapturing) {
      return React.createElement(ScreenshotOverlay);
    }
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(PluginHeader, { title }),
      React.createElement(
        "div",
        { className: "plugin-content" },
        React.createElement(ToolPanel)
      )
    );
  };
  function renderStandalone() {
    if (!React || !ReactDOM) {
      console.error("React or ReactDOM is not available");
      return;
    }
    const root = document.getElementById("root");
    if (!root) {
      console.error("Root element not found");
      return;
    }
    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(root).render(React.createElement(PluginApp));
    } else {
      ReactDOM.render(React.createElement(PluginApp), root);
    }
  }
  function registerPlugin(toolboxApi) {
    const { registerTool, registerSidebarButton, openPluginWindow } = toolboxApi;
    registerTool({
      id: "plugin-screenshot",
      name: "截图工具",
      iconName: "Camera",
      color: "#3b82f6",
      textColor: "#ffffff",
      path: "/tools/plugin-screenshot",
      component: ToolPanel
    });
    registerSidebarButton({
      id: "plugin-screenshot-btn",
      icon: "Camera",
      label: "截图工具",
      onClick: () => {
        openPluginWindow == null ? void 0 : openPluginWindow("plugin-screenshot");
      }
    });
  }
  const pluginData = window.__PLUGIN_DATA__;
  if (pluginData) {
    renderStandalone();
  }
  module.exports = {
    register: registerPlugin
  };
})(window.React);
