(function() {
  "use strict";
  const { React: React$3 } = window;
  let listeners = [];
  let state = {
    isCapturing: false,
    captures: [],
    windowPosition: { x: 0, y: 0 },
    selectionBox: null,
    activeTool: "select",
    color: "#f4a125",
    // KoBar primary theme fallback
    sizeLevel: 2,
    texts: [],
    activeTextId: null
  };
  const getScreenshotState = () => state;
  const setScreenshotState = (newState) => {
    state = { ...state, ...newState };
    listeners.forEach((l) => l(state));
  };
  const updateColor = (newColor) => {
    const updates = { color: newColor };
    if (state.activeTextId) {
      updates.texts = state.texts.map((t) => t.id === state.activeTextId ? { ...t, color: newColor } : t);
    }
    setScreenshotState(updates);
  };
  const updateSizeLevel = (newSize) => {
    const updates = { sizeLevel: newSize };
    if (state.activeTextId) {
      updates.texts = state.texts.map((t) => t.id === state.activeTextId ? { ...t, sizeLevel: newSize } : t);
    }
    setScreenshotState(updates);
  };
  const useScreenshotStore = () => {
    const [snap, setSnap] = React$3.useState(state);
    React$3.useEffect(() => {
      listeners.push(setSnap);
      return () => {
        listeners = listeners.filter((l) => l !== setSnap);
      };
    }, []);
    return snap;
  };
  const { api: api$3, useAppStore: useAppStore$2 } = window;
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
      { id: "select", icon: "near_me" },
      { id: "pen", icon: "draw" },
      { id: "rect", icon: "rectangle" },
      { id: "arrow", icon: "arrow_right_alt" },
      { id: "text", icon: "title" }
    ];
    const colors = ["#f4a125", "#ef4444", "#3b82f6", "#22c55e", "#ffffff"];
    const handleCancel = () => {
      setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
    };
    const handleExit = () => {
      api$3.cancelScreenshot();
      useAppStore$2.setState({ activeExtensionPanelId: null });
    };
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        className: "absolute z-50 flex flex-col gap-2 p-2 rounded-xl bg-slate-900/90 shadow-2xl border border-slate-700/50 backdrop-blur-xl no-drag-region cursor-default",
        style: { top, left },
        onMouseDown: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-1 border-b border-slate-700/50 pb-2" }, tools.map((t) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: t.id,
          onClick: () => setScreenshotState({ activeTool: t.id }),
          className: `w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTool === t.id ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-white/10 active:scale-95"}`
        },
        /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[18px]" }, t.icon)
      )), /* @__PURE__ */ window.React.createElement("div", { className: "w-[1px] h-6 bg-slate-700/50 mx-1" }), /* @__PURE__ */ window.React.createElement("div", { className: "flex items-center gap-1 px-1" }, [1, 2, 3].map((size) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: size,
          onClick: () => updateSizeLevel(size),
          className: `w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-white/10 active:scale-95 ${sizeLevel === size ? "bg-white/20" : ""}`
        },
        /* @__PURE__ */ window.React.createElement("div", { className: `rounded-full transition-all ${sizeLevel === size ? "bg-white" : "bg-slate-400"}`, style: { width: size * 3 + 2, height: size * 3 + 2 } })
      ))), /* @__PURE__ */ window.React.createElement("div", { className: "w-[1px] h-6 bg-slate-700/50 mx-1" }), colors.map((c) => /* @__PURE__ */ window.React.createElement(
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
          className: "text-xs text-slate-400 hover:text-white transition-all px-2 py-1 rounded-md hover:bg-white/10 active:scale-95"
        },
        "Retake"
      ), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: handleExit,
          className: "text-xs text-slate-400 hover:text-red-400 transition-all px-2 py-1 rounded-md hover:bg-red-400/10 active:scale-95 flex items-center gap-1"
        },
        /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px]" }, "close"),
        "Exit"
      ), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: () => document.dispatchEvent(new CustomEvent("screenshot-action", { detail: "copy" })),
          className: "text-xs text-white bg-primary hover:bg-primary/80 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-bold ml-2"
        },
        /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px]" }, "content_copy"),
        "Copy"
      ), /* @__PURE__ */ window.React.createElement(
        "button",
        {
          onClick: () => document.dispatchEvent(new CustomEvent("screenshot-action", { detail: "save" })),
          className: "text-xs text-white bg-slate-700 hover:bg-slate-600 transition-all px-3 py-1 rounded-md active:scale-95 flex items-center gap-1 font-bold ml-1"
        },
        /* @__PURE__ */ window.React.createElement("span", { className: "material-symbols-outlined text-[14px]" }, "save"),
        "Save"
      ))
    );
  };
  const { React: React$2, api: api$2, useAppStore: useAppStore$1 } = window;
  const fontSizes = { 1: 16, 2: 24, 3: 36 };
  const lineW = { 1: 2, 2: 4, 3: 8 };
  const AnnotationLayer = ({ backgroundCanvasRef }) => {
    const { selectionBox, activeTool, color, sizeLevel, texts, activeTextId } = useScreenshotStore();
    const canvasRef = React$2.useRef(null);
    const [isDrawing, setIsDrawing] = React$2.useState(false);
    const [paths, setPaths] = React$2.useState([]);
    const [currentPath, setCurrentPath] = React$2.useState(null);
    const [draggingTextId, setDraggingTextId] = React$2.useState(null);
    const [dragStartOffset, setDragStartOffset] = React$2.useState({ x: 0, y: 0 });
    React$2.useEffect(() => {
      const handleAction = async (e) => {
        const action = e.detail;
        if (action === "copy" || action === "save") {
          setScreenshotState({ activeTextId: null });
          setTimeout(() => compositeAndExport(action), 50);
        }
      };
      document.addEventListener("screenshot-action", handleAction);
      return () => document.removeEventListener("screenshot-action", handleAction);
    }, [selectionBox, paths, texts]);
    React$2.useEffect(() => {
      redraw();
    }, [paths, currentPath, selectionBox]);
    const redraw = () => {
      if (!canvasRef.current || !selectionBox) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, selectionBox.width, selectionBox.height);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const drawPath = (p) => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = lineW[p.sizeLevel] || 4;
        if (p.tool === "pen") {
          if (p.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(p.points[0].x, p.points[0].y);
          for (let i = 1; i < p.points.length; i++) {
            ctx.lineTo(p.points[i].x, p.points[i].y);
          }
          ctx.stroke();
        } else if (p.tool === "rect") {
          ctx.strokeRect(p.start.x, p.start.y, p.end.x - p.start.x, p.end.y - p.start.y);
        } else if (p.tool === "arrow") {
          const headlen = p.sizeLevel === 3 ? 20 : p.sizeLevel === 2 ? 14 : 10;
          const dx = p.end.x - p.start.x;
          const dy = p.end.y - p.start.y;
          const angle = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(p.start.x, p.start.y);
          ctx.lineTo(p.end.x, p.end.y);
          ctx.lineTo(p.end.x - headlen * Math.cos(angle - Math.PI / 6), p.end.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(p.end.x, p.end.y);
          ctx.lineTo(p.end.x - headlen * Math.cos(angle + Math.PI / 6), p.end.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      };
      paths.forEach(drawPath);
      if (currentPath) drawPath(currentPath);
    };
    const getRelPos = (e) => {
      if (!selectionBox) return { x: 0, y: 0 };
      return { x: e.clientX - selectionBox.x, y: e.clientY - selectionBox.y };
    };
    const handleMouseDown = (e) => {
      e.stopPropagation();
      if (activeTextId) {
        setScreenshotState({ activeTextId: null });
      }
      if (activeTool === "select") return;
      const pos = getRelPos(e);
      if (activeTool === "text") {
        const newText = {
          id: "txt_" + Date.now(),
          text: "",
          x: pos.x,
          y: pos.y,
          color,
          sizeLevel
        };
        setScreenshotState({ texts: [...texts, newText], activeTextId: newText.id });
        return;
      }
      setIsDrawing(true);
      if (activeTool === "pen") {
        setCurrentPath({ tool: "pen", color, sizeLevel, points: [pos] });
      } else {
        setCurrentPath({ tool: activeTool, color, sizeLevel, start: pos, end: pos });
      }
    };
    const handleMouseMove = (e) => {
      e.stopPropagation();
      if (draggingTextId) {
        const pos2 = getRelPos(e);
        setScreenshotState({
          texts: texts.map(
            (t) => t.id === draggingTextId ? { ...t, x: pos2.x - dragStartOffset.x, y: pos2.y - dragStartOffset.y } : t
          )
        });
        return;
      }
      if (!isDrawing || !currentPath) return;
      const pos = getRelPos(e);
      if (activeTool === "pen") {
        setCurrentPath({ ...currentPath, points: [...currentPath.points, pos] });
      } else {
        setCurrentPath({ ...currentPath, end: pos });
      }
    };
    const handleMouseUp = (e) => {
      e.stopPropagation();
      if (draggingTextId) {
        setDraggingTextId(null);
        return;
      }
      if (!isDrawing) return;
      setIsDrawing(false);
      if (currentPath) {
        setPaths([...paths, currentPath]);
        setCurrentPath(null);
      }
    };
    const compositeAndExport = async (action) => {
      if (!selectionBox || !backgroundCanvasRef.current || !canvasRef.current) return;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = selectionBox.width;
      exportCanvas.height = selectionBox.height;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        backgroundCanvasRef.current,
        selectionBox.x,
        selectionBox.y,
        selectionBox.width,
        selectionBox.height,
        0,
        0,
        selectionBox.width,
        selectionBox.height
      );
      ctx.drawImage(canvasRef.current, 0, 0);
      const currentTexts = getScreenshotState().texts;
      currentTexts.forEach((t) => {
        if (!t.text.trim()) return;
        const fSize = fontSizes[t.sizeLevel];
        ctx.font = `${fSize}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = t.color;
        ctx.textBaseline = "top";
        const lines = t.text.split("\n");
        lines.forEach((line, i) => {
          ctx.fillText(line, t.x + 4, t.y + 4 + i * fSize * 1.2);
        });
      });
      const dataUrl = exportCanvas.toDataURL("image/png");
      if (action === "copy") {
        api$2.copyScreenshotToClipboard(dataUrl);
        api$2.sendNotification("Screenshot Copied", "Saved to clipboard.");
      } else {
        const res = await api$2.saveScreenshot({ buffer: dataUrl, format: "png" });
        if (res.success) {
          api$2.sendNotification("Screenshot Saved", `Saved to ${res.path}`);
        }
      }
      api$2.cancelScreenshot();
      useAppStore$1.setState({ activeExtensionPanelId: null });
    };
    if (!selectionBox) return null;
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        className: `absolute z-40 no-drag-region ${activeTool === "select" ? "pointer-events-none" : "pointer-events-auto"} ${activeTool === "text" ? "cursor-text" : activeTool === "select" ? "" : "cursor-crosshair"}`,
        style: {
          left: selectionBox.x,
          top: selectionBox.y,
          width: selectionBox.width,
          height: selectionBox.height
        },
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp
      },
      /* @__PURE__ */ window.React.createElement(
        "canvas",
        {
          ref: canvasRef,
          className: "absolute inset-0 pointer-events-none",
          width: selectionBox.width,
          height: selectionBox.height
        }
      ),
      texts.map((t) => {
        const isActive = activeTextId === t.id;
        const fSize = fontSizes[t.sizeLevel];
        return /* @__PURE__ */ window.React.createElement(
          "div",
          {
            key: t.id,
            className: `absolute rounded-md ${isActive ? "border-2 border-dashed border-white/50 bg-black/20" : "border-2 border-transparent"} ${!t.text.trim() && !isActive ? "pointer-events-none" : ""}`,
            style: {
              left: t.x,
              top: t.y,
              color: t.color,
              fontSize: `${fSize}px`,
              fontFamily: '"Space Grotesk", sans-serif',
              padding: "4px",
              minWidth: "20px",
              minHeight: `${fSize * 1.2}px`,
              lineHeight: 1.2,
              cursor: draggingTextId === t.id ? "grabbing" : activeTool === "select" || activeTool === "text" ? "grab" : "default"
            },
            onMouseDown: (e) => {
              e.stopPropagation();
              if (activeTool !== "text" && activeTool !== "select") return;
              setScreenshotState({ activeTextId: t.id, activeTool: "text" });
              const pos = getRelPos(e);
              setDragStartOffset({ x: pos.x - t.x, y: pos.y - t.y });
              setDraggingTextId(t.id);
            }
          },
          /* @__PURE__ */ window.React.createElement(
            "div",
            {
              contentEditable: true,
              suppressContentEditableWarning: true,
              className: "select-text",
              onMouseDown: (e) => {
                if (isActive) e.stopPropagation();
              },
              onInput: (e) => {
                const newText = e.target.innerText;
                setScreenshotState({
                  texts: getScreenshotState().texts.map((tx) => tx.id === t.id ? { ...tx, text: newText } : tx)
                });
              },
              ref: (el) => {
                if (el) {
                  if (document.activeElement !== el && el.innerText !== t.text) {
                    el.innerText = t.text;
                  }
                  if (isActive && document.activeElement !== el) {
                    setTimeout(() => el.focus(), 50);
                  }
                }
              },
              style: { outline: "none", whiteSpace: "pre", cursor: "text", WebkitUserSelect: "text", userSelect: "text", minWidth: "10px", minHeight: `${fSize * 1.2}px` }
            }
          )
        );
      })
    );
  };
  const { React: React$1, api: api$1 } = window;
  const ScreenshotOverlay = () => {
    const { captures, windowPosition, selectionBox } = useScreenshotStore();
    const [isDragging, setIsDragging] = React$1.useState(false);
    const [dragStart, setDragStart] = React$1.useState(null);
    const [dragCurrent, setDragCurrent] = React$1.useState(null);
    const canvasRef = React$1.useRef(null);
    const dimLayerRef = React$1.useRef(null);
    React$1.useEffect(() => {
      if (!canvasRef.current || captures.length === 0) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      captures.forEach((capture) => {
        const img = new Image();
        img.onload = () => {
          const x = capture.bounds.x - windowPosition.x;
          const y = capture.bounds.y - windowPosition.y;
          ctx.drawImage(img, x, y, capture.bounds.width, capture.bounds.height);
        };
        img.src = capture.imageDataUrl;
      });
    }, [captures, windowPosition]);
    React$1.useEffect(() => {
      if (!dimLayerRef.current) return;
      const ctx = dimLayerRef.current.getContext("2d");
      if (!ctx) return;
      dimLayerRef.current.width = window.innerWidth;
      dimLayerRef.current.height = window.innerHeight;
      ctx.clearRect(0, 0, dimLayerRef.current.width, dimLayerRef.current.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, 0, dimLayerRef.current.width, dimLayerRef.current.height);
      const box = selectionBox || (dragStart && dragCurrent ? {
        x: Math.min(dragStart.x, dragCurrent.x),
        y: Math.min(dragStart.y, dragCurrent.y),
        width: Math.abs(dragCurrent.x - dragStart.x),
        height: Math.abs(dragCurrent.y - dragStart.y)
      } : null);
      if (box) {
        ctx.clearRect(box.x, box.y, box.width, box.height);
        ctx.strokeStyle = "#f4a125";
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      }
    }, [selectionBox, dragStart, dragCurrent]);
    const handleMouseDown = (e) => {
      if (selectionBox) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragCurrent({ x: e.clientX, y: e.clientY });
    };
    const handleMouseMove = (e) => {
      if (!isDragging || !dragStart) return;
      setDragCurrent({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => {
      if (!isDragging || !dragStart || !dragCurrent) return;
      setIsDragging(false);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);
      if (width > 10 && height > 10) {
        setScreenshotState({
          selectionBox: {
            x: Math.min(dragStart.x, dragCurrent.x),
            y: Math.min(dragStart.y, dragCurrent.y),
            width,
            height
          }
        });
      }
      setDragStart(null);
      setDragCurrent(null);
    };
    React$1.useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          api$1.cancelScreenshot();
          setScreenshotState({ selectionBox: null, texts: [], activeTextId: null });
          window.useAppStore.setState({ activeExtensionPanelId: null });
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        className: "fixed inset-0 z-[999999] pointer-events-auto cursor-crosshair no-drag-region",
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        style: { width: "100vw", height: "100vh", backgroundColor: "transparent" }
      },
      /* @__PURE__ */ window.React.createElement("canvas", { ref: canvasRef, className: "absolute inset-0 pointer-events-none" }),
      /* @__PURE__ */ window.React.createElement("canvas", { ref: dimLayerRef, className: "absolute inset-0 pointer-events-none" }),
      selectionBox && /* @__PURE__ */ window.React.createElement(AnnotationLayer, { backgroundCanvasRef: canvasRef }),
      selectionBox && /* @__PURE__ */ window.React.createElement(Toolbar, null)
    );
  };
  const { React, KoBarExtensions, api, useAppStore } = window;
  KoBarExtensions.registerSidebarButton({
    id: "screenshot-studio-btn",
    icon: "screenshot_region",
    label: "Screenshot Studio",
    onClick: async (e, anchorRect) => {
      try {
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
            activeTool: "select"
          });
          useAppStore.setState({
            activeExtensionPanelId: "screenshot-studio-overlay",
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
  KoBarExtensions.registerPanel("screenshot-studio-overlay", {
    id: "screenshot-studio-overlay",
    render: () => {
      return React.createElement(ScreenshotOverlay);
    }
  });
})();
