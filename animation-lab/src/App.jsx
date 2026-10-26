import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { SkipBack, Play, Pause, SkipForward, Plus, CopyPlus, Trash2, Layers3, Gauge } from "lucide-react";

import {
    Stage,
    Layer,
    Line,
    Rect,
    Circle,
    Text,
    Image as KonvaImage,
    Group,
    RegularPolygon,
    Star,
    Ellipse,
    Arrow,
    Shape,
    Transformer
} from "react-konva";

import "./index.css";


function App() {

    const MAIN_MENU_URL = "https://nothinkformal.github.io/la-peace/index.html";

    const goToMainMenu = (event) => {
        if (event) event.preventDefault();
        window.location.assign(MAIN_MENU_URL);
    };

    
    
    

    const DEFAULT_LAYER_ID = "layer-1";


    
    
    

    const [lines, setLines] = useState([]);
    const [objects, setObjects] = useState([]);
    const [fills, setFills] = useState([]);
    const persistenceReadyRef = useRef(false);
    const persistenceKey = "lemcoDrawingLabProjectV1";

    const imageToDataUrl = image => {
        if (!image) return null;
        if (typeof image === "string") return image;
        if (typeof image.src === "string" && image.src.startsWith("data:")) {
            return image.src;
        }
        try {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            if (!canvas.width || !canvas.height) return null;
            canvas.getContext("2d").drawImage(image, 0, 0);
            return canvas.toDataURL("image/png");
        } catch {
            return null;
        }
    };

    const restoreImage = src => new Promise(resolve => {
        if (!src) return resolve(null);
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
    });




    
    
    
    
    
    

    const [layers, setLayers] = useState([
        {
            id: DEFAULT_LAYER_ID,
            name: "Layer 1",
            visible: true
        }
    ]);

    const [activeLayerId, setActiveLayerId] =
        useState(DEFAULT_LAYER_ID);

    // Animation frames: every frame stores its own drawing data and layer stack.
    const [frames, setFrames] = useState([
        { id: "frame-1", name: "Frame 1", lines: [], objects: [], fills: [], layers: [{ id: DEFAULT_LAYER_ID, name: "Layer 1", visible: true }], activeLayerId: DEFAULT_LAYER_ID, layerGroups: [], history: [], redoHistory: [] }
    ]);
    const [activeFrameId, setActiveFrameId] = useState("frame-1");
    const frameCounterRef = useRef(1);
    const [onionSkinEnabled, setOnionSkinEnabled] = useState(true);
    const [toolbarHidden, setToolbarHidden] = useState(false);
    const [playbackFps, setPlaybackFps] = useState(12);
    const [isPlaying, setIsPlaying] = useState(false);

    const captureCurrentFrame = () => ({
        lines,
        objects,
        fills,
        layers,
        activeLayerId,
        layerGroups,
        history,
        redoHistory
    });

    const switchToFrame = (nextFrameId) => {
        const currentSnapshot = captureCurrentFrame();
        setFrames(previous => previous.map(frame =>
            frame.id === activeFrameId ? { ...frame, ...currentSnapshot } : frame
        ));
        const nextFrame = frames.find(frame => frame.id === nextFrameId);
        if (!nextFrame || nextFrameId === activeFrameId) return;
        setLines(nextFrame.lines || []);
        setObjects(nextFrame.objects || []);
        setFills(nextFrame.fills || []);
        setLayers(nextFrame.layers?.length ? nextFrame.layers : [{ id: `${nextFrame.id}-layer-1`, name: "Layer 1", visible: true }]);
        setActiveLayerId(nextFrame.activeLayerId || nextFrame.layers?.[0]?.id || `${nextFrame.id}-layer-1`);
        setLayerGroups(nextFrame.layerGroups || []);
        setActiveFrameId(nextFrameId);
        setHistory(nextFrame.history || []);
        setRedoHistory(nextFrame.redoHistory || []);
        setSelectedElements([]);
        setSelectedLayerIds([]);
    };

    const addAnimationFrame = (duplicate = false) => {
        const snapshot = captureCurrentFrame();
        const idNumber = ++frameCounterRef.current;
        const id = `frame-${idNumber}`;
        const frame = {
            id,
            name: `Frame ${idNumber}`,
            lines: duplicate ? [...lines] : [],
            objects: duplicate ? [...objects] : [],
            fills: duplicate ? [...fills] : [],
            layers: duplicate ? layers.map(layer => ({ ...layer, id: `${id}-${layer.id}` })) : [{ id: `${id}-layer-1`, name: "Layer 1", visible: true }],
            activeLayerId: duplicate ? `${id}-${activeLayerId}` : `${id}-layer-1`,
            layerGroups: duplicate ? layerGroups.map(group => ({ ...group, id: `${id}-${group.id}`, layerIds: group.layerIds.map(layerId => `${id}-${layerId}`) })) : [],
            // Duplicated artwork starts a new independent undo/redo history.
            history: [],
            redoHistory: []
        };
        setFrames(previous => [
            ...previous.map(existing => existing.id === activeFrameId ? { ...existing, ...snapshot } : existing),
            frame
        ]);
        setLines(frame.lines);
        setObjects(frame.objects);
        setFills(frame.fills);
        setLayers(frame.layers);
        setActiveLayerId(frame.activeLayerId);
        setLayerGroups(frame.layerGroups || []);
        setActiveFrameId(id);
        setHistory([]);
        setRedoHistory([]);
        setSelectedElements([]);
    };

    const deleteAnimationFrame = (frameId) => {
        if (frames.length <= 1) return;
        const remaining = frames.filter(frame => frame.id !== frameId);
        if (frameId === activeFrameId) {
            const index = frames.findIndex(frame => frame.id === frameId);
            const next = remaining[Math.max(0, index - 1)] || remaining[0];
            setFrames(remaining);
            if (next) {
                setLines(next.lines || []);
                setObjects(next.objects || []);
                setFills(next.fills || []);
                setLayers(next.layers?.length ? next.layers : [{ id: `${next.id}-layer-1`, name: "Layer 1", visible: true }]);
                setActiveLayerId(next.activeLayerId || next.layers?.[0]?.id || `${next.id}-layer-1`);
                setLayerGroups(next.layerGroups || []);
                setActiveFrameId(next.id);
                setHistory(next.history || []);
                setRedoHistory(next.redoHistory || []);
            }
        } else {
            setFrames(remaining);
        }
    };



    // Playback advances one frame per selected FPS and loops continuously.
    useEffect(() => {
        if (!isPlaying || frames.length < 2) return undefined;
        const intervalMs = 1000 / Math.max(1, playbackFps);
        const timerId = window.setInterval(() => {
            const currentIndex = frames.findIndex(frame => frame.id === activeFrameId);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % frames.length : 0;
            switchToFrame(frames[nextIndex].id);
        }, intervalMs);
        return () => window.clearInterval(timerId);
    }, [isPlaying, playbackFps, frames, activeFrameId]);

    const [layerGroups, setLayerGroups] = useState([]);
    const [selectedLayerIds, setSelectedLayerIds] = useState([]);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [draggedGroupId, setDraggedGroupId] = useState(null);
    const [layerGroupContextMenu, setLayerGroupContextMenu] = useState(null);

    const [draggedLayerId, setDraggedLayerId] =
        useState(null);
    const [draggedLayerIds, setDraggedLayerIds] = useState([]);

    const [editingLayerId, setEditingLayerId] =
        useState(null);

    const [editingLayerName, setEditingLayerName] =
        useState("");


    
    
    

    const [history, setHistory] = useState([]);
    const [redoHistory, setRedoHistory] = useState([]);
    const lemFileInputRef = useRef(null);
    const [exportSelection, setExportSelection] = useState(null);
    const [exportPreview, setExportPreview] = useState("");
    const [exportCrop, setExportCrop] = useState({ x: 100, y: 100, width: 500, height: 500 });
    const exportDragRef = useRef(null);
    const [lemDialog, setLemDialog] = useState(null);
    const [lemPassword, setLemPassword] = useState("");
    const [lemPasswordConfirm, setLemPasswordConfirm] = useState("");
    const [lemDialogMessage, setLemDialogMessage] = useState("");
    const [pendingLemFile, setPendingLemFile] = useState(null);


    
    
    

    const [tool, setTool] =
        useState("select");

    const [color, setColor] =
        useState("#222222");

    const [frequentColors, setFrequentColors] =
        useState(() => {
            try {
                const saved = JSON.parse(
                    localStorage.getItem(
                        "laPeaceDrawingFrequentColors"
                    ) || "[]"
                );

                return Array.isArray(saved)
                    ? saved
                        .filter(
                            value =>
                                typeof value === "string"
                        )
                        .slice(0, 12)
                    : [];
            } catch {
                return [];
            }
        });

    const [frequentColorsOpen, setFrequentColorsOpen] =
        useState(false);

    const [draftColor, setDraftColor] =
        useState(color);

    const customColorInputRef =
        useRef(null);

    const openFrequentColors = () => {
        setDraftColor(color);
        setFrequentColorsOpen(true);
    };

    const selectDraftColor = nextColor => {
        setDraftColor(String(nextColor).toLowerCase());
    };

    const selectBrushColor = nextColor => {
        const normalized =
            String(nextColor).toLowerCase();

        setColor(normalized);

        setFrequentColors(prev => {
            const next = [
                normalized,
                ...prev.filter(
                    value =>
                        value.toLowerCase() !==
                        normalized
                )
            ].slice(0, 12);

            localStorage.setItem(
                "laPeaceDrawingFrequentColors",
                JSON.stringify(next)
            );

            return next;
        });

        setFrequentColorsOpen(false);
    };

    const finishFrequentColorSelection = () => {
        selectBrushColor(draftColor);
    };

    const cancelFrequentColorSelection = () => {
        setDraftColor(color);
        setFrequentColorsOpen(false);
    };

    useEffect(() => {
        const handleColorPopupClose = event => {
            const control = document.querySelector(
                ".toolbar_color_control"
            );

            if (
                frequentColorsOpen &&
                control &&
                !control.contains(event.target)
            ) {
                cancelFrequentColorSelection();
            }
        };

        const handleColorPopupEscape = event => {
            if (event.key === "Escape") {
                cancelFrequentColorSelection();
            }
        };

        document.addEventListener(
            "mousedown",
            handleColorPopupClose
        );

        document.addEventListener(
            "keydown",
            handleColorPopupEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleColorPopupClose
            );

            document.removeEventListener(
                "keydown",
                handleColorPopupEscape
            );
        };
    }, [frequentColorsOpen]);

    const [brushSize, setBrushSize] =
        useState(5);

    const [brushType, setBrushType] =
        useState("basic");

    const [brushMenuOpen, setBrushMenuOpen] =
        useState(false);

    const brushOptions = [
        { id: "basic", name: "Basic", description: "Clean solid line" },
        { id: "pencil", name: "Pencil", description: "Soft, light sketch" },
        { id: "marker", name: "Marker", description: "Broad, semi-transparent stroke" },
        { id: "ink", name: "Ink", description: "Smooth, firm ink line" },
        { id: "airbrush", name: "Airbrush", description: "Soft, feathered stroke" },
        { id: "chalk", name: "Chalk", description: "Rough, broken stroke" }
    ];

    const selectBrush = nextBrush => {
        setBrushType(nextBrush);
        setTool("pen");
        setPendingInsert(null);
        setSelectedElements([]);
    };

    const finishBrushSelection = () => {
        setBrushMenuOpen(false);
    };

    useEffect(() => {
        const handleBrushMenuClose = event => {
            const control = document.querySelector(".toolbar_pen_control");

            if (brushMenuOpen && control && !control.contains(event.target)) {
                setBrushMenuOpen(false);
            }
        };

        const handleBrushMenuEscape = event => {
            if (event.key === "Escape") setBrushMenuOpen(false);
        };

        document.addEventListener("mousedown", handleBrushMenuClose);
        document.addEventListener("keydown", handleBrushMenuEscape);

        return () => {
            document.removeEventListener("mousedown", handleBrushMenuClose);
            document.removeEventListener("keydown", handleBrushMenuEscape);
        };
    }, [brushMenuOpen]);

    
    
    const [pendingInsert, setPendingInsert] =
        useState(null);


    
    
    

    const createPendingShape = (shapeType, position) => {

        const base = {
            type: shapeType,
            x: position.x,
            y: position.y,
            fill: "transparent",
            stroke: color,
            strokeWidth: 3,
            rotation: 0
        };

        switch (shapeType) {
            case "square":
                return { ...base, width: 100, height: 100 };

            case "circle":
                return { ...base, radius: 50 };

            case "triangle":
                return { ...base, sides: 3, radius: 60 };

            case "diamond":
                return { ...base, sides: 4, radius: 60 };

            case "hexagon":
                return { ...base, sides: 6, radius: 60 };

            case "oval":
                return { ...base, radiusX: 75, radiusY: 45 };

            case "parallelogram":
                return { ...base, width: 140, height: 80 };

            case "star":
                return {
                    ...base,
                    numPoints: 5,
                    innerRadius: 30,
                    outerRadius: 65
                };

            case "cloud":
                return { ...base, width: 160, height: 100 };

            case "heart":
                return { ...base, width: 120, height: 110 };

            case "incorrect":
                return { ...base, width: 130, height: 80 };

            case "correct":
                return { ...base, width: 130, height: 80 };

            case "leftArrow":
            case "upArrow":
            case "downArrow":
            case "rightArrow":
                return { ...base };

            default:
                return null;
        }
    };

    const chooseShape = shapeType => {

        setPendingInsert({
            type: "shape",
            shapeType
        });

        setTool("insert");
        setSelectedElements([]);
        setEditingText(null);
        setEditingNote(null);
    };

    const chooseText = () => {

        setPendingInsert({
            type: "text"
        });

        setTool("insert");
        setSelectedElements([]);
        setEditingText(null);
        setEditingNote(null);
    };

    const chooseNote = () => {

        setPendingInsert({
            type: "note"
        });

        setTool("insert");
        setSelectedElements([]);
        setEditingText(null);
        setEditingNote(null);
    };

    const insertPendingObject = position => {

        if (!pendingInsert) return;

        let newObject = null;

        if (pendingInsert.type === "shape") {
            newObject = createPendingShape(
                pendingInsert.shapeType,
                position
            );
        }

        if (pendingInsert.type === "text") {
            newObject = {
                type: "text",
                x: position.x,
                y: position.y,
                text: "Text",
                fontSize: 28,
                fill: color
            };
        }

        if (pendingInsert.type === "note") {
            newObject = {
                type: "note",
                x: position.x,
                y: position.y,
                text: "Note"
            };
        }

        if (!newObject) return;

        const newIndex = objects.length;

        addObject(newObject);

        setPendingInsert(null);
        setTool("select");

        if (pendingInsert.type === "text") {
            setEditingText(newIndex);
        }

        if (pendingInsert.type === "note") {
            setEditingNote(newIndex);
        }
    };


    
    
    

    const [isDrawing, setIsDrawing] =
        useState(false);


    
    
    

    const [referenceImage, setReferenceImage] =
        useState(null);

    const [referenceWidth, setReferenceWidth] =
        useState(300);

    const [isResizing, setIsResizing] =
        useState(false);

    const [showGrid, setShowGrid] =
        useState(() =>
            localStorage.getItem("laPeaceDrawingGrid") === "enabled"
        );


    
    
    

    const [editingNote, setEditingNote] =
        useState(null);

    const [editingText, setEditingText] =
        useState(null);

    const noteInputRef =
        useRef(null);

    const textInputRef =
        useRef(null);

    // Konva's dblclick event can be unreliable on draggable nodes.
    // Keep our own short click history so Text/Note editing works
    // consistently with mouse and touch input.
    const textNoteClickRef =
        useRef({
            key: null,
            time: 0
        });

    useEffect(() => {
        localStorage.setItem(
            "laPeaceDrawingGrid",
            showGrid ? "enabled" : "disabled"
        );
    }, [showGrid]);

    // Focus the HTML editor after React has mounted it. Relying on
    // autoFocus alone is fragile because the second click that opens the
    // editor originated on the Konva canvas.
    useEffect(() => {
        if (editingText !== null && textInputRef.current) {
            const input = textInputRef.current;
            requestAnimationFrame(() => {
                input.focus();
                input.select();
            });
        }
    }, [editingText]);

    useEffect(() => {
        if (editingNote !== null && noteInputRef.current) {
            const input = noteInputRef.current;
            requestAnimationFrame(() => {
                input.focus();
                const length = input.value.length;
                input.setSelectionRange(length, length);
            });
        }
    }, [editingNote]);

    const [selectedElements, setSelectedElements] =
        useState([]);

    // The Fill tool is a painting tool, not a selection tool.
    // Clear any existing selection as soon as Fill becomes active so
    // the Transformer cannot remain visible while filling.
    useEffect(() => {
        if (tool === "fill") {
            setSelectedElements([]);
        }
    }, [tool]);

    
    const [layerContextMenu, setLayerContextMenu] =
        useState(null);

    const [recolorPickerOpen, setRecolorPickerOpen] =
        useState(false);

    const [recolorDraftColor, setRecolorDraftColor] =
        useState("#222222");

    // Transparency is stored as 0 = fully visible, 1 = fully invisible.
    // Keep it as a draft while the context-menu slider is being dragged;
    // the actual elements are only changed when Done is pressed.
    const [transparencyDraft, setTransparencyDraft] =
        useState(0);

    const [brushSizeOpen, setBrushSizeOpen] =
        useState(false);

    
    const [layerDeleteConfirm, setLayerDeleteConfirm] =
        useState(null);

    const [selectionBox, setSelectionBox] =
        useState(null);

    const selectionStartRef =
        useRef(null);

    const isSelecting =
        useRef(false);

    
    
    const isRightPanning =
        useRef(false);

    const lastPanPointer =
        useRef(null);


    
    
    

    const stageRef =
        useRef(null);

    const gridLayerRef =
        useRef(null);

    const transformerRef =
        useRef(null);

    const selectionUiLayerRef =
        useRef(null);

    const transformerUiLayerRef =
        useRef(null);

    const nodeRefs =
        useRef({});


    
    
    

    const dragStartPositionsRef =
        useRef(null);


    
    
    

    const [stageSize, setStageSize] =
        useState({
            // Reserve the main-menu sidebar and top bar so the drawing surface
            // lives inside the same dashboard layout as the rest of LEM.CO.
            width: Math.max(320, window.innerWidth - 195),
            height: Math.max(240, window.innerHeight)
        });

    const [isMobile, setIsMobile] =
        useState(() => window.innerWidth <= 768);

    const [mobilePanelOpen, setMobilePanelOpen] =
        useState(false);

    // Desktop reference-panel visibility.
    // The panel slides off the right side while the canvas expands.
    const [referencePanelHidden, setReferencePanelHidden] =
        useState(false);


    
    
    

    const [zoom, setZoom] =
        useState(1);

    // Animation Lab project format (.lemove). The payload is animation-aware:
    // it stores every frame and its independent artwork/layers/groups.
    const [projectDialog, setProjectDialog] = useState(null);
    const [projectDialogMessage, setProjectDialogMessage] = useState("");
    const projectFileInputRef = useRef(null);
    const pendingProjectFileRef = useRef(null);
    const LEMOVE_MAGIC = "LEMOVE1\n";
    const LEMOVE_KEY_BYTES = new TextEncoder().encode("LEM.CO-Lab-Project-Format-Key-v1-2026");

    const imageToDataUrlSafe = image => {
        if (!image) return null;
        if (typeof image === "string") return image;
        if (typeof image.src === "string" && image.src.startsWith("data:")) return image.src;
        try {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            if (!canvas.width || !canvas.height) return null;
            canvas.getContext("2d").drawImage(image, 0, 0);
            return canvas.toDataURL("image/png");
        } catch { return null; }
    };

    const serializeImageItems = items => (items || []).map(item => {
        const { image, ...rest } = item;
        const imageData = imageToDataUrlSafe(image);
        return { ...rest, ...(imageData ? { imageData } : {}) };
    });

    const serializeHistoryStack = stack => (stack || []).map(snapshot => ({
        ...snapshot,
        lines: snapshot.lines || [],
        objects: serializeImageItems(snapshot.objects),
        fills: serializeImageItems(snapshot.fills),
        layers: snapshot.layers || [],
        layerGroups: snapshot.layerGroups || []
    }));

    const serializeFrame = frame => ({
        ...frame,
        lines: frame.id === activeFrameId ? lines : (frame.lines || []),
        objects: serializeImageItems(frame.id === activeFrameId ? objects : frame.objects),
        fills: serializeImageItems(frame.id === activeFrameId ? fills : frame.fills),
        layers: frame.id === activeFrameId ? layers : (frame.layers || []),
        layerGroups: frame.id === activeFrameId ? layerGroups : (frame.layerGroups || []),
        activeLayerId: frame.id === activeFrameId ? activeLayerId : frame.activeLayerId,
        history: serializeHistoryStack(frame.id === activeFrameId ? history : (frame.history || [])),
        redoHistory: serializeHistoryStack(frame.id === activeFrameId ? redoHistory : (frame.redoHistory || []))
    });

    const buildLemoveProject = () => ({
        format: "LEM.CO Animation Lab Project",
        formatVersion: 1,
        createdWith: "LEM.CO Animation Lab",
        savedAt: new Date().toISOString(),
        activeFrameId,
        frameCounter: frameCounterRef.current,
        playbackFps,
        onionSkinEnabled,
        showGrid,
        color,
        frames: frames.map(serializeFrame)
    });

    const lemovBytesToBase64 = bytes => {
        let binary = "";
        bytes.forEach(byte => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    };
    const lemovBase64ToBytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
    const getLemoveKey = async () => {
        if (!window.crypto?.subtle) throw new Error("Encrypted .lemove files require HTTPS or localhost.");
        const digest = await window.crypto.subtle.digest("SHA-256", LEMOVE_KEY_BYTES);
        return window.crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    };

    const beginSaveLemove = () => { setProjectDialogMessage(""); setProjectDialog("save"); };
    const beginLoadLemove = () => {
        setProjectDialogMessage("");
        if (projectFileInputRef.current) projectFileInputRef.current.click();
    };

    const saveLemoveFile = async () => {
        try {
            const project = buildLemoveProject();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const key = await getLemoveKey();
            const plain = new TextEncoder().encode(JSON.stringify(project));
            const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
            const envelope = {
                format: "LEM.CO Auto-Encrypted Animation",
                formatVersion: 1,
                encryption: "AES-256-GCM",
                keyMode: "application-format-key-v1",
                iv: lemovBytesToBase64(iv),
                encryptedData: lemovBytesToBase64(new Uint8Array(encrypted))
            };
            const blob = new Blob([LEMOVE_MAGIC, JSON.stringify(envelope)], { type: "application/x-lemove-project" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "animation.lemove";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            setProjectDialogMessage("Animation project saved successfully as .lemove.");
            setProjectDialog("message");
        } catch (error) {
            console.error("Could not save .lemove project.", error);
            setProjectDialogMessage(error.message || "The animation project could not be saved.");
        }
    };

    const restoreImageItems = async items => Promise.all((items || []).map(async item => {
        const image = item.imageData ? await restoreImage(item.imageData) : null;
        const { imageData, ...rest } = item;
        return { ...rest, ...(image ? { image } : {}) };
    }));

    const loadLemoveFile = async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        pendingProjectFileRef.current = file;
        setProjectDialogMessage("");
        setProjectDialog("load");
    };

    const importLemoveFile = async () => {
        const file = pendingProjectFileRef.current;
        if (!file) { setProjectDialogMessage("Choose a .lemove file first."); return; }
        try {
            const text = await file.text();
            let project;
            if (text.startsWith(LEMOVE_MAGIC)) {
                const envelope = JSON.parse(text.slice(LEMOVE_MAGIC.length));
                if (envelope?.format !== "LEM.CO Auto-Encrypted Animation" || envelope?.formatVersion !== 1) {
                    throw new Error("Unsupported .lemove file format.");
                }
                const key = await getLemoveKey();
                const decrypted = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: lemovBase64ToBytes(envelope.iv) },
                    key, lemovBase64ToBytes(envelope.encryptedData)
                );
                project = JSON.parse(new TextDecoder().decode(decrypted));
            } else {
                // Backward compatibility: accept Drawing Lab .lem projects and
                // wrap their canvas as the first frame of a new animation.
                let envelopeText = text.startsWith("LEMENC1\n") ? text.slice("LEMENC1\n".length) : text;
                let envelope = JSON.parse(envelopeText);
                if (envelope?.format === "LEM.CO Auto-Encrypted Drawing" && envelope?.formatVersion === 1) {
                    const key = await getLemoveKey();
                    const decrypted = await window.crypto.subtle.decrypt(
                        { name: "AES-GCM", iv: lemovBase64ToBytes(envelope.iv) },
                        key, lemovBase64ToBytes(envelope.encryptedData)
                    );
                    envelope = JSON.parse(new TextDecoder().decode(decrypted));
                }
                if (envelope?.format !== "LEM.CO Drawing Lab Project" || envelope?.formatVersion !== 1 || !envelope.canvas) {
                    throw new Error("Choose a .lemove animation or .lem drawing project.");
                }
                const canvas = envelope.canvas;
                project = {
                    format: "LEM.CO Animation Lab Project", formatVersion: 1,
                    activeFrameId: "frame-1", frameCounter: 1, playbackFps: 12,
                    onionSkinEnabled: true, showGrid: !!canvas.showGrid, color: canvas.color || "#222222",
                    frames: [{
                        id: "frame-1", name: "Frame 1", lines: canvas.lines || [],
                        objects: canvas.objects || [], fills: canvas.fills || [],
                        layers: canvas.layers || [{ id: "layer-1", name: "Layer 1", visible: true }],
                        layerGroups: canvas.layerGroups || [], activeLayerId: canvas.activeLayerId || "layer-1",
                        history: canvas.history || [], redoHistory: canvas.redoHistory || []
                    }]
                };
            }
            if (project?.format !== "LEM.CO Animation Lab Project" || project?.formatVersion !== 1 || !Array.isArray(project.frames) || !project.frames.length) {
                throw new Error("The decrypted file is not a valid Animation Lab project.");
            }
            const restoreHistoryStack = async stack => Promise.all((stack || []).map(async snapshot => ({
                ...snapshot,
                lines: Array.isArray(snapshot.lines) ? snapshot.lines : [],
                objects: (await restoreImageItems(snapshot.objects)).filter(item => item.type !== "image" || item.image),
                fills: (await restoreImageItems(snapshot.fills)).filter(item => item.image),
                layers: Array.isArray(snapshot.layers) ? snapshot.layers : [],
                layerGroups: Array.isArray(snapshot.layerGroups) ? snapshot.layerGroups : []
            })));
            const restoredFrames = await Promise.all(project.frames.map(async (frame, index) => ({
                ...frame,
                id: typeof frame.id === "string" ? frame.id : `frame-${index + 1}`,
                name: typeof frame.name === "string" ? frame.name : `Frame ${index + 1}`,
                lines: Array.isArray(frame.lines) ? frame.lines : [],
                objects: (await restoreImageItems(frame.objects)).filter(item => item.type !== "image" || item.image),
                fills: (await restoreImageItems(frame.fills)).filter(item => item.image),
                layers: Array.isArray(frame.layers) && frame.layers.length ? frame.layers : [{ id: `frame-${index + 1}-layer-1`, name: "Layer 1", visible: true }],
                layerGroups: Array.isArray(frame.layerGroups) ? frame.layerGroups : [],
                history: await restoreHistoryStack(frame.history),
                redoHistory: await restoreHistoryStack(frame.redoHistory)
            })));
            const targetId = restoredFrames.some(frame => frame.id === project.activeFrameId) ? project.activeFrameId : restoredFrames[0].id;
            const active = restoredFrames.find(frame => frame.id === targetId) || restoredFrames[0];

            setIsPlaying(false);
            setFrames(restoredFrames);
            setActiveFrameId(active.id);
            frameCounterRef.current = Math.max(Number(project.frameCounter) || restoredFrames.length, restoredFrames.length);
            setLines(active.lines);
            setObjects(active.objects);
            setFills(active.fills);
            setLayers(active.layers);
            setLayerGroups(active.layerGroups);
            setActiveLayerId(active.activeLayerId || active.layers[0]?.id || DEFAULT_LAYER_ID);
            setHistory(active.history);
            setRedoHistory(active.redoHistory);
            setSelectedElements([]);
            setSelectedLayerIds([]);
            if (typeof project.playbackFps === "number") setPlaybackFps(project.playbackFps);
            if (typeof project.onionSkinEnabled === "boolean") setOnionSkinEnabled(project.onionSkinEnabled);
            if (typeof project.showGrid === "boolean") setShowGrid(project.showGrid);
            if (typeof project.color === "string") setColor(project.color);
            pendingProjectFileRef.current = null;
            setProjectDialogMessage("Animation project loaded successfully.");
            setProjectDialog("message");
        } catch (error) {
            console.error("Could not load .lemove project.", error);
            setProjectDialogMessage(error.message || "Could not decrypt or load this .lemove file.");
        }
    };

    const exportAnimationVideo = async () => {
        // The first click opens the crop selector. The modal's confirmation button
        // invokes this function again with the selected crop.
        if (!exportSelection) {
            openExportSelection();
            return;
        }

        const stage = stageRef.current;
        if (!stage) {
            window.alert("The drawing canvas is not ready yet.");
            return;
        }
        if (frames.length < 1) {
            window.alert("Add at least one frame before exporting.");
            return;
        }
        if (typeof MediaRecorder === "undefined") {
            window.alert("Animation export is not supported by this browser. Try the latest version of Chrome or Edge.");
            return;
        }

        const crop = clampExportCrop(exportCrop);
        const originalFrameId = activeFrameId;
        const originalSnapshot = captureCurrentFrame();
        const previousShowGrid = showGrid;
        const previousOnionSkinEnabled = onionSkinEnabled;
        const selectionLayer = selectionUiLayerRef.current;
        const transformerLayer = transformerUiLayerRef.current;
        const gridLayer = gridLayerRef.current;
        const previousGridVisibility = gridLayer?.visible() ?? true;
        const previousSelectionVisibility = selectionLayer?.visible() ?? true;
        const previousTransformerVisibility = transformerLayer?.visible() ?? true;
        const previousScaleX = stage.scaleX();
        const previousScaleY = stage.scaleY();
        const previousPosition = stage.position();
        const width = Math.max(1, Math.round(crop.width));
        const height = Math.max(1, Math.round(crop.height));
        const fps = Math.max(1, Math.min(60, Number(playbackFps) || 12));
        const recordingCanvas = document.createElement("canvas");
        recordingCanvas.width = width;
        recordingCanvas.height = height;
        const context = recordingCanvas.getContext("2d");

        if (!context || typeof recordingCanvas.captureStream !== "function") {
            window.alert("This browser cannot record the animation canvas.");
            return;
        }

        let stream;
        let recorder;
        const chunks = [];

        try {
            setIsPlaying(false);
            // Hide grid and onion skin for the recording without changing the user's saved preferences.
            setShowGrid(false);
            setOnionSkinEnabled(false);
            selectionLayer?.visible(false);
            transformerLayer?.visible(false);
            gridLayer?.visible(false);
            stage.draw();
            setExportSelection(null);

            // Allow React/Konva to remove the editor-only layers before capturing frames.
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            stage.draw();

            // Manual frame submission gives each timeline frame the selected FPS interval.
            stream = recordingCanvas.captureStream(0);
            let videoTrack = stream.getVideoTracks()[0];
            const supportsManualFrames = typeof videoTrack?.requestFrame === "function";
            if (!supportsManualFrames) {
                stream.getTracks().forEach(track => track.stop());
                stream = recordingCanvas.captureStream(fps);
                videoTrack = stream.getVideoTracks()[0];
            }

            const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
                .find(type => MediaRecorder.isTypeSupported(type)) || "";
            recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            recorder.ondataavailable = event => {
                if (event.data && event.data.size > 0) chunks.push(event.data);
            };
            const recordingFinished = new Promise((resolve, reject) => {
                recorder.onstop = resolve;
                recorder.onerror = event => reject(event.error || new Error("Animation recording failed."));
            });
            recorder.start();
            const frameIntervalMs = 1000 / fps;
            const exportStartTime = performance.now();
            const exportFrames = frames.map(frame =>
                frame.id === originalFrameId ? { ...frame, ...originalSnapshot } : frame
            );

            for (let frameIndex = 0; frameIndex < exportFrames.length; frameIndex++) {
                const frame = exportFrames[frameIndex];
                setLines(frame.lines || []);
                setObjects(frame.objects || []);
                setFills(frame.fills || []);
                setLayers(frame.layers?.length ? frame.layers : [{ id: `${frame.id}-layer-1`, name: "Layer 1", visible: true }]);
                setActiveLayerId(frame.activeLayerId || frame.layers?.[0]?.id || `${frame.id}-layer-1`);
                setLayerGroups(frame.layerGroups || []);
                setHistory(frame.history || []);
                setRedoHistory(frame.redoHistory || []);
                setActiveFrameId(frame.id);

                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const currentStage = stageRef.current;
                if (!currentStage) continue;
                currentStage.draw();
                const frameCanvas = currentStage.toCanvas({
                    x: crop.x,
                    y: crop.y,
                    width: crop.width,
                    height: crop.height,
                    pixelRatio: 1
                });
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, width, height);
                context.drawImage(frameCanvas, 0, 0, width, height);
                if (supportsManualFrames) videoTrack.requestFrame();

                const targetTime = exportStartTime + (frameIndex + 1) * frameIntervalMs;
                const remaining = targetTime - performance.now();
                if (remaining > 0) await new Promise(resolve => window.setTimeout(resolve, remaining));
            }

            recorder.stop();
            await recordingFinished;
            const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
            if (!blob.size) throw new Error("The exported animation was empty.");

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `lemco-animation-${width}x${height}.webm`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            if (recorder && recorder.state !== "inactive") recorder.stop();
            console.error("Animation export failed:", error);
            window.alert("Could not export the animation. Please try again in Chrome or Edge.");
        } finally {
            // Return to the Drag / Select tool after an export attempt so the
            // canvas is immediately ready for repositioning or selecting artwork.
            setTool("select");
            setPendingInsert(null);
            setBrushMenuOpen(false);
            setFrames(previous => previous.map(frame =>
                frame.id === originalFrameId ? { ...frame, ...originalSnapshot } : frame
            ));
            setLines(originalSnapshot.lines || []);
            setObjects(originalSnapshot.objects || []);
            setFills(originalSnapshot.fills || []);
            setLayers(originalSnapshot.layers || []);
            setLayerGroups(originalSnapshot.layerGroups || []);
            setActiveLayerId(originalSnapshot.activeLayerId);
            setHistory(originalSnapshot.history || []);
            setRedoHistory(originalSnapshot.redoHistory || []);
            setActiveFrameId(originalFrameId);
            setShowGrid(previousShowGrid);
            setOnionSkinEnabled(previousOnionSkinEnabled);
            stage.scale({ x: previousScaleX, y: previousScaleY });
            stage.position(previousPosition);
            if (selectionLayer) selectionLayer.visible(previousSelectionVisibility);
            if (transformerLayer) transformerLayer.visible(previousTransformerVisibility);
            if (gridLayer) gridLayer.visible(previousGridVisibility);
            stage.draw();
            stream?.getTracks().forEach(track => track.stop());
        }
    };


    useEffect(() => {
        let cancelled = false;
        const restoreProject = async () => {
            try {
                const raw = localStorage.getItem(persistenceKey);
                if (raw) {
                    const saved = JSON.parse(raw);
                    const restoreObjects = async list => Promise.all((list || []).map(async object => ({
                        ...object,
                        ...(object.imageData ? { image: await restoreImage(object.imageData) } : {}),
                        imageData: undefined
                    })));
                    const restoreFills = async list => Promise.all((list || []).map(async fill => ({
                        ...fill,
                        image: await restoreImage(fill.imageData),
                        imageData: undefined
                    })));
                    const [restoredObjects, restoredFills] = await Promise.all([
                        restoreObjects(saved.objects),
                        restoreFills(saved.fills)
                    ]);
                    const restoreSnapshots = async snapshots => Promise.all((snapshots || []).map(async snapshot => ({
                        lines: (snapshot.lines || []).map(line => ({ ...line, points: [...(line.points || [])] })),
                        objects: (await restoreObjects(snapshot.objects)).filter(object => object.type !== "image" || object.image),
                        fills: (await restoreFills(snapshot.fills)).filter(fill => fill.image)
                    })));
                    if (cancelled) return;
                    setLines(Array.isArray(saved.lines) ? saved.lines : []);
                    setObjects(restoredObjects.filter(object => object.type !== "image" || object.image));
                    setFills(restoredFills.filter(fill => fill.image));
                    if (Array.isArray(saved.layers) && saved.layers.length) setLayers(saved.layers);
                    if (Array.isArray(saved.layerGroups)) setLayerGroups(saved.layerGroups);
                    if (saved.activeLayerId) setActiveLayerId(saved.activeLayerId);
                    if (typeof saved.referenceImage === "string") setReferenceImage(saved.referenceImage);
                    if (typeof saved.referenceWidth === "number") setReferenceWidth(saved.referenceWidth);
                    if (typeof saved.showGrid === "boolean") setShowGrid(saved.showGrid);
                    if (typeof saved.color === "string") setColor(saved.color);
                    setHistory(await restoreSnapshots(saved.history));
                    setRedoHistory(await restoreSnapshots(saved.redoHistory));
                }
            } catch (error) {
                console.warn("Drawing Lab could not restore its saved canvas.", error);
            } finally {
                if (!cancelled) persistenceReadyRef.current = true;
            }
        };
        restoreProject();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!persistenceReadyRef.current) return;
        const saveProject = async () => {
            try {
                const saved = {
                    version: 1,
                    lines,
                    objects: objects.map(object => {
                        const { image, ...rest } = object;
                        return { ...rest, ...(image ? { imageData: imageToDataUrl(image) } : {}) };
                    }),
                    fills: fills.map(fill => {
                        const { image, ...rest } = fill;
                        return { ...rest, imageData: imageToDataUrl(image) };
                    }),
                    history: history.map(snapshot => ({
                        lines: snapshot.lines,
                        objects: snapshot.objects.map(object => {
                            const { image, ...rest } = object;
                            return { ...rest, ...(image ? { imageData: imageToDataUrl(image) } : {}) };
                        }),
                        fills: (snapshot.fills || []).map(fill => {
                            const { image, ...rest } = fill;
                            return { ...rest, imageData: imageToDataUrl(image) };
                        })
                    })),
                    redoHistory: redoHistory.map(snapshot => ({
                        lines: snapshot.lines,
                        objects: snapshot.objects.map(object => {
                            const { image, ...rest } = object;
                            return { ...rest, ...(image ? { imageData: imageToDataUrl(image) } : {}) };
                        }),
                        fills: (snapshot.fills || []).map(fill => {
                            const { image, ...rest } = fill;
                            return { ...rest, imageData: imageToDataUrl(image) };
                        })
                    })),
                    layers,
                    layerGroups,
                    activeLayerId,
                    referenceImage,
                    referenceWidth,
                    showGrid,
                    color,
                    savedAt: Date.now()
                };
                localStorage.setItem(persistenceKey, JSON.stringify(saved));
            } catch (error) {
                console.warn("Drawing Lab could not save the canvas. Browser storage may be full.", error);
            }
        };
        saveProject();
    }, [lines, objects, fills, layers, layerGroups, activeLayerId, referenceImage, referenceWidth, showGrid, color, history, redoHistory]);


    // Native LEM project files are JSON documents with a .lem extension.
    // They preserve editable artwork, layers/groups, reference image, and undo/redo history.
    const serializeImageList = list => (list || []).map(item => {
        const { image, ...rest } = item;
        const imageData = imageToDataUrl(image);
        return { ...rest, ...(imageData ? { imageData } : {}) };
    });

    const serializeHistoryList = snapshots => (snapshots || []).map(snapshot => ({
        lines: snapshot.lines || [],
        objects: serializeImageList(snapshot.objects || []),
        fills: serializeImageList(snapshot.fills || [])
    }));

    const buildLemProject = () => ({
        format: "LEM.CO Drawing Lab Project",
        formatVersion: 1,
        createdWith: "LEM.CO Lab",
        savedAt: new Date().toISOString(),
        canvas: {
            lines,
            objects: serializeImageList(objects),
            fills: serializeImageList(fills),
            layers,
            layerGroups,
            activeLayerId,
            referenceImage,
            referenceWidth,
            showGrid,
            color,
            history: serializeHistoryList(history),
            redoHistory: serializeHistoryList(redoHistory)
        }
    });

    const LEM_ICON_URL = "https://raw.githubusercontent.com/nothinkformal/la-peace/refs/heads/version-4/images/lemon.png";

    // Automatic .lem payload encryption. This obscures project JSON in the save file
    // without asking the user for a password. Because this key ships with client code,
    // it is file-format obfuscation, not strong secrecy against a determined attacker.
    const LEM_AUTO_KEY_BYTES = new TextEncoder().encode("LEM.CO-Lab-Project-Format-Key-v1-2026");
    const getLemAutoKey = async () => {
        if (!window.crypto?.subtle) throw new Error("Automatic .lem encryption requires HTTPS or localhost.");
        const digest = await window.crypto.subtle.digest("SHA-256", LEM_AUTO_KEY_BYTES);
        return window.crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    };

    const bytesToBase64 = bytes => {
        let binary = "";
        bytes.forEach(byte => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    };

    const base64ToBytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

    const beginSaveLemFile = () => {
        setLemPassword("");
        setLemPasswordConfirm("");
        setLemDialogMessage("");
        setPendingLemFile(null);
        setLemDialog("save");
    };

    const beginLoadLemFile = () => {
        setLemPassword("");
        setLemPasswordConfirm("");
        setLemDialogMessage("");
        lemFileInputRef.current?.click();
    };

    const saveLemFile = async () => {
        try {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const key = await getLemAutoKey();
            const plaintext = new TextEncoder().encode(JSON.stringify(buildLemProject()));
            const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
            const envelope = {
                format: "LEM.CO Auto-Encrypted Drawing",
                formatVersion: 1,
                encryption: "AES-256-GCM",
                keyMode: "application-format-key-v1",
                iv: lemovBytesToBase64(iv),
                icon: LEM_ICON_URL,
                encryptedData: lemovBytesToBase64(new Uint8Array(encrypted))
            };
            const blob = new Blob(["LEMENC1\n", JSON.stringify(envelope)], { type: "application/x-lem-project" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "drawing.lem";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setLemDialogMessage("Encrypted .lem file saved successfully.");
            setLemDialog("message");
        } catch (error) {
            console.error("Could not save the encrypted .lem drawing file.", error);
            setLemDialogMessage(error.message || "The drawing could not be encrypted and saved.");
        }
    };

    const loadLemFile = async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setPendingLemFile(file);
        setLemPassword("");
        setLemPasswordConfirm("");
        setLemDialogMessage("");
        setLemDialog("load");
    };

    const decryptAndLoadLemFile = async () => {
        if (!pendingLemFile) {
            setLemDialogMessage("Choose a .lem file first.");
            return;
        }
        try {
            const fileText = await pendingLemFile.text();
            let envelopeText = fileText;
            if (fileText.startsWith("LEMENC1\n")) envelopeText = fileText.slice("LEMENC1\n".length);
            const envelope = JSON.parse(envelopeText);
            let parsed;
            if (envelope?.format === "LEM.CO Auto-Encrypted Drawing" && envelope?.formatVersion === 1) {
                const key = await getLemAutoKey();
                const decrypted = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: lemovBase64ToBytes(envelope.iv) },
                    key,
                    lemovBase64ToBytes(envelope.encryptedData)
                );
                parsed = JSON.parse(new TextDecoder().decode(decrypted));
            } else if (envelope?.format === "LEM.CO Encrypted Drawing" && envelope?.formatVersion === 1) {
                throw new Error("This .lem file uses the old password-protected format. Save it from the previous version as an unencrypted project first, then load and save it again here.");
            } else if (envelope?.format === "LEM.CO Drawing Lab Project" && envelope?.formatVersion === 1) {
                parsed = envelope;
            } else {
                throw new Error("This is not a supported .lem project file.");
            }
            if (parsed?.format !== "LEM.CO Drawing Lab Project" || parsed?.formatVersion !== 1 || !parsed.canvas) {
                throw new Error("This is not a supported .lem project file.");
            }
            const saved = parsed.canvas;
            const restoreImageList = async list => Promise.all((list || []).map(async item => {
                const image = item.imageData ? await restoreImage(item.imageData) : null;
                const { imageData, ...rest } = item;
                return { ...rest, ...(image ? { image } : {}) };
            }));
            const restoreSnapshots = async snapshots => Promise.all((snapshots || []).map(async snapshot => ({
                lines: (snapshot.lines || []).map(line => ({ ...line, points: [...(line.points || [])] })),
                objects: (await restoreImageList(snapshot.objects)).filter(object => object.type !== "image" || object.image),
                fills: (await restoreImageList(snapshot.fills)).filter(fill => fill.image)
            })));
            const [nextObjects, nextFills, nextHistory, nextRedoHistory] = await Promise.all([
                restoreImageList(saved.objects), restoreImageList(saved.fills),
                restoreSnapshots(saved.history), restoreSnapshots(saved.redoHistory)
            ]);

            // Clear the existing canvas only after the file has decrypted and validated.
            setLines([]); setObjects([]); setFills([]);
            setLayers([{ id: DEFAULT_LAYER_ID, name: "Layer 1", visible: true }]);
            setLayerGroups([]); setHistory([]); setRedoHistory([]); setSelectedLayerIds([]); setReferenceImage(null);
            setLines(Array.isArray(saved.lines) ? saved.lines : []);
            setObjects(nextObjects.filter(object => object.type !== "image" || object.image));
            setFills(nextFills.filter(fill => fill.image));
            if (Array.isArray(saved.layers) && saved.layers.length) setLayers(saved.layers);
            if (Array.isArray(saved.layerGroups)) setLayerGroups(saved.layerGroups);
            setActiveLayerId(saved.activeLayerId || DEFAULT_LAYER_ID);
            setReferenceImage(typeof saved.referenceImage === "string" ? saved.referenceImage : null);
            if (typeof saved.referenceWidth === "number") setReferenceWidth(saved.referenceWidth);
            if (typeof saved.showGrid === "boolean") setShowGrid(saved.showGrid);
            if (typeof saved.color === "string") setColor(saved.color);
            setHistory(nextHistory); setRedoHistory(nextRedoHistory); setSelectedLayerIds([]); setExportSelection(null);
            setPendingLemFile(null);
            setLemDialogMessage("Drawing loaded successfully.");
            setLemDialog("message");
        } catch (error) {
            console.error("Could not load the .lem drawing file.", error);
            setLemDialogMessage(error.message || "Could not decrypt or load this .lem file. Make sure the file is valid.");
        }
    };

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;

    const canvasWidth =
        Math.max(
            0,
            stageSize.width -
            (isMobile || referencePanelHidden ? 0 : referenceWidth)
        );



    
    
    
    
    
    

    useEffect(() => {

        setObjects(prev =>
            prev.map(object => ({
                ...object,

                layerId:
                    object.layerId ||
                    DEFAULT_LAYER_ID,

                rotation:
                    object.rotation || 0,

                scaleX:
                    object.scaleX || 1,

                scaleY:
                    object.scaleY || 1
            }))
        );

        setLines(prev =>
            prev.map(line => ({
                ...line,

                layerId:
                    line.layerId ||
                    DEFAULT_LAYER_ID,

                rotation:
                    line.rotation || 0,

                scaleX:
                    line.scaleX || 1,

                scaleY:
                    line.scaleY || 1
            }))
        );

    }, []);


    
    
    

    useEffect(() => {

        const handleWindowResize = () => {

            setStageSize({
                width: Math.max(320, window.innerWidth - (window.innerWidth <= 768 ? 0 : 195)),
                height: Math.max(240, window.innerHeight)
            });

            setIsMobile(
                window.innerWidth <= 768
            );

        };

        window.addEventListener(
            "resize",
            handleWindowResize
        );

        return () => {

            window.removeEventListener(
                "resize",
                handleWindowResize
            );

        };

    }, []);


    
    
    

    useEffect(() => {

        const handlePendingInsertEscape = e => {

            if (e.key === "Escape" && pendingInsert) {
                setPendingInsert(null);
                setTool("select");
                setSelectedElements([]);
            }

        };

        window.addEventListener(
            "keydown",
            handlePendingInsertEscape
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handlePendingInsertEscape
            );
        };

    }, [pendingInsert]);


    
    
    

    const makeKey =
        (type, index) =>
            `${type}-${index}`;


    const getItemLayerId =
        item =>
            item.layerId ||
            DEFAULT_LAYER_ID;


    const isSelected =
        (type, index) =>
            selectedElements.some(
                element =>
                    element.type === type &&
                    element.index === index
            );


    const getLayerById =
        id =>
            layers.find(
                layer =>
                    layer.id === id
            );


    
    
    

    const startResize = e => {

        e.preventDefault();

        setIsResizing(true);

    };


    useEffect(() => {

        if (!isResizing) {
            return;
        }

        const handleMouseMove = e => {

            const newWidth =
                window.innerWidth -
                e.clientX;

            setReferenceWidth(
                Math.min(
                    600,
                    Math.max(
                        220,
                        newWidth
                    )
                )
            );

        };


        const handleMouseUp = () => {

            setIsResizing(false);

        };


        window.addEventListener(
            "mousemove",
            handleMouseMove
        );

        window.addEventListener(
            "mouseup",
            handleMouseUp
        );


        return () => {

            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            window.removeEventListener(
                "mouseup",
                handleMouseUp
            );

        };

    }, [isResizing]);


    
    
    

    const handleReferenceUpload = e => {

        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {

            setReferenceImage(
                reader.result
            );

        };

        reader.readAsDataURL(file);

    };


    
    
    

    
    
    const saveHistory = () => {
        setHistory(prev => [
            ...prev,
            {
                lines: lines.map(line => ({ ...line, points: [...line.points] })),
                objects: objects.map(object => ({ ...object })),
                fills: fills.map(fill => ({ ...fill }))
            }
        ]);

        setRedoHistory([]);
    };


    const undo = () => {

        if (history.length === 0) {
            return;
        }

        const previous =
            history[history.length - 1];

        
        setRedoHistory(prev => [
            ...prev,
            {
                lines: lines.map(line => ({ ...line, points: [...line.points] })),
                objects: objects.map(object => ({ ...object })),
                fills: fills.map(fill => ({ ...fill }))
            }
        ]);

        setLines(
            previous.lines.map(line => ({ ...line, points: [...line.points] }))
        );

        setObjects(
            previous.objects.map(object => ({ ...object }))
        );

        setFills(
            previous.fills ? previous.fills.map(fill => ({ ...fill })) : []
        );

        setHistory(
            history.slice(0, -1)
        );

        setSelectedElements([]);

    };


    const redo = () => {

        if (redoHistory.length === 0) {
            return;
        }

        const next =
            redoHistory[redoHistory.length - 1];

        
        setHistory(prev => [
            ...prev,
            {
                lines: lines.map(line => ({ ...line, points: [...line.points] })),
                objects: objects.map(object => ({ ...object })),
                fills: fills.map(fill => ({ ...fill }))
            }
        ]);

        setLines(
            next.lines.map(line => ({ ...line, points: [...line.points] }))
        );

        setObjects(
            next.objects.map(object => ({ ...object }))
        );

        setFills(
            next.fills ? next.fills.map(fill => ({ ...fill })) : []
        );

        setRedoHistory(
            redoHistory.slice(0, -1)
        );

        setSelectedElements([]);

    };


    
    
    

    const createLayerGroup = () => {
        const memberIds = selectedLayerIds.filter(id =>
            layers.some(layer => layer.id === id) &&
            !layerGroups.some(group => group.layerIds.includes(id))
        );
        if (memberIds.length < 2) {
            window.alert("Select at least two layers to create a group.");
            return;
        }
        const id = `layer-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        let number = 1;
        while (layerGroups.some(group => group.name === `Group ${number}`)) number++;
        setLayerGroups(prev => [...prev, { id, name: `Group ${number}`, layerIds: memberIds, collapsed: false, visible: true }]);
        setSelectedLayerIds([]);
    };

    const toggleGroupCollapsed = groupId => setLayerGroups(prev => prev.map(group => group.id === groupId ? { ...group, collapsed: !group.collapsed } : group));
    const toggleGroupVisibility = groupId => {
        const group = layerGroups.find(item => item.id === groupId);
        if (!group) return;
        const nextVisible = !group.visible;
        setLayerGroups(prev => prev.map(item => item.id === groupId ? { ...item, visible: nextVisible } : item));
        setLayers(prev => prev.map(layer => group.layerIds.includes(layer.id) ? { ...layer, visible: nextVisible } : layer));
        if (!nextVisible && group.layerIds.includes(activeLayerId)) {
            const replacement = layers.find(layer => !group.layerIds.includes(layer.id) && layer.visible);
            if (replacement) setActiveLayerId(replacement.id);
        }
    };
    const startGroupRename = group => { setEditingGroupId(group.id); setEditingGroupName(group.name); };
    const finishGroupRename = () => {
        if (!editingGroupId) return;
        const name = editingGroupName.trim();
        if (name) setLayerGroups(prev => prev.map(group => group.id === editingGroupId ? { ...group, name } : group));
        setEditingGroupId(null);
    };
    const ungroupLayerGroup = groupId => {
        setLayerGroups(prev => prev.filter(group => group.id !== groupId));
        setLayers(prev => prev.map(layer => ({ ...layer, groupId: layer.groupId === groupId ? null : layer.groupId })));
    };
    const moveLayerGroup = (groupId, direction) => {
        const group = layerGroups.find(item => item.id === groupId);
        if (!group) return;
        const memberIds = new Set(group.layerIds);
        setLayers(prev => {
            const ordered = [...prev].reverse();
            const members = ordered.filter(layer => memberIds.has(layer.id));
            const rest = ordered.filter(layer => !memberIds.has(layer.id));
            const firstMemberIndex = Math.min(...ordered.map((layer, index) => memberIds.has(layer.id) ? index : Infinity));
            const targetIndex = Math.max(0, Math.min(rest.length, firstMemberIndex + direction));
            rest.splice(targetIndex, 0, ...members);
            return rest.reverse();
        });
    };
    const moveGroupToLayer = (groupId, targetLayerId, dropAbove) => {
        const group = layerGroups.find(item => item.id === groupId);
        if (!group || group.layerIds.includes(targetLayerId)) return;
        setLayers(prev => {
            const ordered = [...prev].reverse();
            const memberIds = new Set(group.layerIds);
            const members = ordered.filter(layer => memberIds.has(layer.id));
            const rest = ordered.filter(layer => !memberIds.has(layer.id));
            const targetIndex = rest.findIndex(layer => layer.id === targetLayerId);
            if (targetIndex < 0) return prev;
            rest.splice(targetIndex + (dropAbove ? 0 : 1), 0, ...members);
            return rest.reverse();
        });
    };
    const addLayerToGroup = (layerId, groupId) => {
        if (layerGroups.some(group => group.id !== groupId && group.layerIds.includes(layerId))) {
            setLayerGroups(prev => prev.map(group => group.id === groupId ? { ...group, layerIds: [...group.layerIds, layerId] } : { ...group, layerIds: group.layerIds.filter(id => id !== layerId) }));
        } else {
            setLayerGroups(prev => prev.map(group => group.id === groupId && !group.layerIds.includes(layerId) ? { ...group, layerIds: [...group.layerIds, layerId] } : group));
        }
        setLayerGroups(prev => prev.map(group => group.id === groupId ? { ...group, layerIds: [...new Set(group.layerIds)] } : group));
    };

    const addLayer = () => {

        let number = 1;

        while (
            layers.some(
                layer =>
                    layer.name ===
                    `Layer ${number}`
            )
        ) {

            number++;

        }


        const newLayer = {

            id:
                `layer-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 7)}`,

            name:
                `Layer ${number}`,

            visible:
                true

        };


        setLayers(prev => [
            ...prev,
            newLayer
        ]);

        setActiveLayerId(
            newLayer.id
        );

    };


    const deleteLayer =
        layerId => {

            if (
                layers.length <= 1
            ) {

                return;

            }


            const layer =
                getLayerById(
                    layerId
                );

            if (!layer) {
                return;
            }

            
            
            setLayerDeleteConfirm({
                layerId,
                layerName: layer.name
            });
        };


    const confirmDeleteLayer =
        () => {

            if (!layerDeleteConfirm) {
                return;
            }

            if (Array.isArray(layerDeleteConfirm.layerIds)) {
                const requestedIds = new Set(layerDeleteConfirm.layerIds);
                const matched = layers.filter(layer => requestedIds.has(layer.id));
                const deletable = matched.length >= layers.length ? matched.slice(0, layers.length - 1) : matched;
                const deleteIds = new Set(deletable.map(layer => layer.id));
                if (!deleteIds.size) { setLayerDeleteConfirm(null); return; }
                const remainingLayers = layers.filter(layer => !deleteIds.has(layer.id));
                setLayers(remainingLayers);
                setLayerGroups(prev => prev.map(group => ({ ...group, layerIds: group.layerIds.filter(id => !deleteIds.has(id)) })).filter(group => group.layerIds.length));
                setObjects(prev => prev.filter(item => !deleteIds.has(getItemLayerId(item))));
                setLines(prev => prev.filter(item => !deleteIds.has(getItemLayerId(item))));
                setFills(prev => prev.filter(item => !deleteIds.has(getItemLayerId(item))));
                setSelectedLayerIds(prev => prev.filter(id => !deleteIds.has(id)));
                setSelectedElements([]);
                if (deleteIds.has(activeLayerId)) {
                    const nextActive = remainingLayers.find(layer => layer.visible) || remainingLayers[0];
                    if (nextActive) setActiveLayerId(nextActive.id);
                }
                setLayerDeleteConfirm(null);
                return;
            }

            const layerId =
                layerDeleteConfirm.layerId;

            const layer =
                getLayerById(
                    layerId
                );

            if (!layer || layers.length <= 1) {
                setLayerDeleteConfirm(null);
                return;
            }

            const index =
                layers.findIndex(
                    item =>
                        item.id ===
                        layerId
                );


            setLayers(prev =>
                prev.filter(
                    item =>
                        item.id !==
                        layerId
                )
            );
            setLayerGroups(prev => prev.map(group => ({
                ...group,
                layerIds: group.layerIds.filter(id => id !== layerId)
            })).filter(group => group.layerIds.length > 0));
            setSelectedLayerIds(prev => prev.filter(id => id !== layerId));


            setObjects(prev =>
                prev.filter(
                    object =>
                        getItemLayerId(
                            object
                        ) !== layerId
                )
            );


            setLines(prev =>
                prev.filter(
                    line =>
                        getItemLayerId(
                            line
                        ) !== layerId
                )
            );


            setFills(prev =>
                prev.filter(
                    fill =>
                        getItemLayerId(
                            fill
                        ) !== layerId
                )
            );


            setSelectedElements(
                prev =>
                    prev.filter(
                        element => {

                            const item =
                                element.type ===
                                    "object"
                                    ? objects[
                                        element.index
                                    ]
                                    : lines[
                                        element.index
                                    ];

                            if (!item) {
                                return false;
                            }

                            return (
                                getItemLayerId(
                                    item
                                ) !==
                                layerId
                            );

                        }
                    )
            );


            if (
                activeLayerId ===
                layerId
            ) {

                const remaining =
                    layers.filter(
                        item =>
                            item.id !==
                            layerId
                    );

                const nextLayer =
                    remaining[
                        Math.min(
                            index,
                            remaining.length - 1
                        )
                    ];

                if (nextLayer) {

                    setActiveLayerId(
                        nextLayer.id
                    );

                }

            }

            setLayerDeleteConfirm(null);

        };


    const toggleLayerVisibility =
        layerId => {

            const layer =
                getLayerById(
                    layerId
                );

            if (!layer) {
                return;
            }


            const newVisible =
                !layer.visible;


            setLayers(prev =>
                prev.map(
                    item =>
                        item.id ===
                            layerId
                            ? {
                                ...item,
                                visible:
                                    newVisible
                            }
                            : item
                )
            );


            
            
            
            if (
                layerId ===
                    activeLayerId &&
                !newVisible
            ) {

                const replacement =
                    layers.find(
                        item =>
                            item.id !==
                                layerId &&
                            item.visible
                    );

                if (replacement) {

                    setActiveLayerId(
                        replacement.id
                    );

                }

                setSelectedElements(
                    prev =>
                        prev.filter(
                            element => {

                                const item =
                                    element.type ===
                                        "object"
                                        ? objects[
                                            element.index
                                        ]
                                        : lines[
                                            element.index
                                        ];

                                return (
                                    item &&
                                    getItemLayerId(
                                        item
                                    ) !==
                                    layerId
                                );

                            }
                        )
                );

            }

        };


    
    
    

    const startLayerRename =
        layer => {

            setEditingLayerId(
                layer.id
            );

            setEditingLayerName(
                layer.name
            );

        };


    const finishLayerRename = () => {

        if (
            !editingLayerId
        ) {
            return;
        }

        const trimmed =
            editingLayerName.trim();

        if (trimmed.length > 0) {

            setLayers(prev =>
                prev.map(
                    layer =>
                        layer.id ===
                            editingLayerId
                            ? {
                                ...layer,
                                name:
                                    trimmed
                            }
                            : layer
                )
            );

        }

        setEditingLayerId(
            null
        );

    };



    const handleLayerDragStart = (e, layerId) => {
        e.stopPropagation();
        // Drag the whole current selection when the dragged layer is selected.
        // Otherwise, start a single-layer drag and make it the selection.
        const movingIds = selectedLayerIds.includes(layerId)
            ? layers.filter(layer => selectedLayerIds.includes(layer.id)).map(layer => layer.id)
            : [layerId];
        setDraggedLayerIds(movingIds);
        setDraggedLayerId(layerId);
        setDraggedGroupId(null);
        if (!selectedLayerIds.includes(layerId)) setSelectedLayerIds([layerId]);
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", movingIds.join(",")); } catch {}
    };

    const handleLayerDragEnd = () => {
        setDraggedLayerId(null);
        setDraggedLayerIds([]);
    };

    const handleLayerDragOver = e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleLayerDrop = (e, targetLayerId) => {
        e.preventDefault();
        e.stopPropagation();
        const movingIds = (draggedLayerIds.length ? draggedLayerIds : [draggedLayerId])
            .filter(Boolean);
        if (!movingIds.length || movingIds.includes(targetLayerId)) {
            handleLayerDragEnd();
            return;
        }

        const displayOrder = [...layers].reverse();
        const targetIndexBefore = displayOrder.findIndex(layer => layer.id === targetLayerId);
        if (targetIndexBefore < 0) { handleLayerDragEnd(); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        const dropAbove = e.clientY < rect.top + rect.height / 2;
        const movingSet = new Set(movingIds);
        const movingLayers = displayOrder.filter(layer => movingSet.has(layer.id));
        const remaining = displayOrder.filter(layer => !movingSet.has(layer.id));
        const remainingTargetIndex = remaining.findIndex(layer => layer.id === targetLayerId);
        if (remainingTargetIndex < 0) { handleLayerDragEnd(); return; }
        remaining.splice(remainingTargetIndex + (dropAbove ? 0 : 1), 0, ...movingLayers);
        setLayers(remaining.reverse());

        // Keep group membership consistent for every dragged layer.
        const targetGroup = layerGroups.find(group => group.layerIds.includes(targetLayerId));
        setLayerGroups(prev => {
            let next = prev.map(group => ({ ...group, layerIds: group.layerIds.filter(id => !movingSet.has(id)) }));
            if (targetGroup) {
                next = next.map(group => group.id === targetGroup.id
                    ? { ...group, layerIds: [...new Set([...group.layerIds, ...movingIds])] }
                    : group);
            }
            return next.filter(group => group.layerIds.length > 0);
        });
        handleLayerDragEnd();
    };


        const getPointerPosition = () => {

        const stage =
            stageRef.current;

        if (!stage) {
            return null;
        }

        
        
        return stage.getRelativePointerPosition();

    };


    // Paint-bucket / flood-fill tool.
    //
    // The important detail here is that the flood fill must be calculated
    // in WORLD coordinates, not the currently zoomed viewport. We therefore
    // temporarily render the stage at scale 1 / position 0, perform the
    // flood fill there, and then restore the user's zoom and pan exactly.
    //
    // A fill that reaches the edge of the drawable canvas is rejected. This
    // prevents a click on the empty white canvas from flooding the entire
    // drawing.
    const floodFillRegion = (
        canvas,
        startX,
        startY,
        fillColor
    ) => {
        const width = canvas.width;
        const height = canvas.height;

        if (!width || !height) {
            return null;
        }

        const x = Math.floor(startX);
        const y = Math.floor(startY);

        if (x < 0 || y < 0 || x >= width || y >= height) {
            return null;
        }

        const context = canvas.getContext("2d", {
            willReadFrequently: true
        });

        if (!context) {
            return null;
        }

        const imageData = context.getImageData(
            0,
            0,
            width,
            height
        );

        const data = imageData.data;
        const startIndex = (y * width + x) * 4;

        const targetR = data[startIndex];
        const targetG = data[startIndex + 1];
        const targetB = data[startIndex + 2];
        const targetA = data[startIndex + 3];

        if (targetA < 240) {
            return null;
        }

        // Read the selected colour through a canvas so named colours and
        // hex/rgb values are all handled consistently by the browser.
        const colourCanvas = document.createElement("canvas");
        colourCanvas.width = 1;
        colourCanvas.height = 1;
        const colourContext = colourCanvas.getContext("2d");

        if (!colourContext) {
            return null;
        }

        colourContext.fillStyle = fillColor;
        colourContext.fillRect(0, 0, 1, 1);

        const fillPixel = colourContext
            .getImageData(0, 0, 1, 1)
            .data;

        const fillR = fillPixel[0];
        const fillG = fillPixel[1];
        const fillB = fillPixel[2];
        const fillA = 255;

        // Clicking an area that is already the selected colour should do
        // nothing rather than creating another fill image.
        if (
            Math.abs(targetR - fillR) <= 2 &&
            Math.abs(targetG - fillG) <= 2 &&
            Math.abs(targetB - fillB) <= 2
        ) {
            return null;
        }

        /*
         * Use a normal 4-neighbour flood fill with an indexed queue.
         * The previous scan-line implementation could lose neighbouring
         * spans around anti-aliased edges, which made legitimate enclosed
         * regions fail completely.
         */
        const targetIsLight =
            targetR >= 235 &&
            targetG >= 235 &&
            targetB >= 235;

        // White/near-white drawing areas need enough tolerance to cross the
        // tiny anti-aliased variations inside a region, but not enough to
        // cross a dark outline.
        const tolerance = targetIsLight ? 42 : 32;
        const alphaTolerance = 24;

        const matchesTarget = pixelIndex => {
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            const a = data[pixelIndex + 3];

            if (a < 240 || Math.abs(a - targetA) > alphaTolerance) {
                return false;
            }

            return (
                Math.abs(r - targetR) <= tolerance &&
                Math.abs(g - targetG) <= tolerance &&
                Math.abs(b - targetB) <= tolerance
            );
        };

        if (!matchesTarget(startIndex)) {
            return null;
        }

        const pixelCount = width * height;
        const visited = new Uint8Array(pixelCount);
        const queue = new Int32Array(pixelCount);

        let head = 0;
        let tail = 0;

        const startPixel = y * width + x;
        queue[tail++] = startPixel;
        visited[startPixel] = 1;

        let minX = x;
        let minY = y;
        let maxX = x;
        let maxY = y;
        let filledPixels = 0;
        let touchesBoundary = false;

        while (head < tail) {
            const pixel = queue[head++];
            const px = pixel % width;
            const py = Math.floor(pixel / width);

            filledPixels++;

            if (
                px === 0 ||
                py === 0 ||
                px === width - 1 ||
                py === height - 1
            ) {
                touchesBoundary = true;
            }

            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;

            const left = pixel - 1;
            const right = pixel + 1;
            const up = pixel - width;
            const down = pixel + width;

            if (
                px > 0 &&
                !visited[left] &&
                matchesTarget(left * 4)
            ) {
                visited[left] = 1;
                queue[tail++] = left;
            }

            if (
                px < width - 1 &&
                !visited[right] &&
                matchesTarget(right * 4)
            ) {
                visited[right] = 1;
                queue[tail++] = right;
            }

            if (
                py > 0 &&
                !visited[up] &&
                matchesTarget(up * 4)
            ) {
                visited[up] = 1;
                queue[tail++] = up;
            }

            if (
                py < height - 1 &&
                !visited[down] &&
                matchesTarget(down * 4)
            ) {
                visited[down] = 1;
                queue[tail++] = down;
            }
        }

        // If the selected colour region reaches the edge, it is the open
        // canvas rather than an enclosed bucket area. Reject it so a click
        // on empty canvas can never colour the whole drawing.
        if (touchesBoundary || filledPixels === 0) {
            return null;
        }

        // Keep the safety check, but allow genuinely large enclosed rooms.
        if (filledPixels / pixelCount > 0.90) {
            return null;
        }

        const padding = 2;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(width - 1, maxX + padding);
        maxY = Math.min(height - 1, maxY + padding);

        const patchWidth = maxX - minX + 1;
        const patchHeight = maxY - minY + 1;

        const patchCanvas = document.createElement("canvas");
        patchCanvas.width = patchWidth;
        patchCanvas.height = patchHeight;

        const patchContext = patchCanvas.getContext("2d");
        if (!patchContext) {
            return null;
        }

        const patchData = patchContext.createImageData(
            patchWidth,
            patchHeight
        );

        for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
                const sourcePixel = py * width + px;

                if (!visited[sourcePixel]) {
                    continue;
                }

                const patchIndex =
                    ((py - minY) * patchWidth + (px - minX)) * 4;

                patchData.data[patchIndex] = fillR;
                patchData.data[patchIndex + 1] = fillG;
                patchData.data[patchIndex + 2] = fillB;
                patchData.data[patchIndex + 3] = fillA;
            }
        }

        patchContext.putImageData(patchData, 0, 0);

        return {
            x: minX,
            y: minY,
            width: patchWidth,
            height: patchHeight,
            dataUrl: patchCanvas.toDataURL("image/png")
        };
    };


    const performFill = () => {

        const stage = stageRef.current;

        if (!stage) {
            return;
        }

        const screenPointer = stage.getPointerPosition();
        if (!screenPointer) return;

        // Convert the screen pointer to canvas/world coordinates before either
        // vector hit-testing or raster flood filling. This keeps fill working
        // while the canvas is zoomed or panned.
        const position = stage.getRelativePointerPosition();
        if (!position) return;

        // Prefer recolouring a vector shape directly when the click lands on
        // one. This avoids raster flood-fill leaks through anti-aliased edges.
        // Fill mode never selects or drags the hit element.
        const hitNode = stage.getIntersection(screenPointer);
        let currentHit = hitNode;
        let hitObjectIndex = -1;

        while (currentHit && hitObjectIndex < 0) {
            for (let i = 0; i < objects.length; i++) {
                if (nodeRefs.current[makeKey("object", i)] === currentHit) {
                    hitObjectIndex = i;
                    break;
                }
            }
            currentHit = currentHit.getParent ? currentHit.getParent() : null;
        }

        if (hitObjectIndex >= 0) {
            const hitObject = objects[hitObjectIndex];
            const nonFillableTypes = ["text", "note", "image"];
            if (hitObject && !nonFillableTypes.includes(hitObject.type)) {
                saveHistory();
                setObjects(prev => prev.map((object, index) =>
                    index === hitObjectIndex
                        ? { ...object, fill: color }
                        : object
                ));
                setSelectedElements([]);
                return;
            }
        }

        const stageWidth = Math.ceil(stage.width());
        const stageHeight = Math.ceil(stage.height());

        if (
            position.x < 0 ||
            position.y < 0 ||
            position.x >= stageWidth ||
            position.y >= stageHeight
        ) {
            return;
        }

        const selectionLayer = selectionUiLayerRef.current;
        const transformerLayer = transformerUiLayerRef.current;
        const gridLayer = gridLayerRef.current;

        const selectionVisible =
            selectionLayer?.visible() ?? true;
        const transformerVisible =
            transformerLayer?.visible() ?? true;
        const gridVisible =
            gridLayer?.visible() ?? false;

        const oldScaleX = stage.scaleX();
        const oldScaleY = stage.scaleY();
        const oldPosition = stage.position();

        selectionLayer?.visible(false);
        transformerLayer?.visible(false);
        gridLayer?.visible(false);

        let renderedCanvas = null;

        try {
            /*
               Always render in world space at a fixed pixel ratio.
               The user's zoom and pan therefore have zero influence on the
               flood-fill sampling or on the resulting fill coordinates.
            */
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: 0, y: 0 });
            stage.batchDraw();

            renderedCanvas = stage.toCanvas({
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight,
                pixelRatio: 1
            });
        } finally {
            stage.scale({
                x: oldScaleX,
                y: oldScaleY
            });

            stage.position(oldPosition);

            selectionLayer?.visible(selectionVisible);
            transformerLayer?.visible(transformerVisible);
            gridLayer?.visible(gridVisible);

            stage.batchDraw();
        }

        if (!renderedCanvas) {
            return;
        }

        // Konva exports transparent pixels outside strokes. Flood-fill was
        // rejecting those pixels because their alpha was below 240, so enclosed
        // spaces between drawn lines could not be filled. Composite onto white
        // first: this matches the editor's white paper and gives the bucket a
        // stable, opaque surface to sample.
        const fillSurface = document.createElement("canvas");
        fillSurface.width = stageWidth;
        fillSurface.height = stageHeight;
        const fillSurfaceContext = fillSurface.getContext("2d", {
            willReadFrequently: true
        });
        if (!fillSurfaceContext) return;
        fillSurfaceContext.fillStyle = "#ffffff";
        fillSurfaceContext.fillRect(0, 0, stageWidth, stageHeight);
        fillSurfaceContext.drawImage(renderedCanvas, 0, 0);

        const result = floodFillRegion(
            fillSurface,
            position.x,
            position.y,
            color
        );

        if (!result) {
            return;
        }

        const image = new window.Image();

        image.onload = () => {
            saveHistory();

            setFills(prev => [
                ...prev,
                {
                    type: "fill",
                    x: result.x,
                    y: result.y,
                    width: result.width,
                    height: result.height,
                    image,
                    layerId: activeLayerId
                }
            ]);

            setSelectedElements([]);
        };

        image.src = result.dataUrl;
    };

    const zoomCanvas = (newScale, focalPoint = null) => {

        const stage = stageRef.current;

        if (!stage) return;

        const oldScale = zoom;
        const clampedScale = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, newScale)
        );

        if (clampedScale === oldScale) return;

        const pointer = focalPoint || {
            x: Math.max(0, stage.width()) / 2,
            y: Math.max(0, stage.height()) / 2
        };

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale
        };

        stage.scale({
            x: clampedScale,
            y: clampedScale
        });

        stage.position({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale
        });

        setZoom(clampedScale);

    };


    const handleStageWheel = e => {

        e.evt.preventDefault();
        e.evt.stopPropagation();

        const stage = stageRef.current;

        if (!stage) return;

        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const factor = direction > 0 ? 1.1 : 1 / 1.1;

        zoomCanvas(zoom * factor, pointer);

    };


    const eraseAtPosition =
        (pos, previousPos = null) => {

            if (!pos) return;

            const stage = stageRef.current;
            if (!stage) return;

            const stageTransform =
                stage.getAbsoluteTransform().copy();

            const currentAbsolute =
                stageTransform.point(pos);

            const previousAbsolute =
                previousPos
                    ? stageTransform.point(previousPos)
                    : currentAbsolute;

            const stageScale =
                Math.max(
                    0.0001,
                    Math.abs(stage.scaleX() || 1)
                );

            const eraserRadius =
                Math.max(
                    8,
                    brushSize * 0.85
                ) * stageScale;

            const pointToSegmentDistance =
                (px, py, ax, ay, bx, by) => {

                    const abX = bx - ax;
                    const abY = by - ay;
                    const apX = px - ax;
                    const apY = py - ay;

                    const lengthSquared =
                        abX * abX +
                        abY * abY;

                    if (lengthSquared === 0) {
                        return Math.hypot(
                            px - ax,
                            py - ay
                        );
                    }

                    const t =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                (
                                    apX * abX +
                                    apY * abY
                                ) / lengthSquared
                            )
                        );

                    return Math.hypot(
                        px -
                            (ax + abX * t),
                        py -
                            (ay + abY * t)
                    );
                };

            const distanceToEraserPath =
                point => {

                    return pointToSegmentDistance(
                        point.x,
                        point.y,
                        previousAbsolute.x,
                        previousAbsolute.y,
                        currentAbsolute.x,
                        currentAbsolute.y
                    );
                };
            const getErasedInterval =
                (a, b, radius) => {

                    const distanceAt =
                        t => {

                            const point = {
                                x:
                                    a.x +
                                    (b.x - a.x) * t,
                                y:
                                    a.y +
                                    (b.y - a.y) * t
                            };

                            return distanceToEraserPath(
                                point
                            );
                        };

                    const threshold = radius;

                    const startInside =
                        distanceAt(0) <= threshold;

                    const endInside =
                        distanceAt(1) <= threshold;

                    let low = 0;
                    let high = 1;

                    for (
                        let i = 0;
                        i < 18;
                        i++
                    ) {

                        const left =
                            low +
                            (high - low) / 3;

                        const right =
                            high -
                            (high - low) / 3;

                        if (
                            distanceAt(left) <
                            distanceAt(right)
                        ) {
                            high = right;
                        } else {
                            low = left;
                        }
                    }

                    const minimumT =
                        (low + high) / 2;

                    if (
                        distanceAt(minimumT) >
                        threshold
                    ) {
                        return null;
                    }

                    const findBoundary =
                        (
                            leftStart,
                            rightStart,
                            boundaryIsInside
                        ) => {

                            let left = leftStart;
                            let right = rightStart;

                            for (
                                let i = 0;
                                i < 24;
                                i++
                            ) {

                                const middle =
                                    (left + right) / 2;

                                const inside =
                                    distanceAt(
                                        middle
                                    ) <= threshold;

                                if (
                                    inside ===
                                    boundaryIsInside
                                ) {
                                    right = middle;
                                } else {
                                    left = middle;
                                }
                            }

                            return (
                                left +
                                right
                            ) / 2;
                        };

                    let entry = 0;
                    let exit = 1;

                    if (!startInside) {
                        entry =
                            findBoundary(
                                0,
                                minimumT,
                                true
                            );
                    }

                    if (!endInside) {
                        exit =
                            findBoundary(
                                minimumT,
                                1,
                                false
                            );
                    }

                    return {
                        entry:
                            Math.max(
                                0,
                                Math.min(1, entry)
                            ),
                        exit:
                            Math.max(
                                0,
                                Math.min(1, exit)
                            )
                    };
                };

            let anythingChanged = false;
            const nextLines = [];

            lines.forEach(
                (line, index) => {

                    if (
                        getItemLayerId(line) !==
                        activeLayerId
                    ) {
                        nextLines.push(line);
                        return;
                    }

                    const layer =
                        getLayerById(
                            getItemLayerId(line)
                        );

                    if (
                        !layer ||
                        !layer.visible
                    ) {
                        nextLines.push(line);
                        return;
                    }

                    const node =
                        nodeRefs.current[
                            makeKey(
                                "line",
                                index
                            )
                        ];

                    if (
                        !node ||
                        line.points.length < 4
                    ) {
                        nextLines.push(line);
                        return;
                    }

                    const points = line.points;
                    const transform =
                        node.getAbsoluteTransform();

                    const lineScale =
                        Math.max(
                            Math.abs(
                                node.scaleX() || 1
                            ),
                            Math.abs(
                                node.scaleY() || 1
                            )
                        );

                    const effectiveRadius =
                        eraserRadius +
                        Math.max(
                            0,
                            (
                                line.strokeWidth ||
                                1
                            ) *
                            lineScale /
                            2
                        ) +
                        (2 * stageScale);

                    const pieces = [];
                    let currentPiece = [];
                    let lineChanged = false;

                    const addLocalPoint =
                        (x, y) => {

                            if (
                                currentPiece.length === 0
                            ) {
                                currentPiece.push(
                                    x,
                                    y
                                );
                                return;
                            }

                            const previousX =
                                currentPiece[
                                    currentPiece.length - 2
                                ];

                            const previousY =
                                currentPiece[
                                    currentPiece.length - 1
                                ];

                            if (
                                Math.hypot(
                                    x - previousX,
                                    y - previousY
                                ) > 0.001
                            ) {
                                currentPiece.push(
                                    x,
                                    y
                                );
                            }
                        };

                    const finishPiece =
                        () => {

                            if (
                                currentPiece.length >= 4
                            ) {
                                pieces.push(
                                    currentPiece
                                );
                            }

                            currentPiece = [];
                        };

                    for (
                        let i = 0;
                        i < points.length - 2;
                        i += 2
                    ) {

                        const ax = points[i];
                        const ay = points[i + 1];
                        const bx = points[i + 2];
                        const by = points[i + 3];

                        const absoluteA =
                            transform.point({
                                x: ax,
                                y: ay
                            });

                        const absoluteB =
                            transform.point({
                                x: bx,
                                y: by
                            });

                        const erased =
                            getErasedInterval(
                                absoluteA,
                                absoluteB,
                                effectiveRadius
                            );

                        if (!erased) {

                            addLocalPoint(
                                ax,
                                ay
                            );

                            addLocalPoint(
                                bx,
                                by
                            );

                            continue;
                        }

                        lineChanged = true;
                        anythingChanged = true;
						
                        if (
                            erased.entry > 0
                        ) {

                            addLocalPoint(
                                ax,
                                ay
                            );

                            addLocalPoint(
                                ax +
                                    (bx - ax) *
                                    erased.entry,
                                ay +
                                    (by - ay) *
                                    erased.entry
                            );

                            finishPiece();

                        } else {
                            finishPiece();
                        }
						
                        if (
                            erased.exit < 1
                        ) {

                            addLocalPoint(
                                ax +
                                    (bx - ax) *
                                    erased.exit,
                                ay +
                                    (by - ay) *
                                    erased.exit
                            );

                            addLocalPoint(
                                bx,
                                by
                            );

                        } else {
                            finishPiece();
                        }
                    }

                    finishPiece();

                    if (!lineChanged) {
                        nextLines.push(line);
                        return;
                    }

                    pieces.forEach(
                        piece => {

                            if (
                                piece.length >= 4
                            ) {
                                nextLines.push({
                                    ...line,
                                    points: piece
                                });
                            }
                        }
                    );
                }
            );

            if (!anythingChanged) return;

            setLines(nextLines);
            setSelectedElements([]);
            transformerRef.current?.nodes([]);
            nodeRefs.current = {};
        };


    const getDrawingTargetLayerId = () => {
            const firstSelectedLayer = selectedLayerIds
                .map(id => layers.find(layer => layer.id === id))
                .find(layer => layer && layer.visible);
            return firstSelectedLayer ? firstSelectedLayer.id : activeLayerId;
        };

    const startFreehandDrawing =
        () => {

            if (
                tool !== "pen" &&
                tool !== "eraser"
            ) {
                return;
            }

            const drawingLayerId = getDrawingTargetLayerId();
            const activeLayer = getLayerById(drawingLayerId);

            if (!activeLayer || !activeLayer.visible) {
                return;
            }
            if (drawingLayerId !== activeLayerId) setActiveLayerId(drawingLayerId);

            const pos =
                getPointerPosition();

            if (!pos) {
                return;
            }

            saveHistory();
            setIsDrawing(true);

            if (tool === "eraser") {
                eraserPreviousPositionRef.current =
                    pos;

                eraseAtPosition(
                    pos,
                    pos
                );

                return;
            }

            const newLine = {

                layerId:
                    getDrawingTargetLayerId(),

                points: [
                    pos.x,
                    pos.y,
                    pos.x + 0.01,
                    pos.y + 0.01
                ],

                stroke:
                    color,

                strokeWidth:
                    brushSize,

                brushType:
                    brushType,

                globalCompositeOperation:
                    "source-over",

                lineCap:
                    "round",

                lineJoin:
                    "round",

                tension:
                    0.45,

                x: 0,
                y: 0,

                scaleX: 1,
                scaleY: 1,

                rotation: 0

            };


            setLines(prev => [
                ...prev,
                newLine
            ]);

        };


    const draw = (pointer = null) => {

        if (!isDrawing) {
            return;
        }

        if (
            tool !== "pen" &&
            tool !== "eraser"
        ) {
            return;
        }

        const pos =
            pointer ||
            getPointerPosition();

        if (!pos) {
            return;
        }

        if (tool === "eraser") {
            const previous =
                eraserPreviousPositionRef.current ||
                pos;

            eraseAtPosition(
                pos,
                previous
            );

            eraserPreviousPositionRef.current =
                pos;

            return;
        }

        setLines(prev => {

            if (
                prev.length === 0
            ) {
                return prev;
            }

            const lastIndex =
                prev.length - 1;

            const last =
                prev[lastIndex];

            const points =
                last.points;

            const lastX =
                points[points.length - 2];

            const lastY =
                points[points.length - 1];

            const dx =
                pos.x - lastX;

            const dy =
                pos.y - lastY;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (distance < 1.2) {
                return prev;
            }

            const newPoints = [
                ...points,
                pos.x,
                pos.y
            ];

            return [
                ...prev.slice(0, lastIndex),
                {
                    ...last,
                    points: newPoints
                }
            ];

        });

    };


    const stopDrawing = () => {

        if (!isDrawing) {
            return;
        }

        setIsDrawing(false);

        eraserPreviousPositionRef.current =
            null;

    };


    const getScreenPosition = (x, y) => {

        const stage = stageRef.current;

        if (!stage) {
            return { x, y };
        }

        const rect =
            stage.container().getBoundingClientRect();

        return {
            x: rect.left + stage.x() + x * stage.scaleX(),
            y: rect.top + stage.y() + y * stage.scaleY()
        };

    };


    
    
    
    const getSelectionTransparency = selection => {

        if (!selection?.length) {
            return 0;
        }

        const first = selection[0];
        let opacity = 1;

        if (first.type === "line") {
            opacity = lines[first.index]?.opacity ?? 1;
        } else if (first.type === "object") {
            opacity = objects[first.index]?.opacity ?? 1;
        }

        return Math.max(0, Math.min(1, 1 - opacity));
    };


    const openContextMenuForSelection = (x, y, selection) => {
        setTransparencyDraft(getSelectionTransparency(selection));
        setLayerContextMenu({ x, y, selection });
    };


    const handleEditingContextMenu = (type, index, e) => {

        e.preventDefault();
        e.stopPropagation();

        const selection = [{
            type: "object",
            index
        }];

        setSelectedElements(selection);

        openContextMenuForSelection(
            e.clientX,
            e.clientY,
            selection
        );

    };


    
    
    

    const handleElementContextMenu = (type, index, e) => {

        e.evt.preventDefault();
        e.cancelBubble = true;

        if (tool === "pen") {
            setLayerContextMenu(null);
            setRecolorPickerOpen(false);
            return;
        }

        let selection = selectedElements;

        
        
        
        if (!isSelected(type, index)) {
            selection = [{ type, index }];
            setSelectedElements(selection);
        }

        openContextMenuForSelection(
            e.evt.clientX,
            e.evt.clientY,
            selection
        );
    };

    const handleStageContextMenu = e => {
        e.evt.preventDefault();
        if (tool === "pen") {
            setLayerContextMenu(null);
            setRecolorPickerOpen(false);
            return;
        }
        isRightPanning.current = false;
        lastPanPointer.current = null;

        if (selectedElements.length === 0) {
            setLayerContextMenu(null);
            return;
        }

        openContextMenuForSelection(
            e.evt.clientX,
            e.evt.clientY,
            selectedElements
        );
    };


    
    
    
    const handleTransformerContextMenu = e => {

        e.evt.preventDefault();
        e.cancelBubble = true;

        if (selectedElements.length === 0) {
            return;
        }

        openContextMenuForSelection(
            e.evt.clientX,
            e.evt.clientY,
            selectedElements
        );

    };

    const moveSelectedToLayer = layerId => {

        if (!layerId || !layerContextMenu?.selection?.length) {
            return;
        }

        saveHistory();

        const selection = layerContextMenu.selection;

        setObjects(prev =>
            prev.map((object, index) =>
                selection.some(
                    element =>
                        element.type === "object" &&
                        element.index === index
                )
                    ? { ...object, layerId }
                    : object
            )
        );

        setLines(prev =>
            prev.map((line, index) =>
                selection.some(
                    element =>
                        element.type === "line" &&
                        element.index === index
                )
                    ? { ...line, layerId }
                    : line
            )
        );

        setActiveLayerId(layerId);
        setRecolorPickerOpen(false);
        setLayerContextMenu(null);
    };

    const openMobileLayerMenu = () => {

        if (
            selectedElements.length ===
            0
        ) {
            return;
        }

        openContextMenuForSelection(
            Math.max(
                12,
                window.innerWidth / 2 - 110
            ),
            Math.max(
                12,
                window.innerHeight / 2 - 130
            ),
            selectedElements
        );

    };


    const closeLayerContextMenu = () => {
        setLayerContextMenu(null);
        setRecolorPickerOpen(false);
    };


    const recolorSelectedElements = newColor => {

        if (!newColor || !selectedElements.length) {
            return;
        }

        saveHistory();

        setLines(prev =>
            prev.map((line, index) =>
                selectedElements.some(
                    element =>
                        element.type === "line" &&
                        element.index === index
                )
                    ? { ...line, stroke: newColor }
                    : line
            )
        );

        setObjects(prev =>
            prev.map((object, index) => {
                const selected = selectedElements.some(
                    element => element.type === "object" && element.index === index
                );
                if (!selected) return object;

                if (object.type === "text") {
                    return { ...object, fill: newColor };
                }

                // Shape color controls the outline; filled shapes also get their
                // interior recolored. Transparent interiors stay transparent.
                const hasFill = object.fill && object.fill !== "transparent";
                return {
                    ...object,
                    stroke: newColor,
                    ...(hasFill ? { fill: newColor } : {})
                };
            })
        );
    };


    const openRecolorPicker = () => {
        setRecolorDraftColor(color);
        setRecolorPickerOpen(true);
    };


    const finishRecolor = () => {
        if (!recolorDraftColor || !selectedElements.length) {
            return;
        }

        recolorSelectedElements(recolorDraftColor);
        setRecolorPickerOpen(false);
        setLayerContextMenu(null);
    };


    const finishTransparency = () => {
        if (!selectedElements.length) {
            return;
        }

        const nextOpacity =
            Math.max(0, Math.min(1, 1 - transparencyDraft));

        saveHistory();

        setLines(prev =>
            prev.map((line, index) =>
                selectedElements.some(
                    element =>
                        element.type === "line" &&
                        element.index === index
                )
                    ? { ...line, opacity: nextOpacity }
                    : line
            )
        );

        setObjects(prev =>
            prev.map((object, index) =>
                selectedElements.some(
                    element =>
                        element.type === "object" &&
                        element.index === index
                )
                    ? { ...object, opacity: nextOpacity }
                    : object
            )
        );

        setLayerContextMenu(null);
    };

    
    
    

const handleElementMouseDown =
    (type, index, e) => {

        if (tool === "pen" && e.evt?.button === 2) {
            e.evt.preventDefault();
            e.cancelBubble = true;
            return;
        }

        if (e.evt?.button === 2) {
            if (
                tool === "select" ||
                tool === "pen" ||
                tool === "eraser" ||
                tool === "fill"
            ) {
                e.evt.preventDefault();
                e.cancelBubble = true;

                isRightPanning.current = true;
                lastPanPointer.current = {
                    x: e.evt.clientX,
                    y: e.evt.clientY
                };

                setIsDrawing(false);
                isSelecting.current = false;
                selectionStartRef.current = null;
                setSelectionBox(null);

                return;
            }
        }

        
        
        if (pendingInsert) {

            e.cancelBubble = true;

            const stage = stageRef.current;

            if (!stage) {
                return;
            }

            const pos =
                getPointerPosition();

            if (pos) {
                insertPendingObject(pos);
            }

            return;
        }


        // Fill is exclusively a canvas painting tool. Shape and fill nodes
        // must not become selectable/draggable while it is active.
        if (tool === "fill") {
            return;
        }

        if (tool !== "select") {
            return;
        }


        e.cancelBubble = true;

        // Text and Note use a manual double-click detector. This runs on
        // pointer-down, before Konva's draggable/click machinery can consume
        // the second click.
        if (type === "object") {
            const sourceObject = objects[index];
            const editable =
                sourceObject?.type === "text" ||
                sourceObject?.type === "note";

            if (editable) {
                const now = Date.now();
                const key = `${sourceObject.type}:${index}`;
                const previous = textNoteClickRef.current;

                if (
                    previous.key === key &&
                    now - previous.time <= 500
                ) {
                    textNoteClickRef.current = {
                        key: null,
                        time: 0
                    };

                    if (sourceObject.type === "text") {
                        setEditingNote(null);
                        setEditingText(index);
                    } else {
                        setEditingText(null);
                        setEditingNote(index);
                    }

                    // Do not start a drag from the second click.
                    return;
                }

                textNoteClickRef.current = {
                    key,
                    time: now
                };
            } else {
                textNoteClickRef.current = {
                    key: null,
                    time: 0
                };
            }
        } else {
            textNoteClickRef.current = {
                key: null,
                time: 0
            };
        }


        const item = {
            type,
            index
        };


        const alreadySelected =
            isSelected(
                type,
                index
            );


        const modifier =
            e.evt.shiftKey ||
            e.evt.ctrlKey ||
            e.evt.metaKey;


        const source =
            type === "object"
                ? objects[index]
                : type === "line"
                ? lines[index]
                : fills[index];


        if (source) {

            setActiveLayerId(
                getItemLayerId(
                    source
                )
            );

        }


        setSelectedElements(
            prev => {

                if (modifier) {

                    if (
                        alreadySelected
                    ) {

                        return prev.filter(
                            element =>
                                !(
                                    element.type ===
                                        type &&
                                    element.index ===
                                        index
                                )
                        );

                    }


                    return [
                        ...prev,
                        item
                    ];

                }


                if (
                    alreadySelected
                ) {

                    return prev;

                }


                return [
                    item
                ];

            }
        );

    };

    
    
    

    const getSelectedBounds = () => {

        const stage = stageRef.current;

        if (!stage || selectedElements.length < 2) {
            return null;
        }

        let bounds = null;

        selectedElements.forEach(element => {

            const node =
                nodeRefs.current[
                    makeKey(element.type, element.index)
                ];

            if (!node) {
                return;
            }

            const rect = node.getClientRect({
                relativeTo: stage
            });

            if (!bounds) {
                bounds = { ...rect };
                return;
            }

            const right = Math.max(
                bounds.x + bounds.width,
                rect.x + rect.width
            );

            const bottom = Math.max(
                bounds.y + bounds.height,
                rect.y + rect.height
            );

            const left = Math.min(bounds.x, rect.x);
            const top = Math.min(bounds.y, rect.y);

            bounds = {
                x: left,
                y: top,
                width: right - left,
                height: bottom - top
            };

        });

        return bounds;
    };


    const startSelectedGroupDrag = pos => {

        const positions = new Map();

        selectedElements.forEach(element => {

            const key = makeKey(
                element.type,
                element.index
            );

            const node = nodeRefs.current[key];

            if (!node) {
                return;
            }

            positions.set(key, {
                x: node.x(),
                y: node.y()
            });

        });

        if (!positions.size) {
            return false;
        }

        groupDragRef.current = {
            startX: pos.x,
            startY: pos.y,
            positions
        };

        return true;
    };


    const moveSelectedGroup = pos => {

        const drag = groupDragRef.current;

        if (!drag) {
            return;
        }

        const dx = pos.x - drag.startX;
        const dy = pos.y - drag.startY;

        drag.positions.forEach((position, key) => {

            const node = nodeRefs.current[key];

            if (!node) {
                return;
            }

            node.position({
                x: position.x + dx,
                y: position.y + dy
            });

        });

        transformerRef.current
            ?.getLayer()
            ?.batchDraw();
    };


    const finishSelectedGroupDrag = () => {

        const drag = groupDragRef.current;

        if (!drag) {
            return;
        }

        saveHistory();

        setObjects(prev =>
            prev.map((object, index) => {

                if (!selectedElements.some(
                    element =>
                        element.type === "object" &&
                        element.index === index
                )) {
                    return object;
                }

                const node =
                    nodeRefs.current[
                        makeKey("object", index)
                    ];

                if (!node) {
                    return object;
                }

                return {
                    ...object,
                    x: node.x(),
                    y: node.y()
                };
            })
        );

        setLines(prev =>
            prev.map((line, index) => {

                if (!selectedElements.some(
                    element =>
                        element.type === "line" &&
                        element.index === index
                )) {
                    return line;
                }

                const node =
                    nodeRefs.current[
                        makeKey("line", index)
                    ];

                if (!node) {
                    return line;
                }

                return {
                    ...line,
                    x: node.x(),
                    y: node.y()
                };
            })
        );

        groupDragRef.current = null;
    };


    const handleStageMouseDown =
        e => {

            const stage =
                stageRef.current;

            if (!stage) {
                return;
            }

            
            
            
            if (e.evt?.button === 2) {
                if (
                    tool === "select" ||
                    tool === "pen" ||
                    tool === "eraser" ||
                    tool === "fill"
                ) {
                    e.evt.preventDefault();
                    e.cancelBubble = true;

                    isRightPanning.current = true;
                    lastPanPointer.current = {
                        x: e.evt.clientX,
                        y: e.evt.clientY
                    };

                    setIsDrawing(false);
                    isSelecting.current = false;
                    selectionStartRef.current = null;
                    setSelectionBox(null);
                    return;
                }
            }

            const pos =
                getPointerPosition();

            if (!pos) {
                return;
            }

            
            if (pendingInsert) {
                insertPendingObject(pos);
                return;
            }

            if (tool === "fill") {

                performFill();
                return;

            }


            if (
                tool === "pen" ||
                tool === "eraser"
            ) {

                startFreehandDrawing();

                return;

            }


            if (
                tool !== "select"
            ) {
                return;
            }


            
            
            if (
                selectedElements.length > 1 &&
                e.target === stage
            ) {

                const bounds = getSelectedBounds();

                if (
                    bounds &&
                    pos.x >= bounds.x &&
                    pos.x <= bounds.x + bounds.width &&
                    pos.y >= bounds.y &&
                    pos.y <= bounds.y + bounds.height
                ) {
                    if (startSelectedGroupDrag(pos)) {
                        return;
                    }
                }
            }


            if (
                e.target !==
                stage
            ) {
                return;
            }


            selectionStartRef.current = {
                x: pos.x,
                y: pos.y
            };


            isSelecting.current =
                true;


            setSelectionBox({
                x1: pos.x,
                y1: pos.y,
                x2: pos.x,
                y2: pos.y
            });

        };


    const drawFrameRef =
        useRef(null);

    const pendingPointerRef =
        useRef(null);

    const eraserPreviousPositionRef =
        useRef(null);

    const transformerDragRef =
        useRef(null);

    const groupDragRef =
        useRef(null);


    useEffect(() => {
        return () => {
            if (
                drawFrameRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    drawFrameRef.current
                );
            }
        };
    }, []);


    const handleStageMouseMove =
        e => {

            
            if (isRightPanning.current) {
                const stage = stageRef.current;
                const last = lastPanPointer.current;

                if (stage && last) {
                    const dx = e.evt.clientX - last.x;
                    const dy = e.evt.clientY - last.y;
                    const current = stage.position();

                    stage.position({
                        x: current.x + dx,
                        y: current.y + dy
                    });

                    lastPanPointer.current = {
                        x: e.evt.clientX,
                        y: e.evt.clientY
                    };

                    stage.batchDraw();
                }

                return;
            }

            if (
                tool === "pen" ||
                tool === "eraser"
            ) {

                pendingPointerRef.current =
                    getPointerPosition();

                if (
                    drawFrameRef.current ===
                    null
                ) {

                    drawFrameRef.current =
                        requestAnimationFrame(
                            () => {

                                drawFrameRef.current =
                                    null;

                                const pointer =
                                    pendingPointerRef.current;

                                pendingPointerRef.current =
                                    null;

                                if (pointer) {
                                    draw(pointer);
                                }

                            }
                        );

                }

                return;

            }


            const stage =
                stageRef.current;

            if (!stage) {
                return;
            }


            if (groupDragRef.current) {
                const pos = getPointerPosition();

                if (pos) {
                    moveSelectedGroup(pos);
                }

                return;
            }


            const pos =
                getPointerPosition();

            if (!pos) {
                return;
            }


            const start =
                selectionStartRef.current;

            if (!start) {
                return;
            }


            setSelectionBox({
                x1: start.x,
                y1: start.y,
                x2: pos.x,
                y2: pos.y
            });

        };


    const finishSelection = () => {

        if (
            !isSelecting.current
        ) {
            return;
        }


        const box =
            selectionBox;


        isSelecting.current =
            false;

        selectionStartRef.current =
            null;

        setSelectionBox(null);


        if (!box) {
            return;
        }


        const x =
            Math.min(
                box.x1,
                box.x2
            );


        const y =
            Math.min(
                box.y1,
                box.y2
            );


        const width =
            Math.abs(
                box.x2 -
                box.x1
            );


        const height =
            Math.abs(
                box.y2 -
                box.y1
            );


        if (
            width < 3 &&
            height < 3
        ) {

            setSelectedElements([]);

            return;

        }


        const selectionRect = {
            x,
            y,
            width,
            height
        };


        const selected = [];


        
        
        

        lines.forEach(
            (line, index) => {

                if (
                    line.globalCompositeOperation ===
                    "destination-out"
                ) {
                    return;
                }

                const layer =
                    getLayerById(
                        getItemLayerId(
                            line
                        )
                    );


                if (
                    !layer ||
                    !layer.visible
                ) {
                    return;
                }


                const node =
                    nodeRefs.current[
                        makeKey(
                            "line",
                            index
                        )
                    ];


                if (!node) {
                    return;
                }


                
                
                
                
                const rect =
                    node.getClientRect({
                        relativeTo: stageRef.current
                    });


                if (
                    Konva.Util.haveIntersection(
                        selectionRect,
                        rect
                    )
                ) {

                    selected.push({
                        type: "line",
                        index
                    });

                }

            }
        );


        
        
        

        objects.forEach(
            (object, index) => {

                const layer =
                    getLayerById(
                        getItemLayerId(
                            object
                        )
                    );


                if (
                    !layer ||
                    !layer.visible
                ) {
                    return;
                }


                const node =
                    nodeRefs.current[
                        makeKey(
                            "object",
                            index
                        )
                    ];


                if (!node) {
                    return;
                }


                
                
                
                
                const rect =
                    node.getClientRect({
                        relativeTo: stageRef.current
                    });


                if (
                    Konva.Util.haveIntersection(
                        selectionRect,
                        rect
                    )
                ) {

                    selected.push({
                        type: "object",
                        index
                    });

                }

            }
        );


        fills.forEach(
            (fill, index) => {
                const layer = getLayerById(getItemLayerId(fill));
                if (!layer || !layer.visible) return;

                const node = nodeRefs.current[makeKey("fill", index)];
                if (!node) return;

                const rect = node.getClientRect({ relativeTo: stageRef.current });
                if (Konva.Util.haveIntersection(selectionRect, rect)) {
                    selected.push({ type: "fill", index });
                }
            }
        );

        setSelectedElements(
            selected
        );

    };


    const handleStageMouseUp =
        e => {

            if (groupDragRef.current) {
                finishSelectedGroupDrag();
                return;
            }

            if (isRightPanning.current) {
                isRightPanning.current = false;
                lastPanPointer.current = null;
                return;
            }

            if (
                tool === "pen" ||
                tool === "eraser"
            ) {

                stopDrawing();

                return;

            }


            if (
                tool === "select"
            ) {

                finishSelection();

            }

        };


    
    
    

    const handleDragStart =
        (type, index) => {

            const key =
                makeKey(
                    type,
                    index
                );


            let selection =
                selectedElements;


            if (
                !selection.some(
                    element =>
                        makeKey(
                            element.type,
                            element.index
                        ) === key
                )
            ) {

                selection = [
                    {
                        type,
                        index
                    }
                ];

                setSelectedElements(
                    selection
                );

            }


            const positions =
                new Map();


            selection.forEach(
                element => {

                    const elementKey =
                        makeKey(
                            element.type,
                            element.index
                        );


                    const node =
                        nodeRefs.current[
                            elementKey
                        ];


                    if (!node) {
                        return;
                    }


                    positions.set(
                        elementKey,
                        {
                            x: node.x(),
                            y: node.y()
                        }
                    );

                }
            );


            dragStartPositionsRef.current =
                positions;

        };


    const handleDragMove =
        (type, index, e) => {

            if (
                !dragStartPositionsRef.current
            ) {
                return;
            }


            const activeKey =
                makeKey(
                    type,
                    index
                );


            const activeStart =
                dragStartPositionsRef.current.get(
                    activeKey
                );


            if (!activeStart) {
                return;
            }


            const dx =
                e.target.x() -
                activeStart.x;


            const dy =
                e.target.y() -
                activeStart.y;


            selectedElements.forEach(
                element => {

                    const key =
                        makeKey(
                            element.type,
                            element.index
                        );


                    if (
                        key ===
                        activeKey
                    ) {
                        return;
                    }


                    const start =
                        dragStartPositionsRef.current.get(
                            key
                        );


                    const node =
                        nodeRefs.current[
                            key
                        ];


                    if (
                        !start ||
                        !node
                    ) {
                        return;
                    }


                    node.position({
                        x:
                            start.x +
                            dx,

                        y:
                            start.y +
                            dy
                    });

                }
            );


            transformerRef.current
                ?.getLayer()
                ?.batchDraw();

        };


    const handleDragEnd =
        () => {

            if (
                !dragStartPositionsRef.current
            ) {
                return;
            }

            saveHistory();

            setObjects(prev =>
                prev.map(
                    (object, index) => {

                        const selected =
                            selectedElements.some(
                                element =>
                                    element.type ===
                                        "object" &&
                                    element.index ===
                                        index
                            );


                        if (!selected) {
                            return object;
                        }


                        const node =
                            nodeRefs.current[
                                makeKey(
                                    "object",
                                    index
                                )
                            ];


                        if (!node) {
                            return object;
                        }


                        return {
                            ...object,

                            x: node.x(),
                            y: node.y(),

                            rotation:
                                node.rotation(),

                            scaleX:
                                node.scaleX(),

                            scaleY:
                                node.scaleY()
                        };

                    }
                )
            );


            setLines(prev =>
                prev.map(
                    (line, index) => {

                        const selected =
                            selectedElements.some(
                                element =>
                                    element.type ===
                                        "line" &&
                                    element.index ===
                                        index
                            );


                        if (!selected) {
                            return line;
                        }


                        const node =
                            nodeRefs.current[
                                makeKey(
                                    "line",
                                    index
                                )
                            ];


                        if (!node) {
                            return line;
                        }


                        return {
                            ...line,

                            x: node.x(),
                            y: node.y(),

                            rotation:
                                node.rotation(),

                            scaleX:
                                node.scaleX(),

                            scaleY:
                                node.scaleY()
                        };

                    }
                )
            );




            setFills(prev =>
                prev.map(
                    (fill, index) => {
                        const selected =
                            selectedElements.some(
                                element =>
                                    element.type === "fill" &&
                                    element.index === index
                            );

                        if (!selected) {
                            return fill;
                        }

                        const node =
                            nodeRefs.current[
                                makeKey("fill", index)
                            ];

                        if (!node) {
                            return fill;
                        }

                        return {
                            ...fill,
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                        };
                    }
                )
            );

            dragStartPositionsRef.current =
                null;

        };


    
    
    
    
    
    
    
    

    useEffect(() => {

        const transformer =
            transformerRef.current;

        if (!transformer) {
            return;
        }


        const nodes =
            selectedElements
                .map(
                    element =>
                        nodeRefs.current[
                            makeKey(
                                element.type,
                                element.index
                            )
                        ]
                )
                .filter(Boolean);


        transformer.nodes(
            nodes
        );


        transformer
            .getLayer()
            ?.batchDraw();

    }, [
        selectedElements,
        objects,
        lines,
        fills,
        layers,
        editingText,
        editingNote
    ]);


    const handleTransformerDragStart =
        e => {

            if (selectedElements.length === 0) {
                return;
            }

            const transformer =
                e.target;

            const stage =
                transformer.getStage();

            const pointer =
                stage?.getPointerPosition();

            if (!pointer) {
                return;
            }

            const positions =
                new Map();

            selectedElements.forEach(
                element => {

                    const key =
                        makeKey(
                            element.type,
                            element.index
                        );

                    const node =
                        nodeRefs.current[key];

                    if (!node) {
                        return;
                    }

                    positions.set(
                        key,
                        {
                            x: node.x(),
                            y: node.y()
                        }
                    );

                }
            );

            transformerDragRef.current = {
                pointerStartX: pointer.x,
                pointerStartY: pointer.y,
                transformerStartX: transformer.x(),
                transformerStartY: transformer.y(),
                positions
            };

        };


    const handleTransformerDragMove =
        e => {

            const drag =
                transformerDragRef.current;

            if (!drag) {
                return;
            }

            const transformer =
                e.target;

            const stage =
                transformer.getStage();

            const pointer =
                stage?.getPointerPosition();

            if (!pointer) {
                return;
            }

            // Use the actual pointer delta rather than the Transformer's
            // internal x/y. This keeps the selection movement locked to
            // the cursor and avoids the small jump/lag caused by the
            // Transformer's own drag position.
            const stageScaleX =
                stage?.scaleX() || 1;

            const stageScaleY =
                stage?.scaleY() || 1;

            const dx =
                (pointer.x - drag.pointerStartX) /
                stageScaleX;

            const dy =
                (pointer.y - drag.pointerStartY) /
                stageScaleY;

            drag.positions.forEach(
                (position, key) => {

                    const node =
                        nodeRefs.current[key];

                    if (!node) {
                        return;
                    }

                    node.position({
                        x: position.x + dx,
                        y: position.y + dy
                    });

                }
            );

            // Keep the Transformer itself at its original position.
            // The selected nodes move; the Transformer then redraws
            // around them, keeping the blue box synchronized.
            transformer.position({
                x: drag.transformerStartX,
                y: drag.transformerStartY
            });

            transformer
                .getLayer()
                ?.batchDraw();

        };


    const handleTransformerDragEnd =
        e => {

            const drag =
                transformerDragRef.current;

            if (!drag) {
                return;
            }

            saveHistory();

            setObjects(prev =>
                prev.map(
                    (object, index) => {

                        if (
                            !selectedElements.some(
                                element =>
                                    element.type ===
                                        "object" &&
                                    element.index ===
                                        index
                            )
                        ) {
                            return object;
                        }

                        const node =
                            nodeRefs.current[
                                makeKey(
                                    "object",
                                    index
                                )
                            ];

                        if (!node) {
                            return object;
                        }

                        return {
                            ...object,
                            x: node.x(),
                            y: node.y()
                        };

                    }
                )
            );

            setLines(prev =>
                prev.map(
                    (line, index) => {

                        if (
                            !selectedElements.some(
                                element =>
                                    element.type ===
                                        "line" &&
                                    element.index ===
                                        index
                            )
                        ) {
                            return line;
                        }

                        const node =
                            nodeRefs.current[
                                makeKey(
                                    "line",
                                    index
                                )
                            ];

                        if (!node) {
                            return line;
                        }

                        return {
                            ...line,
                            x: node.x(),
                            y: node.y()
                        };

                    }
                )
            );

            e.target.position({
                x: drag.transformerStartX,
                y: drag.transformerStartY
            });

            transformerDragRef.current =
                null;

            e.target
                .getLayer()
                ?.batchDraw();

        };


    const handleTransformEnd =
        () => {

            if (
                selectedElements.length ===
                0
            ) {
                return;
            }

            saveHistory();

            setObjects(prev =>
                prev.map(
                    (object, index) => {

                        const selected =
                            selectedElements.some(
                                element =>
                                    element.type ===
                                        "object" &&
                                    element.index ===
                                        index
                            );


                        if (!selected) {
                            return object;
                        }


                        const node =
                            nodeRefs.current[
                                makeKey(
                                    "object",
                                    index
                                )
                            ];


                        if (!node) {
                            return object;
                        }


                        return {

                            ...object,

                            x:
                                node.x(),

                            y:
                                node.y(),

                            scaleX:
                                node.scaleX(),

                            scaleY:
                                node.scaleY(),

                            rotation:
                                node.rotation()

                        };

                    }
                )
            );


            setLines(prev =>
                prev.map(
                    (line, index) => {

                        const selected =
                            selectedElements.some(
                                element =>
                                    element.type ===
                                        "line" &&
                                    element.index ===
                                        index
                            );


                        if (!selected) {
                            return line;
                        }


                        const node =
                            nodeRefs.current[
                                makeKey(
                                    "line",
                                    index
                                )
                            ];


                        if (!node) {
                            return line;
                        }


                        return {

                            ...line,

                            x:
                                node.x(),

                            y:
                                node.y(),

                            scaleX:
                                node.scaleX(),

                            scaleY:
                                node.scaleY(),

                            rotation:
                                node.rotation()

                        };

                    }
                )
            );


            setFills(prev =>
                prev.map((fill, index) => {
                    if (!selectedElements.some(e => e.type === "fill" && e.index === index)) {
                        return fill;
                    }
                    const node = nodeRefs.current[makeKey("fill", index)];
                    if (!node) return fill;
                    return {
                        ...fill,
                        x: node.x(),
                        y: node.y(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                        rotation: node.rotation()
                    };
                })
            );


            setFills(prev =>
                prev.map((fill, index) => {
                    if (!selectedElements.some(e => e.type === "fill" && e.index === index)) {
                        return fill;
                    }
                    const node = nodeRefs.current[makeKey("fill", index)];
                    if (!node) return fill;
                    return {
                        ...fill,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY()
                    };
                })
            );

        };


    
    
    

    const deleteSelected = () => {

        if (
            selectedElements.length ===
            0
        ) {
            return;
        }

        saveHistory();

        const objectIndexes =
            new Set(
                selectedElements
                    .filter(
                        element =>
                            element.type ===
                            "object"
                    )
                    .map(
                        element =>
                            element.index
                    )
            );


        const lineIndexes =
            new Set(
                selectedElements
                    .filter(
                        element =>
                            element.type ===
                            "line"
                    )
                    .map(
                        element =>
                            element.index
                    )
            );


        const fillIndexes = new Set(
            selectedElements
                .filter(element => element.type === "fill")
                .map(element => element.index)
        );


        setObjects(prev =>
            prev.filter(
                (_, index) =>
                    !objectIndexes.has(
                        index
                    )
            )
        );


        setLines(prev =>
            prev.filter(
                (_, index) =>
                    !lineIndexes.has(
                        index
                    )
            )
        );


        setFills(prev =>
            prev.filter((_, index) => !fillIndexes.has(index))
        );


        setSelectedElements([]);


        transformerRef.current
            ?.nodes([]);


        nodeRefs.current = {};

    };


    
    
    

    useEffect(() => {

        const handleKeyboard =
            e => {

                const tag =
                    document.activeElement
                        ?.tagName;


                if (
                    tag === "INPUT" ||
                    tag === "TEXTAREA"
                ) {
                    return;
                }


                if (
                    e.key ===
                    "Delete"
                ) {

                    e.preventDefault();

                    deleteSelected();

                }


                if (
                    e.ctrlKey &&
                    e.key.toLowerCase() ===
                        "z"
                ) {

                    e.preventDefault();

                    undo();

                }


                if (
                    e.ctrlKey &&
                    e.key.toLowerCase() ===
                        "y"
                ) {

                    e.preventDefault();

                    redo();

                }

            };


        window.addEventListener(
            "keydown",
            handleKeyboard
        );


        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyboard
            );

        };

    }, [
        selectedElements,
        objects,
        lines,
        fills,
        history,
        redoHistory
    ]);


    
    
    

    const addObject =
        newObject => {

            saveHistory();

            const newIndex =
                objects.length;


            const objectWithDefaults = {

                ...newObject,

                layerId:
                    activeLayerId,

                rotation:
                    newObject.rotation ||
                    0,

                scaleX:
                    newObject.scaleX ||
                    1,

                scaleY:
                    newObject.scaleY ||
                    1

            };


            setObjects(prev => [
                ...prev,
                objectWithDefaults
            ]);


            setSelectedElements([
                {
                    type: "object",
                    index: newIndex
                }
            ]);


            setTool(
                "select"
            );

        };


    
    
    

    const addText = () => {

        addObject({

            type:
                "text",

            x:
                200,

            y:
                150,

            text:
                "Text",

            fontSize:
                28,

            fill:
                color

        });

    };


    const updateText =
        (index, value) => {

            saveHistory();

            setObjects(prev =>
                prev.map(
                    (object, i) =>
                        i === index
                            ? {
                                ...object,
                                text:
                                    value
                            }
                            : object
                )
            );

        };


    
    
    

    const addNote = () => {

        addObject({

            type:
                "note",

            x:
                200,

            y:
                150,

            text:
                "Note"

        });

    };


    const updateNote =
        (index, value) => {

            saveHistory();

            setObjects(prev =>
                prev.map(
                    (object, i) =>
                        i === index
                            ? {
                                ...object,
                                text:
                                    value
                            }
                            : object
                )
            );

        };


    
    
    

    const addImage =
        e => {

            const file =
                e.target.files?.[0];

            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload = () => {

                const image =
                    new window.Image();


                image.src =
                    reader.result;


                image.onload = () => {

                    addObject({

                        type:
                            "image",

                        x:
                            200,

                        y:
                            150,

                        image,

                        width:
                            Math.min(
                                image.width,
                                400
                            ),

                        height:
                            Math.min(
                                image.height,
                                300
                            )

                    });

                };

            };


            reader.readAsDataURL(
                file
            );


            e.target.value = "";

        };


    
    
    
    
    

    const addShape =
        shapeType => {

            const base = {

                type:
                    shapeType,

                x:
                    250,

                y:
                    180,

                fill:
                    "transparent",

                stroke:
                    color,

                strokeWidth:
                    3,

                rotation:
                    0

            };


            switch (
                shapeType
            ) {

                case "square":

                    addObject({

                        ...base,

                        width:
                            100,

                        height:
                            100

                    });

                    break;


                case "circle":

                    addObject({

                        ...base,

                        radius:
                            50

                    });

                    break;


                case "triangle":

                    addObject({

                        ...base,

                        sides:
                            3,

                        radius:
                            60

                    });

                    break;


                case "diamond":

                    addObject({

                        ...base,

                        sides:
                            4,

                        radius:
                            60

                    });

                    break;


                case "hexagon":

                    addObject({

                        ...base,

                        sides:
                            6,

                        radius:
                            60

                    });

                    break;


                case "oval":

                    addObject({

                        ...base,

                        radiusX:
                            75,

                        radiusY:
                            45

                    });

                    break;


                case "parallelogram":

                    addObject({
                        ...base
                    });

                    break;


                case "star":

                    addObject({

                        ...base,

                        numPoints:
                            5,

                        innerRadius:
                            30,

                        outerRadius:
                            65

                    });

                    break;


                case "cloud":

                    addObject({
                        ...base
                    });

                    break;


                case "heart":

                    addObject({
                        ...base
                    });

                    break;


                case "incorrect":

                    addObject({
                        ...base
                    });

                    break;


                case "correct":

                    addObject({
                        ...base
                    });

                    break;


                case "leftArrow":

                    addObject({
                        ...base
                    });

                    break;


                case "upArrow":

                    addObject({
                        ...base
                    });

                    break;


                case "downArrow":

                    addObject({
                        ...base
                    });

                    break;


                case "rightArrow":

                    addObject({
                        ...base
                    });

                    break;


                default:
                    break;

            }

        };


    
    
    

    const openExportSelection = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const width = Math.min(500, stage.width());
        const height = Math.min(500, stage.height());
        const selectionLayer = selectionUiLayerRef.current;
        const transformerLayer = transformerUiLayerRef.current;
        const gridLayer = gridLayerRef.current;
        const onionLayers = stage.find(".onion-skin-export-layer");
        const oldSelectionVisibility = selectionLayer?.visible() ?? true;
        const oldTransformerVisibility = transformerLayer?.visible() ?? true;
        const oldGridVisibility = gridLayer?.visible() ?? true;
        const oldOnionVisibility = onionLayers.map(layer => layer.visible());
        let preview = "";
        try {
            // Capture the actual artwork as seen in the canvas, without editor-only overlays.
            selectionLayer?.visible(false);
            transformerLayer?.visible(false);
            gridLayer?.visible(false);
            onionLayers.forEach(layer => layer.visible(false));
            stage.draw();
            preview = stage.toDataURL({
                x: 0,
                y: 0,
                width: stage.width(),
                height: stage.height(),
                pixelRatio: 1,
                mimeType: "image/png"
            });
        } catch (error) {
            console.error("Could not create export preview.", error);
        } finally {
            selectionLayer?.visible(oldSelectionVisibility);
            transformerLayer?.visible(oldTransformerVisibility);
            gridLayer?.visible(oldGridVisibility);
            onionLayers.forEach((layer, index) => layer.visible(oldOnionVisibility[index] ?? true));
            stage.draw();
        }
        setExportPreview(preview);
        setExportCrop({
            x: Math.max(0, (stage.width() - width) / 2),
            y: Math.max(0, (stage.height() - height) / 2),
            width,
            height
        });
        setExportSelection({ width: stage.width(), height: stage.height() });
    };

    const clampExportCrop = crop => {
        const stage = stageRef.current;
        if (!stage) return crop;
        const width = Math.max(1, Math.min(stage.width(), crop.width));
        const height = Math.max(1, Math.min(stage.height(), crop.height));
        return {
            x: Math.max(0, Math.min(stage.width() - width, crop.x)),
            y: Math.max(0, Math.min(stage.height() - height, crop.y)),
            width,
            height
        };
    };

    const startExportCropDrag = (event, mode = "move") => {
        event.preventDefault();
        event.stopPropagation();
        exportDragRef.current = {
            mode,
            startX: event.clientX,
            startY: event.clientY,
            crop: { ...exportCrop },
            scaleX: (stageRef.current?.width() || 1) / Math.max(1, (event.currentTarget.parentElement?.getBoundingClientRect().width || 1)),
            scaleY: (stageRef.current?.height() || 1) / Math.max(1, (event.currentTarget.parentElement?.getBoundingClientRect().height || 1))
        };
        const move = moveEvent => {
            const drag = exportDragRef.current;
            if (!drag) return;
            const dx = (moveEvent.clientX - drag.startX) * drag.scaleX;
            const dy = (moveEvent.clientY - drag.startY) * drag.scaleY;
            const stage = stageRef.current;
            if (!stage) return;
            if (drag.mode === "resize") {
                setExportCrop(clampExportCrop({
                    ...drag.crop,
                    width: Math.max(50, drag.crop.width + dx),
                    height: Math.max(50, drag.crop.height + dy)
                }));
            } else {
                setExportCrop(clampExportCrop({
                    ...drag.crop,
                    x: drag.crop.x + dx,
                    y: drag.crop.y + dy
                }));
            }
        };
        const stop = () => {
            exportDragRef.current = null;
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
    };



    
    
    

    const renderObject =
        (object, index) => {

            const key =
                makeKey(
                    "object",
                    index
                );


            const commonProps = {

                ref:
                    node => {

                        if (node) {

                            nodeRefs.current[
                                key
                            ] = node;

                        }

                    },


                x:
                    object.x,

                y:
                    object.y,

                scaleX:
                    object.scaleX ||
                    1,

                scaleY:
                    object.scaleY ||
                    1,

                rotation:
                    object.rotation ||
                    0,

                opacity:
                    object.opacity ??
                    1,

                draggable:
                    tool ===
                    "select",


                onMouseDown:
                    e =>
                        handleElementMouseDown(
                            "object",
                            index,
                            e
                        ),

                onContextMenu:
                    e =>
                        handleElementContextMenu(
                            "object",
                            index,
                            e
                        ),

                onTouchStart:
                    e =>
                        handleElementMouseDown(
                            "object",
                            index,
                            e
                        ),


                onDragStart:
                    () =>
                        handleDragStart(
                            "object",
                            index
                        ),




                onDragMove:
                    e =>
                        handleDragMove(
                            "object",
                            index,
                            e
                        ),


                onDragEnd:
                    handleDragEnd

            };


            
            
            

            if (
                object.type ===
                "square"
            ) {

                return (

                    <Rect
                        key={key}
                        {...commonProps}

                        width={
                            object.width ||
                            100
                        }

                        height={
                            object.height ||
                            100
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "circle"
            ) {

                return (

                    <Circle
                        key={key}
                        {...commonProps}

                        radius={
                            object.radius ||
                            50
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                [
                    "triangle",
                    "diamond",
                    "hexagon"
                ].includes(
                    object.type
                )
            ) {

                const sides =
                    object.type ===
                        "triangle"
                        ? 3
                        : object.type ===
                            "diamond"
                            ? 4
                            : 6;


                return (

                    <RegularPolygon
                        key={key}
                        {...commonProps}

                        sides={
                            sides
                        }

                        radius={
                            object.radius ||
                            60
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "oval"
            ) {

                return (

                    <Ellipse
                        key={key}
                        {...commonProps}

                        radiusX={
                            object.radiusX ||
                            75
                        }

                        radiusY={
                            object.radiusY ||
                            45
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "star"
            ) {

                return (

                    <Star
                        key={key}
                        {...commonProps}

                        numPoints={
                            object.numPoints ||
                            5
                        }

                        innerRadius={
                            object.innerRadius ||
                            30
                        }

                        outerRadius={
                            object.outerRadius ||
                            65
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "parallelogram"
            ) {

                return (

                    <Shape
                        key={key}
                        {...commonProps}

                        width={
                            140
                        }

                        height={
                            80
                        }

                        sceneFunc={
                            (context, shape) => {

                                context.beginPath();

                                context.moveTo(
                                    25,
                                    0
                                );

                                context.lineTo(
                                    140,
                                    0
                                );

                                context.lineTo(
                                    115,
                                    80
                                );

                                context.lineTo(
                                    0,
                                    80
                                );

                                context.closePath();

                                context.fillStrokeShape(
                                    shape
                                );

                            }
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "cloud"
            ) {

                return (

                    <Shape
                        key={key}
                        {...commonProps}

                        width={
                            160
                        }

                        height={
                            100
                        }

                        sceneFunc={
                            (context, shape) => {

                                context.beginPath();

                                context.moveTo(
                                    35,
                                    70
                                );

                                context.bezierCurveTo(
                                    5,
                                    70,
                                    5,
                                    35,
                                    35,
                                    35
                                );

                                context.bezierCurveTo(
                                    40,
                                    5,
                                    85,
                                    5,
                                    95,
                                    35
                                );

                                context.bezierCurveTo(
                                    135,
                                    15,
                                    165,
                                    45,
                                    145,
                                    70
                                );

                                context.lineTo(
                                    35,
                                    70
                                );

                                context.closePath();

                                context.fillStrokeShape(
                                    shape
                                );

                            }
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "heart"
            ) {

                return (

                    <Shape
                        key={key}
                        {...commonProps}

                        width={
                            120
                        }

                        height={
                            110
                        }

                        sceneFunc={
                            (context, shape) => {

                                context.beginPath();

                                context.moveTo(
                                    60,
                                    100
                                );

                                context.bezierCurveTo(
                                    20,
                                    70,
                                    0,
                                    50,
                                    0,
                                    25
                                );

                                context.bezierCurveTo(
                                    0,
                                    0,
                                    35,
                                    -5,
                                    60,
                                    25
                                );

                                context.bezierCurveTo(
                                    85,
                                    -5,
                                    120,
                                    0,
                                    120,
                                    25
                                );

                                context.bezierCurveTo(
                                    120,
                                    50,
                                    100,
                                    70,
                                    60,
                                    100
                                );

                                context.closePath();

                                context.fillStrokeShape(
                                    shape
                                );

                            }
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            object.strokeWidth ||
                            3
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "incorrect"
            ) {

                return (

                    <Group
                        key={key}
                        {...commonProps}
                    >

                        <Rect

                            width={
                                130
                            }

                            height={
                                80
                            }

                            fill={object.fill ?? "transparent"}

                            stroke={
                                object.stroke ||
                                color
                            }

                            strokeWidth={
                                3
                            }

                        />


                        <Line

                            points={[
                                30,
                                20,
                                100,
                                60
                            ]}

                            stroke={
                                object.stroke ||
                                color
                            }

                            strokeWidth={
                                8
                            }

                            lineCap="round"

                        />


                        <Line

                            points={[
                                100,
                                20,
                                30,
                                60
                            ]}

                            stroke={
                                object.stroke ||
                                color
                            }

                            strokeWidth={
                                8
                            }

                            lineCap="round"

                        />

                    </Group>

                );

            }


            
            
            

            if (
                object.type ===
                "correct"
            ) {

                return (

                    <Group
                        key={key}
                        {...commonProps}
                    >

                        <Rect

                            width={
                                130
                            }

                            height={
                                80
                            }

                            fill={object.fill ?? "transparent"}

                            stroke={
                                object.stroke ||
                                color
                            }

                            strokeWidth={
                                3
                            }

                        />


                        <Line

                            points={[
                                25,
                                40,
                                50,
                                60,
                                105,
                                20
                            ]}

                            stroke={
                                object.stroke ||
                                color
                            }

                            strokeWidth={
                                8
                            }

                            lineCap="round"

                            lineJoin="round"

                        />

                    </Group>

                );

            }


            
            
            

            if (
                [
                    "leftArrow",
                    "upArrow",
                    "downArrow",
                    "rightArrow"
                ].includes(
                    object.type
                )
            ) {

                let points = [
                    0,
                    40,
                    100,
                    40
                ];


                if (
                    object.type ===
                    "leftArrow"
                ) {

                    points = [
                        100,
                        40,
                        0,
                        40
                    ];

                }


                if (
                    object.type ===
                    "upArrow"
                ) {

                    points = [
                        50,
                        100,
                        50,
                        0
                    ];

                }


                if (
                    object.type ===
                    "downArrow"
                ) {

                    points = [
                        50,
                        0,
                        50,
                        100
                    ];

                }


                return (

                    <Arrow
                        key={key}
                        {...commonProps}

                        points={
                            points
                        }

                        pointerLength={
                            20
                        }

                        pointerWidth={
                            20
                        }

                        fill={object.fill ?? "transparent"}

                        stroke={
                            object.stroke ||
                            color
                        }

                        strokeWidth={
                            8
                        }

                    />

                );

            }


            
            
            

            if (
                object.type ===
                "text"
            ) {

                return (

                    <Text
                        key={key}
                        {...commonProps}

                        text={
                            object.text ||
                            "Text"
                        }

                        fontSize={
                            object.fontSize ||
                            28
                        }

                        fill={
                            object.fill ||
                            color
                        }

                        opacity={
                            editingText === index
                                ? 0
                                : 1
                        }

                        onClick={e => {
                            // A single click selects the text.
                            // Editing is handled by the Transformer because the
                            // Transformer sits above selected objects.
                            e.cancelBubble = true;
                        }}

                    />

                );

            }


            if (
                object.type ===
                "note"
            ) {

                return (

                    <Group
                        key={key}
                        {...commonProps}

                        onClick={e => {
                            // A single click selects the note.
                            // Editing is handled by the Transformer because the
                            // Transformer sits above selected objects.
                            e.cancelBubble = true;
                        }}

                    >

                        <Rect
                            width={196}
                            height={126}
                            fill="#fff59d"
                            shadowColor="black"
                            shadowBlur={5}
                            shadowOpacity={0.15}
                            shadowOffset={{ x: 2, y: 3 }}
                        />

                        <Text
                            x={10}
                            y={10}
                            width={176}
                            height={106}
                            text={object.text || ""}
                            fontSize={18}
                            fill="#222"
                            wrap="word"
                            opacity={
                                editingNote === index
                                    ? 0
                                    : 1
                            }
                        />

                    </Group>

                );

            }


            if (
                object.type ===
                "image"
            ) {

                return (

                    <KonvaImage

                        key={key}

                        {...commonProps}

                        image={
                            object.image
                        }

                        width={
                            object.width
                        }

                        height={
                            object.height
                        }

                    />

                );

            }


            return null;

        };


    
    
    

    const renderLayerFills =
        layerId => {

        return fills
            .map(
                (fill, index) => ({
                    fill,
                    index
                })
            )
            .filter(
                item =>
                    getItemLayerId(
                        item.fill
                    ) ===
                    layerId
            )
            .map(
                ({ fill, index }) => {

                    const key =
                        `fill-${index}`;

                    return (
                        <KonvaImage
                            key={key}
                            ref={node => {
                                if (node) {
                                    nodeRefs.current[makeKey("fill", index)] = node;
                                }
                            }}
                            image={fill.image}
                            x={fill.x}
                            y={fill.y}
                            width={fill.width}
                            height={fill.height}
                            rotation={fill.rotation || 0}
                            scaleX={fill.scaleX || 1}
                            scaleY={fill.scaleY || 1}
                            opacity={fill.opacity ?? 1}
                            draggable={tool === "select"}
                            listening={tool === "select"}
                            onMouseDown={e => handleElementMouseDown("fill", index, e)}
                            onTouchStart={e => handleElementMouseDown("fill", index, e)}
                            onDragStart={() => handleDragStart("fill", index)}
                            onDragMove={e => handleDragMove("fill", index, e)}
                            onDragEnd={handleDragEnd}
                            onContextMenu={e => handleElementContextMenu("fill", index, e)}
                        />
                    );
                }
            );
    };


    const renderLayerLines =
        layerId => {
return lines
                .map(
                    (line, index) => ({
                        line,
                        index
                    })
                )
                .filter(
                    item =>
                        getItemLayerId(
                            item.line
                        ) ===
                        layerId
                )
                .map(
                    ({
                        line,
                        index
                    }) => {

                        const key =
                            makeKey(
                                "line",
                                index
                            );


                        const brush = line.brushType || "basic";
                        const baseWidth = line.strokeWidth || 1;
                        const baseOpacity = line.opacity ?? 1;

                        // Original, non-textured brush presets: simple strokes with
                        // brush-specific width, opacity and dash settings.
                        const brushSettings = {
                            basic:    { width: 1, opacity: 1, dash: [] },
                            pencil:   { width: 0.72, opacity: 0.72, dash: [] },
                            marker:   { width: 2.1, opacity: 0.55, dash: [] },
                            ink:      { width: 1, opacity: 0.95, dash: [] },
                            airbrush: { width: 1.4, opacity: 0.24, dash: [] },
                            chalk:    { width: 0.9, opacity: 0.58, dash: [3, 5] }
                        };
                        const settings = brushSettings[brush] || brushSettings.basic;

                        return (
                            <Line
                                key={key}
                                ref={node => {
                                    if (node) nodeRefs.current[key] = node;
                                }}
                                points={line.points}
                                stroke={line.stroke}
                                strokeWidth={baseWidth * settings.width}
                                lineCap="round"
                                lineJoin="round"
                                tension={line.tension ?? 0.45}
                                dash={settings.dash}
                                opacity={baseOpacity * settings.opacity}
                                globalCompositeOperation={line.globalCompositeOperation}
                                x={line.x || 0}
                                y={line.y || 0}
                                scaleX={line.scaleX || 1}
                                scaleY={line.scaleY || 1}
                                rotation={line.rotation || 0}
                                draggable={tool === "select"}
                                hitStrokeWidth={20}
                                listening={tool === "select" && line.globalCompositeOperation !== "destination-out"}
                                onMouseDown={e => handleElementMouseDown("line", index, e)}
                                onContextMenu={e => handleElementContextMenu("line", index, e)}
                                onTouchStart={e => handleElementMouseDown("line", index, e)}
                                onDragStart={() => handleDragStart("line", index)}
                                onDragMove={e => handleDragMove("line", index, e)}
                                onDragEnd={handleDragEnd}
                            />
                        );

                    }
                );

        };


    const renderLayerObjects =
        layerId => {

            return objects
                .map(
                    (object, index) => ({
                        object,
                        index
                    })
                )
                .filter(
                    item =>
                        getItemLayerId(
                            item.object
                        ) ===
                        layerId
                )
                .map(
                    ({
                        object,
                        index
                    }) =>
                        renderObject(
                            object,
                            index
                        )
                );

        };


    
    
    

    
    
    const drawingCursorClass =
        tool === "pen"
            ? "pen_cursor"
            : tool === "eraser"
            ? "eraser_cursor"
            : "";

    
    
    

    return (

        <div
            className={`drawing_lab ${drawingCursorClass}`}
            onMouseDown={e => {
                if (layerContextMenu && !e.target.closest?.(".layer_context_menu")) {
                    closeLayerContextMenu();
                    setRecolorPickerOpen(false);
                }

                if (
                    brushSizeOpen &&
                    !e.target.closest?.(".toolbar_size")
                ) {
                    setBrushSizeOpen(false);
                }
            }}
        >

            <style>{`
                .drawing_lab.pen_cursor,
                .drawing_lab.pen_cursor * {
                    cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNNiAyNUwyMSAxMGw0IDRMMTAgMjlINnoiIGZpbGw9IiNmN2JiNTIiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTIxIDEwbDItMiA0IDQtMiAyeiIgZmlsbD0iI2VlZSIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNiAyNWwtMSA2IDYtMnoiIGZpbGw9IiMyMjIiLz48L3N2Zz4=") 6 26, crosshair !important;
                }

                .drawing_lab.eraser_cursor,
                .drawing_lab.eraser_cursor * {
                    cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNOCAyMmwxMC0xNCA5IDctMTAgMTR6IiBmaWxsPSIjYjljMGM4IiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik04IDIybDkgNyIgc3Ryb2tlPSIjNzc3IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTggOGw5IDciIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+") 6 26, crosshair !important;
                }

                .drawing_lab.eraser_cursor .konvajs-content {
                    cursor: crosshair !important;
                }

                .layer_context_menu {
                    box-sizing: border-box;
                    min-width: 190px;
                    max-width: calc(100vw - 16px);
                    width: 190px;
                    max-height: min(55vh, calc(100dvh - 120px));
                    overflow-x: hidden;
                    overscroll-behavior: contain;
                    scrollbar-gutter: stable;
                    scrollbar-width: auto;
                    scrollbar-color: #6f6a60 #f2eee5;
                    -webkit-overflow-scrolling: touch;
                    padding: 6px;
                    background: white;
                    border: 2px solid #222;
                    border-radius: 8px;
                    box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.22);
                    font-family: Arial, sans-serif;
                }

                .layer_context_menu.has-many-layers::-webkit-scrollbar { width: 12px; }
                .layer_context_menu:not(.has-many-layers)::-webkit-scrollbar { display: none; }
                .layer_context_menu::-webkit-scrollbar-track { background: #f2eee5; border-radius: 8px; }
                .layer_context_menu::-webkit-scrollbar-thumb { background: #8e877a; border: 2px solid #f2eee5; border-radius: 8px; }

                .layer_context_title {
                    padding: 6px 8px 7px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #666;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 4px;
                }

                .layer_context_item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 9px;
                    border: 0;
                    border-radius: 5px;
                    background: transparent;
                    color: #222;
                    text-align: left;
                    font-family: Arial, sans-serif;
                    font-size: 13px;
                    cursor: pointer !important;
                }

                .layer_context_item:hover {
                    background: #eeeeee;
                }

                .layer_delete_overlay {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.28);
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                }

                .layer_delete_dialog {
                    width: min(360px, calc(100vw - 40px));
                    padding: 20px;
                    box-sizing: border-box;
                    background: white;
                    color: #222;
                    border: 3px solid #222;
                    border-radius: 12px;
                    box-shadow: 4px 6px 16px rgba(0, 0, 0, 0.25);
                }

                .layer_delete_title {
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 12px;
                }

                .layer_delete_message {
                    font-size: 14px;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }

                .layer_delete_actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }

                .layer_delete_actions button {
                    padding: 8px 14px;
                    border: 2px solid #222;
                    border-radius: 7px;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .layer_delete_cancel {
                    background: #eeeeee;
                    color: #222;
                }

                .layer_delete_confirm {
                    background: #ed1c24;
                    color: white;
                }

                .layer_delete_actions button:hover {
                    filter: brightness(0.94);
                }

                .zoom_controls {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 0 3px;
                }

                .zoom_controls button {
                    width: 30px;
                    height: 30px;
                    padding: 0;
                    font-size: 18px;
                    line-height: 1;
                }

                .zoom_controls span {
                    min-width: 48px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: bold;
                    font-family: Arial, sans-serif;
                }

                .mobile_panel_button,
                .mobile_panel_close {
                    display: none;
                }

                .mobile_reference_header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }

                @media (max-width: 768px) {
                    .drawing_lab {
                        width: 100vw !important;
                        height: 100dvh !important;
                        min-height: 100dvh !important;
                        overflow: hidden !important;
                        touch-action: auto !important;
                    }

                    .drawing_lab canvas {
                        touch-action: none !important;
                    }

                    .drawing_title {
                        height: 44px !important;
                        min-height: 44px !important;
                        padding: 8px 12px !important;
                        font-size: 18px !important;
                        line-height: 28px !important;
                    }

                    .reference_panel {
                        position: fixed !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 58px !important;
                        top: auto !important;
                        width: 100vw !important;
                        max-width: 100vw !important;
                        height: min(62dvh, 430px) !important;
                        max-height: 62dvh !important;
                        overflow-y: auto !important;
                        z-index: 4000 !important;
                        box-sizing: border-box !important;
                        transition: transform 0.22s ease !important;
                        -webkit-overflow-scrolling: touch !important;
                    }

                    .reference_panel.mobile_open {
                        transform: translateY(0) !important;
                    }

                    .reference_panel.mobile_closed {
                        transform: translateY(calc(100% - 48px)) !important;
                    }

                    .reference_resize {
                        display: none !important;
                    }

                    .mobile_reference_header {
                        position: sticky;
                        top: 0;
                        z-index: 2;
                        padding-bottom: 8px;
                        background: inherit;
                    }

                    .mobile_panel_close,
                    .mobile_panel_button {
                        display: inline-flex !important;
                        align-items: center;
                        justify-content: center;
                        min-height: 36px;
                        padding: 7px 11px;
                        border: 2px solid #222;
                        border-radius: 7px;
                        background: #fff;
                        color: #222;
                        font-weight: bold;
                        font-size: 12px;
                        white-space: nowrap;
                        touch-action: manipulation;
                    }

                    .bottom_toolbar {
                        position: fixed !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        width: 100vw !important;
                        max-width: 100vw !important;
                        min-height: 58px !important;
                        height: auto !important;
                        padding: 7px !important;
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        align-items: center !important;
                        gap: 7px !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        z-index: 4500 !important;
                        -webkit-overflow-scrolling: touch !important;
                        touch-action: pan-x !important;
                    }

                    .bottom_toolbar > * {
                        flex: 0 0 auto !important;
                    }

                    .bottom_toolbar button,
                    .bottom_toolbar label {
                        min-height: 40px !important;
                        white-space: nowrap !important;
                        touch-action: manipulation !important;
                    }

                    .layer_context_menu {
                        max-width: calc(100vw - 24px) !important;
                    }
                }
            `}</style>

            <aside className="drawing_sidebar">
                <a href="https://nothinkformal.github.io/la-peace/index.html" onClick={goToMainMenu} className="drawing_brand" aria-label="LEM.CO main menu">
                    <span className="drawing_brand_logo"><img src={LEM_ICON_URL} alt="LEM.CO" /></span>
                    <span className="drawing_brand_text"><strong>LEM.CO</strong><small>LAB</small></span>
                </a>
                <div className="drawing_sidebar_rule" />
                <nav className="drawing_navigation" aria-label="Main navigation">
                    <a href="https://nothinkformal.github.io/la-peace/index.html" onClick={goToMainMenu} className="drawing_nav_link"><span>⌂</span>Home</a>
                    <a href="https://nothinkformal.github.io/la-peace/music-maker/tutorial.html" className="drawing_nav_link"><span>♫</span>Music Maker</a>
                    <a href="./index.html" className="drawing_nav_link active"><span>✎</span>Drawing Lab</a>
                    <a href="https://nothinkformal.github.io/la-peace/gallery/index.html" className="drawing_nav_link"><span>▣</span>Gallery</a>
                    <a href="https://nothinkformal.github.io/la-peace/story/index.html" className="drawing_nav_link"><span>▤</span>The Story</a>
                    <a href="https://nothinkformal.github.io/la-peace/mission/index.html" className="drawing_nav_link"><span>★</span>Our Mission</a>
                    <a href="https://nothinkformal.github.io/la-peace/credits/index.html" className="drawing_nav_link"><span>ⓘ</span>Credits</a>
                </nav>
                <a href="../about/index.html" className="drawing_sidebar_bottom"><span>?</span> About</a>
            </aside>

            <header className="drawing_topbar">
                <a href="https://nothinkformal.github.io/la-peace/index.html" onClick={goToMainMenu} className="drawing_back_button" aria-label="Back to main menu" title="Back to main menu">←</a>
                <div className="drawing_topbar_title">Drawing Lab</div>
                <span className="drawing_topbar_spacer" />
                <span className="drawing_topbar_tag">LEM.CO</span>
            </header>

            <div className="drawing_title">
                Drawing Lab
            </div>

            <Stage

                ref={
                    stageRef
                }

                width={
                    canvasWidth
                }

                height={
                    stageSize.height
                }
                style={{
                    position: "absolute",
                    left: isMobile ? 0 : 195,
                    top: 0,
                    border: "none",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    zIndex: 1
                }}

                onMouseDown={
                    handleStageMouseDown
                }

                onMouseMove={
                    handleStageMouseMove
                }

                onMouseUp={
                    handleStageMouseUp
                }

                onContextMenu={
                    handleStageContextMenu
                }

                onWheel={
                    handleStageWheel
                }

                onMouseLeave={
                    handleStageMouseUp
                }

                onTouchStart={
                    handleStageMouseDown
                }

                onTouchMove={
                    handleStageMouseMove
                }

                onTouchEnd={
                    handleStageMouseUp
                }

            >

                <Layer listening={false}>
                    <Rect
                        x={0}
                        y={0}
                        width={canvasWidth}
                        height={stageSize.height}
                        fill="white"
                    />
                </Layer>


                {showGrid && (
                    <Layer
                        ref={gridLayerRef}
                        listening={false}
                    >
                        <Shape
                            listening={false}
                            perfectDrawEnabled={false}
                            sceneFunc={(context, shape) => {
                                const stage = stageRef.current;
                                const scale = Math.max(0.0001, Math.abs(stage?.scaleX?.() || 1));
                                const stageX = stage?.x?.() || 0;
                                const stageY = stage?.y?.() || 0;
                                const viewWidth = stage?.width?.() || stageSize.width;
                                const viewHeight = stage?.height?.() || stageSize.height;

                                const left = (-stageX) / scale - 50;
                                const top = (-stageY) / scale - 50;
                                const right = (viewWidth - stageX) / scale + 50;
                                const bottom = (viewHeight - stageY) / scale + 50;
                                const spacing = 25;
                                const firstX = Math.floor(left / spacing) * spacing;
                                const firstY = Math.floor(top / spacing) * spacing;

                                context.beginPath();
                                context.lineWidth = 1 / scale;

                                for (let x = firstX; x <= right; x += spacing) {
                                    const major = Math.round(x / spacing) % 5 === 0;
                                    context.strokeStyle = major
                                        ? "rgba(80, 80, 80, 0.28)"
                                        : "rgba(80, 80, 80, 0.13)";
                                    context.beginPath();
                                    context.moveTo(x, top);
                                    context.lineTo(x, bottom);
                                    context.stroke();
                                }

                                for (let y = firstY; y <= bottom; y += spacing) {
                                    const major = Math.round(y / spacing) % 5 === 0;
                                    context.strokeStyle = major
                                        ? "rgba(80, 80, 80, 0.28)"
                                        : "rgba(80, 80, 80, 0.13)";
                                    context.beginPath();
                                    context.moveTo(left, y);
                                    context.lineTo(right, y);
                                    context.stroke();
                                }

                                context.fillStrokeShape(shape);
                            }}
                        />
                    </Layer>
                )}


                {layers.map(
                    layer => (

                        <Layer

                            key={
                                layer.id
                            }

                            visible={
                                layer.visible
                            }

                        >
                            {renderLayerFills(
                                layer.id
                            )}

                            {renderLayerLines(
                                layer.id
                            )}

                            {renderLayerObjects(
                                layer.id
                            )}

                        </Layer>

                    )
                )}


                <Layer
                    ref={selectionUiLayerRef}
                    listening={false}
                >

                    {selectionBox && (

                        <Rect

                            x={
                                Math.min(
                                    selectionBox.x1,
                                    selectionBox.x2
                                )
                            }

                            y={
                                Math.min(
                                    selectionBox.y1,
                                    selectionBox.y2
                                )
                            }

                            width={
                                Math.abs(
                                    selectionBox.x2 -
                                    selectionBox.x1
                                )
                            }

                            height={
                                Math.abs(
                                    selectionBox.y2 -
                                    selectionBox.y1
                                )
                            }

                            fill={
                                "rgba(65, 105, 225, 0.12)"
                            }

                            stroke={
                                "#4169E1"
                            }

                            strokeWidth={
                                1
                            }

                            dash={[
                                6,
                                4
                            ]}

                        />

                    )}

                </Layer>


                <Layer
                    ref={transformerUiLayerRef}
                >

                    <Transformer

                        ref={
                            transformerRef
                        }

                        rotateEnabled={
                            true
                        }

                        flipEnabled={
                            false
                        }

                        keepRatio={
                            false
                        }

                        enabledAnchors={[
                            "top-left",
                            "top-center",
                            "top-right",
                            "middle-left",
                            "middle-right",
                            "bottom-left",
                            "bottom-center",
                            "bottom-right"
                        ]}

                        anchorSize={
                            9
                        }

                        rotateAnchorOffset={
                            24
                        }

                        padding={
                            5
                        }

                        // The Transformer itself is draggable for both
                        // single-element and multi-element selections.
                        // Combined with shouldOverdrawWholeArea, this makes
                        // the entire blue selection box a drag target.
                        draggable={
                            selectedElements.length >
                            0
                        }

                        shouldOverdrawWholeArea={
                            true
                        }

                        dragOnTop={
                            true
                        }

                        onDragStart={
                            handleTransformerDragStart
                        }

                        onDragMove={
                            handleTransformerDragMove
                        }

                        onDragEnd={
                            handleTransformerDragEnd
                        }

                        boundBoxFunc={
                            (
                                oldBox,
                                newBox
                            ) => {

                                if (
                                    Math.abs(
                                        newBox.width
                                    ) < 5 ||
                                    Math.abs(
                                        newBox.height
                                    ) < 5
                                ) {

                                    return oldBox;

                                }

                                return newBox;

                            }
                        }

                        onTransformEnd={
                            handleTransformEnd
                        }

                        // The Transformer is rendered above the drawing objects.
                        // Once a Text/Note is selected it can therefore receive
                        // the second click instead of the underlying Konva node.
                        // Handle double-click here so editing still works.
                        onDblClick={e => {
                            e.cancelBubble = true;

                            if (tool !== "select") return;

                            if (selectedElements.length !== 1) return;

                            const selected = selectedElements[0];

                            if (selected.type !== "object") return;

                            const object = objects[selected.index];

                            if (!object) return;

                            if (object.type === "text") {
                                setEditingNote(null);
                                setEditingText(selected.index);
                            } else if (object.type === "note") {
                                setEditingText(null);
                                setEditingNote(selected.index);
                            }
                        }}

                        onDblTap={e => {
                            e.cancelBubble = true;

                            if (tool !== "select") return;

                            if (selectedElements.length !== 1) return;

                            const selected = selectedElements[0];

                            if (selected.type !== "object") return;

                            const object = objects[selected.index];

                            if (!object) return;

                            if (object.type === "text") {
                                setEditingNote(null);
                                setEditingText(selected.index);
                            } else if (object.type === "note") {
                                setEditingText(null);
                                setEditingNote(selected.index);
                            }
                        }}

                        onMouseDown={
                            e => {
                                e.cancelBubble = true;

                                if (e.evt?.button === 2) {
                                    e.evt.preventDefault();
                                    return;
                                }

                                if (e.evt?.button !== 0) return;
                                if (tool !== "select") return;
                                if (selectedElements.length !== 1) return;

                                const selected = selectedElements[0];
                                if (selected.type !== "object") return;

                                const object = objects[selected.index];
                                if (!object || (object.type !== "text" && object.type !== "note")) {
                                    return;
                                }

                                const now = Date.now();
                                const previous = textNoteClickRef.current;
                                const key = `${object.type}:${selected.index}`;

                                if (previous.key === key && now - previous.time <= 500) {
                                    textNoteClickRef.current = { key: null, time: 0 };

                                    if (object.type === "text") {
                                        setEditingNote(null);
                                        setEditingText(selected.index);
                                    } else {
                                        setEditingText(null);
                                        setEditingNote(selected.index);
                                    }

                                    // Prevent this second click from initiating a transform.
                                    e.evt.preventDefault();
                                    return;
                                }

                                textNoteClickRef.current = { key, time: now };
                            }
                        }

                        onTouchStart={
                            e => {
                                e.cancelBubble = true;
                            }
                        }

                        onContextMenu={
                            handleTransformerContextMenu
                        }

                    />

                </Layer>


                {onionSkinEnabled && (() => {
                    const currentIndex = frames.findIndex(frame => frame.id === activeFrameId);
                    // Always render neighboring frames. Comparing serialized artwork here can
                    // incorrectly hide onion skin when frame state is temporarily out of sync.
                    const adjacentFrames = [
                        { frame: frames[currentIndex - 1], opacity: 0.18, color: "#e34b4b" },
                        { frame: frames[currentIndex + 1], opacity: 0.18, color: "#4385e8" }
                    ].filter(item => item.frame);
                    return adjacentFrames.map(({ frame, opacity, color }) => (
                        <Layer key={`onion-${frame.id}`} name="onion-skin-export-layer" listening={false} opacity={opacity}>
                            {(frame.lines || []).map((line, index) => (
                                <Line
                                    key={`${frame.id}-onion-line-${index}`}
                                    points={line.points || []}
                                    stroke={color}
                                    strokeWidth={line.strokeWidth || 1}
                                    lineCap="round"
                                    lineJoin="round"
                                    tension={line.tension ?? 0.45}
                                    dash={line.brushType === "chalk" ? [3, 5] : []}
                                    x={line.x || 0}
                                    y={line.y || 0}
                                    scaleX={line.scaleX || 1}
                                    scaleY={line.scaleY || 1}
                                    rotation={line.rotation || 0}
                                />
                            ))}
                        </Layer>
                    ));
                })()}
            </Stage>


            {editingText !== null &&
                objects[
                    editingText
                ]?.type ===
                    "text" && (

                    <textarea

                        ref={
                            textInputRef
                        }

                        value={
                            objects[
                                editingText
                            ].text
                        }

                        onChange={
                            e =>
                                updateText(
                                    editingText,
                                    e.target.value
                                )
                        }

                        onBlur={() =>
                            setEditingText(
                                null
                            )
                        }

                        onKeyDown={
                            e => {

                                if (
                                    e.key ===
                                    "Escape"
                                ) {

                                    setEditingText(
                                        null
                                    );

                                }

                            }
                        }

                        autoFocus

                        onMouseDown={e => e.stopPropagation()}

                        onClick={e => e.stopPropagation()}

                        onTouchStart={e => e.stopPropagation()}

                        onFocus={e => e.target.select()}

                        onContextMenu={
                            e =>
                                handleEditingContextMenu(
                                    "text",
                                    editingText,
                                    e
                                )
                        }

                        style={{

                            position:
                                "fixed",

                            left:
                                (() => {
                                    const position =
                                        getScreenPosition(
                                            objects[editingText].x,
                                            objects[editingText].y
                                        );
                                    return position.x;
                                })(),

                            top:
                                (() => {
                                    const position =
                                        getScreenPosition(
                                            objects[editingText].x,
                                            objects[editingText].y
                                        );
                                    return position.y;
                                })(),

                            width:
                                250 *
                                (stageRef.current?.scaleX() || 1),

                            minHeight:
                                60 *
                                (stageRef.current?.scaleY() || 1),

                            padding:
                                "0",

                            margin:
                                "0",

                            border:
                                "none",

                            outline:
                                "none",

                            resize:
                                "none",

                            background:
                                "transparent",

                            fontFamily:
                                "Arial, sans-serif",

                            fontSize:
                                (objects[editingText].fontSize || 28) *
                                (stageRef.current?.scaleX() || 1),

                            color:
                                objects[editingText].fill || "#222",

                            lineHeight:
                                1.15,

                            overflow:
                                "hidden",

                            boxSizing:
                                "border-box",

                            userSelect:
                                "text",

                            WebkitUserSelect:
                                "text",

                            pointerEvents:
                                "auto",

                            touchAction:
                                "text",

                            zIndex:
                                100000

                        }}

                    />

                )
            }


            {editingNote !== null &&
                objects[
                    editingNote
                ]?.type ===
                    "note" && (

                    <textarea

                        ref={
                            noteInputRef
                        }

                        value={
                            objects[
                                editingNote
                            ].text
                        }

                        onChange={
                            e =>
                                updateNote(
                                    editingNote,
                                    e.target.value
                                )
                        }

                        onBlur={() =>
                            setEditingNote(
                                null
                            )
                        }

                        onKeyDown={
                            e => {

                                if (
                                    e.key ===
                                    "Escape"
                                ) {

                                    setEditingNote(
                                        null
                                    );

                                }

                            }
                        }

                        autoFocus

                        placeholder={
                            "Type here..."
                        }

                        onContextMenu={
                            e =>
                                handleEditingContextMenu(
                                    "note",
                                    editingNote,
                                    e
                                )
                        }

                        style={{

                            position:
                                "fixed",

                            left:
                                (() => {
                                    const object = objects[editingNote];
                                    const position =
                                        getScreenPosition(
                                            object.x + 10 * (object.scaleX || 1),
                                            object.y + 10 * (object.scaleY || 1)
                                        );
                                    return position.x;
                                })(),

                            top:
                                (() => {
                                    const object = objects[editingNote];
                                    const position =
                                        getScreenPosition(
                                            object.x + 10 * (object.scaleX || 1),
                                            object.y + 10 * (object.scaleY || 1)
                                        );
                                    return position.y;
                                })(),

                            width:
                                176 *
                                (objects[editingNote].scaleX || 1) *
                                (stageRef.current?.scaleX() || 1),

                            height:
                                106 *
                                (objects[editingNote].scaleY || 1) *
                                (stageRef.current?.scaleY() || 1),

                            padding:
                                "0",

                            margin:
                                "0",

                            border:
                                "none",

                            outline:
                                "none",

                            resize:
                                "none",

                            background:
                                "transparent",

                            fontFamily:
                                "Arial, sans-serif",

                            fontSize:
                                18 *
                                (objects[editingNote].scaleY || 1) *
                                (stageRef.current?.scaleY() || 1),

                            lineHeight:
                                1.15,

                            color:
                                "#222",

                            userSelect:
                                "text",

                            WebkitUserSelect:
                                "text",

                            pointerEvents:
                                "auto",

                            touchAction:
                                "text",

                            zIndex:
                                100000

                        }}

                    />

                )
            }


            {!isMobile && (
                <button
                    type="button"
                    className="reference_panel_toggle"
                    style={{
                        right: referencePanelHidden
                            ? "10px"
                            : `calc(${referenceWidth}px - 48px)`
                    }}
                    onClick={() =>
                        setReferencePanelHidden(
                            prev => !prev
                        )
                    }
                    title={
                        referencePanelHidden
                            ? "Show reference and layers panel"
                            : "Hide reference and layers panel"
                    }
                    aria-label={
                        referencePanelHidden
                            ? "Show reference and layers panel"
                            : "Hide reference and layers panel"
                    }
                    aria-expanded={!referencePanelHidden}
                >
                    {referencePanelHidden ? "←" : "→"}
                </button>
            )}

            <div

                className={
                    isMobile
                        ? (
                            mobilePanelOpen
                                ? "reference_panel mobile_open"
                                : "reference_panel mobile_closed"
                        )
                        : (
                            referencePanelHidden
                                ? "reference_panel reference_hidden"
                                : "reference_panel"
                        )
                }

                style={{
                    width:
                        `${referenceWidth}px`
                }}

            >

                <div

                    className={
                        "reference_resize"
                    }

                    onMouseDown={
                        startResize
                    }

                />


                <div className="mobile_reference_header">
                    <h2>
                        Reference
                    </h2>

                    <button
                        type="button"
                        className="reference_back_button"
                        onClick={goToMainMenu}
                        title="Back to main menu"
                        aria-label="Back to main menu"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M4 3.5h12.5v17H4z" />
                            <path d="M16.5 7H20v10h-3.5" />
                            <circle cx="13" cy="12" r=".8" />
                        </svg>
                    </button>
                </div>


                <h2 className="reference_image_heading">Reference Image</h2>

                <label className="reference_upload">

                    Upload Image

                    <input

                        type="file"

                        accept="image/*"

                        onChange={
                            handleReferenceUpload
                        }

                    />

                </label>


                <div className="reference_grid_controls">
                    <label className="reference_grid_toggle">
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={e =>
                                setShowGrid(e.target.checked)
                            }
                        />
                        <span>Show drawing grid</span>
                    </label>

                    <div className="reference_grid_hint">
                        25 pixel spacing
                    </div>
                </div>


                {referenceImage && (

                    <div
                        className={
                            "reference_image"
                        }
                    >

                        <img

                            src={
                                referenceImage
                            }

                            alt="Reference"

                        />

                    </div>

                )}

                <div className="layers_section">

                    <div className="layers_header">

                        <h2>
                            Layers
                        </h2>

                        <div className="layers_header_actions">
                            <button type="button" className="delete_selected_layers_button"
                                disabled={selectedLayerIds.length === 0 || layers.length <= 1}
                                title="Delete selected layers"
                                onClick={() => {
                                    const ids = selectedLayerIds.filter(id => layers.some(layer => layer.id === id));
                                    if (!ids.length || layers.length <= 1) return;
                                    setLayerDeleteConfirm({ layerIds: ids, layerName: `${ids.length} selected layer${ids.length === 1 ? "" : "s"}` });
                                }}>🗑 Delete ({selectedLayerIds.length})</button>
                            <button type="button" className="add_layer_button" onClick={addLayer}>+ Layer</button>
                        </div>

                    </div>


                    <div className="active_layer_info">

                        Active:

                        <strong>
                            {
                                getLayerById(
                                    activeLayerId
                                )?.name ||
                                "Layer 1"
                            }
                        </strong>

                    </div>

                    <div className="layers_list">
                        {(() => {
                            const orderedLayers = layers.slice().reverse();
                            const renderedGroups = new Set();
                            const rows = [];
                            orderedLayers.forEach(layer => {
                                const group = layerGroups.find(item => item.layerIds.includes(layer.id));
                                if (group && !renderedGroups.has(group.id)) {
                                    renderedGroups.add(group.id);
                                    rows.push(
                                        <div key={group.id} className={'layer_group_item' + (draggedGroupId === group.id ? ' dragging' : '')} draggable
                                            onDragStart={e => { setDraggedGroupId(group.id); e.dataTransfer.effectAllowed = 'move'; }}
                                            onDragEnd={() => setDraggedGroupId(null)}
                                            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (draggedGroupId) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const dropAbove = e.clientY < rect.top + rect.height / 2;
                                                    const targetLayerId = group.layerIds.find(id => layers.some(layer => layer.id === id));
                                                    if (targetLayerId) moveGroupToLayer(draggedGroupId, targetLayerId, dropAbove);
                                                    setDraggedGroupId(null);
                                                    return;
                                                }
                                                const movingIds = (draggedLayerIds.length ? draggedLayerIds : (draggedLayerId ? [draggedLayerId] : [])).filter(id => layers.some(layer => layer.id === id));
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const dropIntoGroup = e.clientY >= rect.top + rect.height * 0.28 && e.clientY <= rect.bottom - rect.height * 0.18;
                                                if (dropIntoGroup) {
                                                    movingIds.forEach(id => addLayerToGroup(id, group.id));
                                                } else {
                                                    const targetLayerId = group.layerIds.find(id => layers.some(layer => layer.id === id));
                                                    if (targetLayerId && movingIds.length) {
                                                        const movingSet = new Set(movingIds);
                                                        setLayers(prev => {
                                                            const ordered = [...prev].reverse();
                                                            const moving = ordered.filter(layer => movingSet.has(layer.id));
                                                            const rest = ordered.filter(layer => !movingSet.has(layer.id));
                                                            const targetIndex = rest.findIndex(layer => layer.id === targetLayerId);
                                                            if (targetIndex < 0) return prev;
                                                            rest.splice(targetIndex, 0, ...moving);
                                                            return rest.reverse();
                                                        });
                                                        setLayerGroups(prev => prev.map(item => ({...item, layerIds: item.layerIds.filter(id => !movingSet.has(id))})).filter(item => item.layerIds.length));
                                                    }
                                                }
                                                setDraggedLayerId(null);
                                                setDraggedLayerIds([]);
                                                setDraggedGroupId(null);
                                            }}>
                                            <button type="button" className="layer_group_toggle" onClick={() => toggleGroupCollapsed(group.id)} title={group.collapsed ? 'Expand group' : 'Collapse group'}>{group.collapsed ? '▸' : '▾'}</button>
                                            <img className="layer_group_icon" src="https://raw.githubusercontent.com/nothinkformal/la-peace/refs/heads/version-4/images/lemon.png" alt="" draggable="false" />
                                            {editingGroupId === group.id ? <input autoFocus className="layer_name_input" value={editingGroupName} onChange={e => setEditingGroupName(e.target.value)} onBlur={finishGroupRename} onKeyDown={e => { if (e.key === 'Enter') finishGroupRename(); if (e.key === 'Escape') setEditingGroupId(null); }} onClick={e => e.stopPropagation()} /> : <span className="layer_group_name" onDoubleClick={() => startGroupRename(group)}>{group.name}</span>}
                                            <button type="button" className="layer_control" title={group.visible ? 'Hide group' : 'Show group'} onClick={() => toggleGroupVisibility(group.id)}>{group.visible ? '👁' : '🚫'}</button>
                                            <button type="button" className="layer_control" title="Move group up" onClick={() => moveLayerGroup(group.id, -1)}>↑</button>
                                            <button type="button" className="layer_control" title="Move group down" onClick={() => moveLayerGroup(group.id, 1)}>↓</button>
                                            <button type="button" className="layer_control" title="Ungroup layers" onClick={() => ungroupLayerGroup(group.id)}>↗</button>
                                        </div>
                                    );
                                }
                                if (group?.collapsed) return;
                                const active = selectedLayerIds.includes(layer.id);
                                const dragging = draggedLayerIds.includes(layer.id) || draggedLayerId === layer.id;
                                rows.push(
                                    <div key={layer.id} className={'layer_item' + (active ? ' active' : '') + (selectedLayerIds.includes(layer.id) ? ' multi_selected' : '') + (dragging ? ' dragging' : '') + (group ? ' grouped_layer' : '')}
                                        draggable onDragStart={e => handleLayerDragStart(e, layer.id)} onDragEnd={handleLayerDragEnd}
                                        onDragOver={handleLayerDragOver} onDrop={e => { if (draggedGroupId) { e.preventDefault(); const rect = e.currentTarget.getBoundingClientRect(); moveGroupToLayer(draggedGroupId, layer.id, e.clientY < rect.top + rect.height / 2); setDraggedGroupId(null); } else handleLayerDrop(e, layer.id); }}
                                        onClick={e => {
                                            setActiveLayerId(layer.id);
                                            if (e.ctrlKey || e.metaKey) {
                                                setSelectedLayerIds(prev => prev.includes(layer.id) ? prev.filter(id => id !== layer.id) : [...prev, layer.id]);
                                            } else {
                                                setSelectedLayerIds([layer.id]);
                                            }
                                        }}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!selectedLayerIds.includes(layer.id)) setSelectedLayerIds([layer.id]);
                                            setLayerGroupContextMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
                                        }}
                                        onDoubleClick={() => startLayerRename(layer)}>
                                        <input type="checkbox" className="layer_group_select" aria-label={'Select ' + layer.name + ' for grouping'} checked={selectedLayerIds.includes(layer.id)} onChange={e => setSelectedLayerIds(prev => e.target.checked ? [...new Set([...prev, layer.id])] : prev.filter(id => id !== layer.id))} onClick={e => e.stopPropagation()} />
                                        <span className="layer_drag_handle" title="Drag to reorder">⋮⋮</span>
                                        <button type="button" className="layer_control" title={layer.visible ? 'Hide layer' : 'Show layer'} onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}>{layer.visible ? '👁' : '🚫'}</button>
                                        {editingLayerId === layer.id ? <input autoFocus className="layer_name_input" value={editingLayerName} onChange={e => setEditingLayerName(e.target.value)} onBlur={finishLayerRename} onKeyDown={e => { if (e.key === 'Enter') finishLayerRename(); if (e.key === 'Escape') setEditingLayerId(null); }} onClick={e => e.stopPropagation()} /> : <span className="layer_name">{layer.name}</span>}
                                        <button type="button" className="layer_control delete_layer" title="Delete layer" onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }}>🗑</button>
                                    </div>
                                );
                            });
                            return rows;
                        })()}
                    </div>

                </div>
				
<div className="export_section">
    <h2>Export</h2>
<button type="button" className="export_button" onClick={beginSaveLemove} style={{ marginBottom: 8 }}>Save Animation (.lemove)</button>
                                <button type="button" className="export_button" onClick={beginLoadLemove} style={{ marginBottom: 8 }}>Load Animation (.lemove)</button>
                                <input ref={projectFileInputRef} type="file" accept=".lemove,.lem,application/x-lemove-project,application/x-lem-project" onChange={loadLemoveFile} style={{ display: "none" }} />
                                <button type="button" className="export_button" onClick={openExportSelection}>Export Animation (WebM)</button>
                                <p className="export_hint">Choose the area which will be exported then export all of the frames into one animation.</p>

    <button type="button" className="export_button" onClick={beginSaveLemFile} style={{ marginTop: 8 }}>
        Save Drawing (.lem)
    </button>

    <button type="button" className="export_button" onClick={beginLoadLemFile} style={{ marginTop: 8 }}>
        Load Drawing (.lem)
    </button>
    <input ref={lemFileInputRef} type="file" accept=".lem,application/json,application/x-lem-project+json" onChange={loadLemFile} style={{ display: "none" }} />
</div>

</div>

            {lemDialog && (
                <div style={{ position: "fixed", inset: 0, zIndex: 12000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onMouseDown={e => { if (e.target === e.currentTarget) { setLemDialog(null); setPendingLemFile(null); } }}>
                    <div role="dialog" aria-modal="true" aria-labelledby="lem-dialog-title" style={{ width: "min(420px, 96vw)", background: "#fff", color: "#202020", borderRadius: 14, padding: 22, boxShadow: "0 16px 48px rgba(0,0,0,.4)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <img src="https://raw.githubusercontent.com/nothinkformal/la-peace/refs/heads/version-4/images/lemon.png" alt="LEM" style={{ width: 42, height: 42, objectFit: "contain" }} />
                            <div><h2 id="lem-dialog-title" style={{ margin: 0 }}>{lemDialog === "save" ? "Save encrypted .lem" : lemDialog === "load" ? "Load .lem drawing" : "LEM.CO Lab"}</h2><div style={{ fontSize: 12, color: "#666" }}>LEM.CO Drawing Project</div></div>
                        </div>
                        {lemDialog === "save" && <p style={{ fontSize: 14, lineHeight: 1.5 }}>Your project data will be automatically encrypted inside the .lem file. No password is required. The file contents will not appear as readable project JSON, although this client-side format encryption is not intended to protect secrets from a determined reverse engineer.</p>}
                        {lemDialog === "load" && <p style={{ fontSize: 14, lineHeight: 1.5 }}>The .lem file will be decrypted automatically. Your current canvas is replaced only after the file has been successfully decrypted and validated.</p>}
                        {lemDialogMessage && <p role="status" style={{ fontSize: 13, color: lemDialogMessage.toLowerCase().includes("success") ? "#16713b" : "#b42318", margin: "10px 0" }}>{lemDialogMessage}</p>}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
                            <button type="button" onClick={() => { setLemDialog(null); setPendingLemFile(null); setLemPassword(""); setLemPasswordConfirm(""); }} style={{ border: "1px solid #bbb", background: "#fff", borderRadius: 7, padding: "9px 15px", cursor: "pointer" }}>Cancel</button>
                            {lemDialog === "save" && <button type="button" onClick={saveLemFile} style={{ border: 0, background: "#202020", color: "#fff", borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Save Encrypted File</button>}
                            {lemDialog === "load" && <button type="button" onClick={decryptAndLoadLemFile} style={{ border: 0, background: "#202020", color: "#fff", borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>OK</button>}
                            {lemDialog === "message" && <button type="button" onClick={() => { setLemDialog(null); setLemDialogMessage(""); }} style={{ border: 0, background: "#202020", color: "#fff", borderRadius: 7, padding: "9px 18px", cursor: "pointer" }}>OK</button>}
                        </div>
                    </div>
                </div>
            )}

            {exportSelection && (
                <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.68)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div style={{ background: "#fff", color: "#222", borderRadius: 12, padding: 20, width: "min(560px, 95vw)", boxShadow: "0 12px 40px rgba(0,0,0,.35)" }}>
                        <h2 style={{ margin: "0 0 8px" }}>Choose animation export area</h2>
                        <p style={{ margin: "0 0 16px", color: "#555", fontSize: 14 }}>Move or resize the blue rectangle. Only this area of every animation frame will be included in the WebM export.</p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>Width (px)
                                <input type="number" min="50" max={Math.floor(stageRef.current?.width() || 500)} value={Math.round(exportCrop.width)} onChange={e => setExportCrop(c => clampExportCrop({ ...c, width: Number(e.target.value) || 50 }))} style={{ width: 120, padding: 7 }} />
                            </label>
                            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>Height (px)
                                <input type="number" min="50" max={Math.floor(stageRef.current?.height() || 500)} value={Math.round(exportCrop.height)} onChange={e => setExportCrop(c => clampExportCrop({ ...c, height: Number(e.target.value) || 50 }))} style={{ width: 120, padding: 7 }} />
                            </label>
                        </div>
                        <div style={{ position: "relative", width: "100%", aspectRatio: `${exportSelection.width} / ${exportSelection.height}`, maxHeight: "45vh", backgroundColor: "#fff", backgroundImage: exportPreview ? `url(${exportPreview})` : "none", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden", marginBottom: 16, touchAction: "none" }}>
                            <div style={{ position: "absolute", left: `${(exportCrop.x / Math.max(1, exportSelection.width)) * 100}%`, top: `${(exportCrop.y / Math.max(1, exportSelection.height)) * 100}%`, width: `${(exportCrop.width / Math.max(1, exportSelection.width)) * 100}%`, height: `${(exportCrop.height / Math.max(1, exportSelection.height)) * 100}%`, boxSizing: "border-box", border: "2px solid #2684ff", background: "rgba(38,132,255,0.08)", cursor: "move", touchAction: "none" }} onPointerDown={e => startExportCropDrag(e, "move")}>
                                <span style={{ position: "absolute", left: 4, top: 4, background: "#2684ff", color: "white", fontSize: 11, padding: "2px 5px", borderRadius: 3, pointerEvents: "none" }}>{Math.round(exportCrop.width)} × {Math.round(exportCrop.height)}</span>
                                <div title="Resize export area" onPointerDown={e => startExportCropDrag(e, "resize")} style={{ position: "absolute", right: -2, bottom: -2, width: 16, height: 16, background: "#2684ff", border: "2px solid white", borderRadius: 3, cursor: "nwse-resize", touchAction: "none" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button type="button" onClick={() => setExportSelection(null)} style={{ padding: "9px 14px", border: "1px solid #ccc", borderRadius: 6, background: "white", cursor: "pointer" }}>Cancel</button>
                            <button type="button" onClick={exportAnimationVideo} style={{ padding: "9px 14px", border: 0, borderRadius: 6, background: "#4169e1", color: "white", cursor: "pointer" }}>Export Animation (WebM)</button>
                        </div>
                    </div>
                </div>
            )}

            {layerDeleteConfirm && (
                <div
                    className="layer_delete_overlay"
                    onMouseDown={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                >
                    <div className="layer_delete_dialog">
                        <div className="layer_delete_title">
                            Delete Layer?
                        </div>

                        <div className="layer_delete_message">
                            Delete <strong>"{layerDeleteConfirm.layerName}"</strong>
                            and everything on it?
                        </div>

                        <div className="layer_delete_actions">
                            <button
                                type="button"
                                className="layer_delete_cancel"
                                onClick={() => setLayerDeleteConfirm(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="layer_delete_confirm"
                                onClick={confirmDeleteLayer}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {layerGroupContextMenu && (
                <>
                    <div className="layer_group_context_dismiss" onMouseDown={() => setLayerGroupContextMenu(null)} onClick={() => setLayerGroupContextMenu(null)} onContextMenu={e => { e.preventDefault(); setLayerGroupContextMenu(null); }} />
                    <div className="layer_group_context_menu" style={{ left: Math.max(8, Math.min(layerGroupContextMenu.x, window.innerWidth - 245)), top: Math.max(8, Math.min(layerGroupContextMenu.y, window.innerHeight - 255)) }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onContextMenu={e => e.preventDefault()}>
                        <div className="layer_group_context_title">Layer options ({selectedLayerIds.length || 1} selected)</div>
                        <button type="button" className="layer_group_context_action" disabled={selectedLayerIds.filter(id => layers.some(layer => layer.id === id) && !layerGroups.some(group => group.layerIds.includes(id))).length < 2} onClick={() => { createLayerGroup(); setLayerGroupContextMenu(null); }}>
                            <img className="layer_group_context_lemon_icon" src={LEM_ICON_URL} alt="" draggable="false" /> Group selected layers
                        </button>
                        <button type="button" className="layer_group_context_action layer_group_context_delete_action" disabled={!selectedLayerIds.some(id => layers.some(layer => layer.id === id)) || layers.length <= selectedLayerIds.filter(id => layers.some(layer => layer.id === id)).length} onClick={() => { const ids = selectedLayerIds.filter(id => layers.some(layer => layer.id === id)); if (!ids.length) { setLayerGroupContextMenu(null); return; } setLayerDeleteConfirm({ layerIds: ids, layerName: `${ids.length} selected layer${ids.length === 1 ? "" : "s"}` }); setLayerGroupContextMenu(null); }}>
                            <span aria-hidden="true">🗑</span> Delete selected layers
                        </button>
                        <button type="button" className="layer_group_context_action" disabled={!selectedLayerIds.length} onClick={() => { const ids = new Set(selectedLayerIds); setLayers(prev => prev.map(layer => ids.has(layer.id) ? { ...layer, visible: true } : layer)); setLayerGroups(prev => prev.map(group => group.layerIds.some(id => ids.has(id)) ? { ...group, visible: true } : group)); setLayerGroupContextMenu(null); }}>
                            <span>👁</span> Show selected layers
                        </button>
                        <button type="button" className="layer_group_context_action" disabled={!selectedLayerIds.length} onClick={() => { const ids = new Set(selectedLayerIds); setLayers(prev => prev.map(layer => ids.has(layer.id) ? { ...layer, visible: false } : layer)); setLayerGroups(prev => prev.map(group => group.layerIds.some(id => ids.has(id)) ? { ...group, visible: false } : group)); if (ids.has(activeLayerId)) { const replacement = layers.find(layer => !ids.has(layer.id) && layer.visible); if (replacement) setActiveLayerId(replacement.id); } setLayerGroupContextMenu(null); }}>
                            <span>🚫</span> Hide selected layers
                        </button>
                        <div className="layer_group_context_separator" />
                        <button type="button" className="layer_group_context_action" disabled={!selectedLayerIds.some(id => layerGroups.some(group => group.layerIds.includes(id)))} onClick={() => { const ids = new Set(selectedLayerIds); const groupsToUngroup = layerGroups.filter(group => group.layerIds.some(id => ids.has(id))).map(group => group.id); setLayerGroups(prev => prev.filter(group => !groupsToUngroup.includes(group.id))); setLayers(prev => prev.map(layer => groupsToUngroup.includes(layer.groupId) ? { ...layer, groupId: null } : layer)); setLayerGroupContextMenu(null); }}>
                            <span>↗</span> Ungroup selected layer groups
                        </button>
                    </div>
                </>
            )}

            {layerContextMenu && (
                <div
                    className={`layer_context_menu ${layers.length > 8 ? "has-many-layers" : ""}`}
                    style={{
                        position: "fixed",
                        left: Math.max(8, Math.min(layerContextMenu.x, window.innerWidth - 230)),
                        top: Math.max(8, Math.min(layerContextMenu.y, window.innerHeight - 140)),
                        zIndex: 5000,
                        // Only constrain the menu when it has more than eight layer destinations.
                        ...(layers.length > 8 ? {
                            maxHeight: "min(55vh, calc(100dvh - 120px))",
                            height: "min(55vh, calc(100dvh - 120px))",
                            overflowY: "auto",
                            overflowX: "hidden",
                            overscrollBehavior: "contain",
                            scrollbarWidth: "auto",
                            scrollbarColor: "#6f6a60 #f2eee5",
                            WebkitOverflowScrolling: "touch"
                        } : {
                            height: "auto",
                            maxHeight: "none",
                            overflowY: "visible",
                            overflowX: "visible"
                        })
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                >
                    <div className="layer_context_title">Selected Elements</div>

                    <button
                        type="button"
                        className="layer_context_item"
                        onClick={openRecolorPicker}
                    >
                        <span>●</span>
                        <span>Recolor</span>
                    </button>

                    {recolorPickerOpen && (
                        <div className="context_recolor_picker">
                            <label className="context_recolor_label">
                                <span>Color</span>
                                <input
                                    className="context_recolor_color"
                                    type="color"
                                    value={recolorDraftColor}
                                    onChange={e =>
                                        setRecolorDraftColor(
                                            e.target.value
                                        )
                                    }
                                    aria-label="Choose recolor"
                                />
                            </label>

                            <button
                                type="button"
                                className="context_recolor_done"
                                onClick={finishRecolor}
                            >
                                Done
                            </button>
                        </div>
                    )}

                    <div className="context_transparency">
                        <div className="context_transparency_header">
                            <span>Transparency</span>
                            <span className="context_transparency_value">
                                {transparencyDraft.toFixed(2)}
                            </span>
                        </div>

                        <input
                            className="context_transparency_slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={transparencyDraft}
                            onChange={e =>
                                setTransparencyDraft(
                                    Number(e.target.value)
                                )
                            }
                            aria-label="Element transparency"
                        />

                        <div className="context_transparency_scale">
                            <span>0 = visible</span>
                            <span>1 = invisible</span>
                        </div>

                        <button
                            type="button"
                            className="context_transparency_done"
                            onClick={finishTransparency}
                        >
                            Done
                        </button>
                    </div>

                    <div className="layer_context_subtitle">Move to Layer</div>

                    {layers
                        .slice()
                        .reverse()
                        .map(layer => (
                            <button
                                key={layer.id}
                                type="button"
                                className="layer_context_item"
                                onClick={() => moveSelectedToLayer(layer.id)}
                            >
                                <span>{layer.visible ? "👁" : "🚫"}</span>
                                <span>{layer.name}</span>
                            </button>
                        ))}
                </div>
            )}

            <div className={`bottom_toolbar ${toolbarHidden ? "toolbar_is_hidden" : ""}`}>
                <button
                    type="button"
                    className="toolbar_visibility_toggle"
                    onClick={() => setToolbarHidden(value => !value)}
                    title={toolbarHidden ? "Show drawing toolbar" : "Hide drawing toolbar"}
                    aria-label={toolbarHidden ? "Show drawing toolbar" : "Hide drawing toolbar"}
                >
                    {toolbarHidden ? "↑" : "↓"}
                </button>

                {isMobile && selectedElements.length > 0 && (
                    <button
                        type="button"
                        className="mobile_panel_button"
                        onClick={openMobileLayerMenu}
                        title="Move selected objects to another layer"
                        aria-label="Move selected objects to another layer"
                    >
                        <span className="toolbar_icon mobile_layers_icon" aria-hidden="true">≡</span>
                        <span className="toolbar_sr_text">Move Layer</span>
                    </button>
                )}

                {isMobile && (
                    <button
                        type="button"
                        className="mobile_panel_button"
                        onClick={() =>
                            setMobilePanelOpen(
                                prev => !prev
                            )
                        }
                        title={mobilePanelOpen ? "Close reference and layers panel" : "Open reference and layers panel"}
                        aria-label={mobilePanelOpen ? "Close reference and layers panel" : "Open reference and layers panel"}
                    >
                        <span className="toolbar_icon" aria-hidden="true">
                            {mobilePanelOpen ? "×" : "≡"}
                        </span>
                        <span className="toolbar_sr_text">
                            {mobilePanelOpen ? "Close Panel" : "Layers / Ref"}
                        </span>
                    </button>
                )}

                <button
                    type="button"
                    className="toolbar_button toolbar_undo"
                    onClick={undo}
                    title="Undo"
                    aria-label="Undo"
                >
                    <svg className="toolbar_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 7H4l3.5-3.5M4 7c7.8-2.2 13.5.7 13.5 6.5 0 3.2-2.3 5.5-5.5 5.5H9" />
                    </svg>
                </button>

                <button
                    type="button"
                    className="toolbar_button toolbar_redo"
                    onClick={redo}
                    title="Redo"
                    aria-label="Redo"
                >
                    <svg className="toolbar_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 7h5l-3.5-3.5M20 7c-7.8-2.2-13.5.7-13.5 6.5 0 3.2 2.3 5.5 5.5 5.5h3" />
                    </svg>
                </button>

                <div className="zoom_controls">

                    <button
                        type="button"
                        onClick={() => zoomCanvas(zoom / 1.1)}
                        title="Zoom out"
                        aria-label="Zoom out"
                    >
                        −
                    </button>

                    <span>{Math.round(zoom * 100)}%</span>

                    <button
                        type="button"
                        onClick={() => zoomCanvas(zoom * 1.1)}
                        title="Zoom in"
                        aria-label="Zoom in"
                    >
                        +
                    </button>

                </div>

                <button
                    type="button"
                    className={
                        "toolbar_button toolbar_drag " +
                        (
                            tool === "select"
                                ? "active"
                                : ""
                        )
                    }
                    onClick={() => {
                        setTool("select");
                        setPendingInsert(null);
                    }}
                    title="Drag / Select"
                    aria-label="Drag / Select"
                >
                    <svg className="toolbar_svg toolbar_drag_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10M11 9V4.5a1.5 1.5 0 0 1 3 0V10M14 9V6a1.5 1.5 0 0 1 3 0v5M17 11V9.5a1.5 1.5 0 0 1 3 0v4.3c0 4.5-2.7 7.2-6.8 7.2H11c-2 0-3.4-.8-4.5-2.2L4 15.5a1.5 1.5 0 0 1 2.2-2l1.8 1.6V11" />
                    </svg>
                </button>

                <div
                    className={
                        "toolbar_pen_control " +
                        (brushMenuOpen ? "open" : "")
                    }
                >
                    <button
                        type="button"
                        className={
                            "toolbar_button toolbar_pen " +
                            (tool === "pen" || brushMenuOpen ? "active" : "")
                        }
                        onClick={() => {
                            setTool("pen");
                            setPendingInsert(null);
                            setSelectedElements([]);
                            setBrushMenuOpen(prev => !prev);
                        }}
                        title="Pen / Brushes"
                        aria-label="Pen / Brushes"
                        aria-expanded={brushMenuOpen}
                    >
                        <svg className="toolbar_svg toolbar_pen_svg" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 19l1.7-4.9L15.9 4.9a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L9.9 17.3 5 19z" />
                            <path d="M14.6 6.2l3.2 3.2" />
                            <path d="M5 19l4.9-1.7" />
                        </svg>
                    </button>

                    {brushMenuOpen && (
                        <div
                            className="brush_menu_popover"
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="brush_menu_title">Brushes</div>

                            <div className="brush_menu_list">
                                {brushOptions.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={
                                            "brush_option " +
                                            (brushType === option.id ? "selected" : "")
                                        }
                                        onClick={() => selectBrush(option.id)}
                                    >
                                        <span className={"brush_preview brush_preview_" + option.id}>
                                            <span />
                                        </span>
                                        <span className="brush_option_text">
                                            <strong>{option.name}</strong>
                                            <small>{option.description}</small>
                                        </span>
                                        {brushType === option.id && (
                                            <span className="brush_option_check">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="brush_menu_done"
                                onClick={finishBrushSelection}
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className={
                        "toolbar_button toolbar_eraser " +
                        (
                            tool === "eraser"
                                ? "active"
                                : ""
                        )
                    }
                    onClick={() => {
                        setTool("eraser");
                        setPendingInsert(null);
                        setSelectedElements([]);
                    }}
                    title="Eraser"
                    aria-label="Eraser"
                >
                    <svg className="toolbar_svg toolbar_eraser_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4.5 15.8l8.9-8.9a2.2 2.2 0 0 1 3.1 0l3.6 3.6a2.2 2.2 0 0 1 0 3.1L15.3 18.4H8.1l-3.6-2.6z" />
                        <path d="M8.1 18.4l4.4-4.4" />
                        <path d="M15.3 18.4h4.2" />
                    </svg>
                </button>

                <button
                    type="button"
                    className={
                        "toolbar_button toolbar_fill " +
                        (
                            tool === "fill"
                                ? "active"
                                : ""
                        )
                    }
                    onClick={() => {
                        setTool("fill");
                        setPendingInsert(null);
                        setSelectedElements([]);
                    }}
                    title="Fill"
                    aria-label="Fill"
                >
                    <svg className="toolbar_svg toolbar_fill_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5.2 8.2h12.1l-1.4 9.1a2 2 0 0 1-2 1.7H8.6a2 2 0 0 1-2-1.7L5.2 8.2z" />
                        <path d="M4.2 8.2h14.1" />
                        <path d="M7.2 8.2V6.8a4 4 0 0 1 7.9 0v1.4" />
                        <path d="M17.7 14.8c1.2.3 1.9 1.1 1.9 2.2" />
                        <path d="M19.6 17v.1" />
                    </svg>
                </button>

                <div className="shape_menu">

                    <button
                        type="button"
                        className={
                            "toolbar_button toolbar_shapes " +
                            (
                                pendingInsert?.type === "shape"
                                    ? "active"
                                    : ""
                            )
                        }
                        title="Shapes"
                        aria-label="Shapes"
                    >
                        <svg className="toolbar_svg" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="8" cy="9" r="4" />
                            <rect x="12" y="11" width="7" height="7" rx="1" />
                        </svg>
                    </button>

                    <div className="shape_dropdown">

                        <div className="shape_grid">

                            <button type="button" onClick={() => chooseShape("square")}>□<span>Square</span></button>
                            <button type="button" onClick={() => chooseShape("circle")}>○<span>Circle</span></button>
                            <button type="button" onClick={() => chooseShape("triangle")}>△<span>Triangle</span></button>
                            <button type="button" onClick={() => chooseShape("diamond")}>◇<span>Diamond</span></button>
                            <button type="button" onClick={() => chooseShape("hexagon")}>⬡<span>Hexagon</span></button>
                            <button type="button" onClick={() => chooseShape("oval")}>⬭<span>Oval</span></button>
                            <button type="button" onClick={() => chooseShape("parallelogram")}>▱<span>Parallelogram</span></button>
                            <button type="button" onClick={() => chooseShape("star")}>☆<span>Star</span></button>
                            <button type="button" onClick={() => chooseShape("cloud")}>☁<span>Cloud</span></button>
                            <button type="button" onClick={() => chooseShape("heart")}>♡<span>Heart</span></button>
                            <button type="button" onClick={() => chooseShape("incorrect")}>☐<span>Incorrect</span></button>
                            <button type="button" onClick={() => chooseShape("correct")}>☑<span>Correct</span></button>
                            <button type="button" onClick={() => chooseShape("leftArrow")}>←<span>Left</span></button>
                            <button type="button" onClick={() => chooseShape("upArrow")}>↑<span>Up</span></button>
                            <button type="button" onClick={() => chooseShape("downArrow")}>↓<span>Down</span></button>
                            <button type="button" onClick={() => chooseShape("rightArrow")}>→<span>Right</span></button>

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    className={
                        "toolbar_button toolbar_text " +
                        (
                            pendingInsert?.type === "text"
                                ? "active"
                                : ""
                        )
                    }
                    onClick={chooseText}
                    title="Text"
                    aria-label="Text"
                >
                    <span className="toolbar_text_letter" aria-hidden="true">T</span>
                </button>

                <button
                    type="button"
                    className={
                        "toolbar_button toolbar_note " +
                        (
                            pendingInsert?.type === "note"
                                ? "active"
                                : ""
                        )
                    }
                    onClick={chooseNote}
                    title="Note"
                    aria-label="Note"
                >
                    <svg className="toolbar_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 3.5h9l4 4V20.5H6z" />
                        <path d="M15 3.5v5h4M9 13h6M9 16h6" />
                    </svg>
                </button>

                <label
                    className="toolbar_button toolbar_image image_button"
                    title="Add image"
                    aria-label="Add image"
                >
                    <svg className="toolbar_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3.5" y="5" width="17" height="14" rx="2" />
                        <circle cx="9" cy="10" r="1.7" />
                        <path d="M5.5 17l4.5-4.5 3 3 2.2-2.2 3.3 3.7M18 3v6M15 6h6" />
                    </svg>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={addImage}
                    />
                </label>

                <div
                    className={
                        "toolbar_color_control " +
                        (frequentColorsOpen ? "open" : "")
                    }
                >

                    <button
                        type="button"
                        className="toolbar_button toolbar_color"
                        title="Brush colour"
                        aria-label="Brush colour"
                        aria-expanded={frequentColorsOpen}
                        onClick={e => {
                            e.stopPropagation();

                            if (frequentColorsOpen) {
                                cancelFrequentColorSelection();
                            } else {
                                openFrequentColors();
                            }
                        }}
                    >
                        <svg className="toolbar_svg toolbar_color_svg" viewBox="0 0 24 24" aria-hidden="true">
                            <circle
                                cx="12"
                                cy="12"
                                r="7"
                                style={{
                                    fill: color,
                                    stroke: "#fff"
                                }}
                            />
                        </svg>
                    </button>

                    {frequentColorsOpen && (
                        <div
                            className="frequent_colors_popup"
                            onMouseDown={e =>
                                e.stopPropagation()
                            }
                        >
                            <div className="frequent_colors_title">
                                Frequent colours
                            </div>

                            <button
                                type="button"
                                className="frequent_custom_color"
                                onClick={e => {
                                    e.stopPropagation();
                                    customColorInputRef.current?.click();
                                }}
                            >
                                <span>Custom colour</span>
                                <span
                                    className="frequent_custom_color_preview"
                                    style={{
                                        backgroundColor: draftColor
                                    }}
                                />
                            </button>

                            <input
                                ref={customColorInputRef}
                                className="frequent_hidden_color_input"
                                type="color"
                                value={draftColor}
                                onChange={e =>
                                    selectDraftColor(
                                        e.target.value
                                    )
                                }
                            />

                            <div className="frequent_colors_grid">
                                {frequentColors.map(
                                    frequentColor => (
                                        <button
                                            key={frequentColor}
                                            type="button"
                                            className={
                                                "frequent_color_swatch " +
                                                (
                                                    frequentColor === draftColor
                                                        ? "active"
                                                        : ""
                                                )
                                            }
                                            style={{
                                                backgroundColor:
                                                    frequentColor
                                            }}
                                            title={frequentColor}
                                            aria-label={
                                                "Use brush colour " +
                                                frequentColor
                                            }
                                            onClick={() =>
                                                selectDraftColor(
                                                    frequentColor
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>

                            <div className="frequent_color_footer">
                                <button
                                    type="button"
                                    className="frequent_color_done"
                                    onClick={e => {
                                        e.stopPropagation();
                                        finishFrequentColorSelection();
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                <div
                    className={
                        "toolbar_button toolbar_size " +
                        (brushSizeOpen ? "open" : "")
                    }
                    title="Brush size"
                    aria-label="Brush size"
                    role="button"
                    tabIndex={0}
                    onClick={e => {
                        e.stopPropagation();
                        setBrushSizeOpen(prev => !prev);
                    }}
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setBrushSizeOpen(prev => !prev);
                        }

                        if (e.key === "Escape") {
                            e.preventDefault();
                            setBrushSizeOpen(false);
                        }
                    }}
                >
                    <svg className="toolbar_svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14M8 8v8M16 9.5v5" />
                    </svg>

                    <div
                        className="brush_size_popover"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="brush_size_value">
                            {brushSize}px
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={brushSize}
                            onClick={e => e.stopPropagation()}
                            onChange={e =>
                                setBrushSize(Number(e.target.value))
                            }
                            aria-label="Brush size"
                        />
                    </div>
                </div>

            </div>

            {toolbarHidden && (
                <button
                    type="button"
                    className="toolbar_reopen_button"
                    onClick={() => setToolbarHidden(false)}
                    title="Show drawing toolbar"
                    aria-label="Show drawing toolbar"
                >
                    ↑
                </button>
            )}

            {/* Animation timeline */}
            <div
                className="animation_timeline"
                style={{ right: `${referenceWidth}px` }}
            >
                <div className="timeline_transport">
                    <strong className="timeline_heading">FRAMES</strong>
                    <div className="timeline_transport_buttons">
                        <button title="Previous frame" aria-label="Previous frame" onClick={() => { const i = frames.findIndex(f => f.id === activeFrameId); if (i > 0) switchToFrame(frames[i - 1].id); }} className="timeline_icon_button"><SkipBack size={15} /></button>
                        <button title={isPlaying ? "Pause playback" : "Play animation"} aria-label={isPlaying ? "Pause playback" : "Play animation"} onClick={() => setIsPlaying(v => !v)} className="timeline_icon_button">{isPlaying ? <Pause size={15} /> : <Play size={15} />}</button>
                        <button title="Next frame" aria-label="Next frame" onClick={() => { const i = frames.findIndex(f => f.id === activeFrameId); if (i < frames.length - 1) switchToFrame(frames[i + 1].id); }} className="timeline_icon_button"><SkipForward size={15} /></button>
                    </div>
                </div>
                <div className="timeline_divider" />
                <div className="timeline_frames">
                    {frames.map((frame, index) => (
                        <button key={frame.id} className={`timeline_frame ${frame.id === activeFrameId ? "is_active" : ""}`} onClick={() => switchToFrame(frame.id)} title={frame.name}>
                            <span className="timeline_frame_number">{index + 1}</span>
                            <span className="timeline_frame_preview">
                                <svg
                                    viewBox={`0 0 ${Math.max(1, stageSize.width)} ${Math.max(1, stageSize.height)}`}
                                    preserveAspectRatio="xMidYMid meet"
                                    aria-hidden="true"
                                >
                                    {(frame.id === activeFrameId ? fills : (frame.fills || [])).map((fill, fillIndex) => {
                                        const points = fill.points || [];
                                        if (points.length < 4) return null;
                                        const pointString = Array.from({ length: Math.floor(points.length / 2) }, (_, i) => `${points[i * 2]},${points[i * 2 + 1]}`).join(" ");
                                        return <polygon key={`${frame.id}-fill-${fillIndex}`} points={pointString} fill={fill.color || fill.fill || "#222"} stroke="none" />;
                                    })}
                                    {(frame.id === activeFrameId ? lines : (frame.lines || [])).map((line, lineIndex) => {
                                        const raw = line.points || [];
                                        if (raw.length < 4) return null;
                                        const pts = Array.from({ length: Math.floor(raw.length / 2) }, (_, i) => ({ x: Number(raw[i * 2]), y: Number(raw[i * 2 + 1]) }));
                                        if (pts.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return null;
                                        // Match the canvas's smoothed Konva strokes instead of using sharp SVG polylines.
                                        let path = `M ${pts[0].x} ${pts[0].y}`;
                                        if (pts.length === 2) {
                                            path += ` L ${pts[1].x} ${pts[1].y}`;
                                        } else {
                                            for (let i = 0; i < pts.length - 1; i++) {
                                                const p0 = pts[Math.max(0, i - 1)];
                                                const p1 = pts[i];
                                                const p2 = pts[i + 1];
                                                const p3 = pts[Math.min(pts.length - 1, i + 2)];
                                                const tension = Number.isFinite(Number(line.tension)) ? Number(line.tension) : 0.45;
                                                const c1x = p1.x + (p2.x - p0.x) * tension / 3;
                                                const c1y = p1.y + (p2.y - p0.y) * tension / 3;
                                                const c2x = p2.x - (p3.x - p1.x) * tension / 3;
                                                const c2y = p2.y - (p3.y - p1.y) * tension / 3;
                                                path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
                                            }
                                        }
                                        const brush = line.brushType || "basic";
                                        const brushSettings = {
                                            basic: { width: 1, opacity: 1, dash: undefined },
                                            pencil: { width: 0.72, opacity: 0.72, dash: undefined },
                                            marker: { width: 2.1, opacity: 0.55, dash: undefined },
                                            ink: { width: 1, opacity: 0.95, dash: undefined },
                                            airbrush: { width: 1.4, opacity: 0.24, dash: undefined },
                                            chalk: { width: 0.9, opacity: 0.58, dash: "3 5" }
                                        }[brush] || { width: 1, opacity: 1, dash: undefined };
                                        return <path key={`${frame.id}-preview-${lineIndex}`} d={path} fill="none" stroke={line.stroke || line.color || "#202020"} strokeWidth={Math.max(0.25, Number(line.strokeWidth) || 1) * brushSettings.width} strokeOpacity={(line.opacity ?? 1) * brushSettings.opacity} strokeDasharray={brushSettings.dash} strokeLinecap="round" strokeLinejoin="round" />;
                                    })}
                                    {(frame.id === activeFrameId ? objects : (frame.objects || [])).map((object, objectIndex) => {
                                        const common = { key: `${frame.id}-object-${objectIndex}`, fill: object.fill && object.fill !== "transparent" ? object.fill : "none", stroke: object.stroke || object.fill || "#202020", strokeWidth: Math.max(1, Number(object.strokeWidth) || 2), vectorEffect: "non-scaling-stroke" };
                                        const x = Number(object.x) || 0;
                                        const y = Number(object.y) || 0;
                                        if (object.type === "text" || object.type === "note") {
                                            return <text {...common} x={x} y={y + (Number(object.fontSize) || 12)} fill={object.fill || "#202020"} stroke="none" fontSize={Math.max(6, Number(object.fontSize) || 12)}>{String(object.text || "").slice(0, 40)}</text>;
                                        }
                                        if (object.type === "circle") return <circle {...common} cx={x} cy={y} r={Number(object.radius) || 12} />;
                                        if (object.type === "oval") return <ellipse {...common} cx={x} cy={y} rx={Number(object.radiusX) || 16} ry={Number(object.radiusY) || 10} />;
                                        if (object.type === "triangle" || object.type === "diamond" || object.type === "hexagon") {
                                            const sides = object.type === "triangle" ? 3 : object.type === "diamond" ? 4 : 6;
                                            const radius = Number(object.radius) || 16;
                                            const pts = Array.from({ length: sides }, (_, i) => {
                                                const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
                                                return `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
                                            }).join(" ");
                                            return <polygon {...common} points={pts} />;
                                        }
                                        if (object.type === "star") {
                                            const outer = Number(object.outerRadius) || 18, inner = Number(object.innerRadius) || 8, n = Number(object.numPoints) || 5;
                                            const pts = Array.from({ length: n * 2 }, (_, i) => {
                                                const angle = (Math.PI * i / n) - Math.PI / 2;
                                                const radius = i % 2 ? inner : outer;
                                                return `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
                                            }).join(" ");
                                            return <polygon {...common} points={pts} />;
                                        }
                                        if (object.width || object.height) return <rect {...common} x={x} y={y} width={Number(object.width) || 24} height={Number(object.height) || 24} />;
                                        return null;
                                    })}
                                </svg>
                            </span>
                        </button>
                    ))}
                </div>
                <div className="timeline_frame_actions">
                    <button onClick={() => addAnimationFrame(false)} className="timeline_icon_button" title="Add blank frame" aria-label="Add blank frame"><Plus size={16} /></button>
                    <button onClick={() => addAnimationFrame(true)} className="timeline_icon_button" title="Duplicate current frame" aria-label="Duplicate current frame"><CopyPlus size={16} /></button>
                    <button onClick={() => deleteAnimationFrame(activeFrameId)} disabled={frames.length <= 1} className="timeline_icon_button" title="Delete current frame" aria-label="Delete current frame"><Trash2 size={15} /></button>
                </div>
                <div className="timeline_options">
                    <label className={`timeline_checkbox ${onionSkinEnabled ? "is_enabled" : ""}`} title="Show neighboring frames as faint guides">
                        <Layers3 size={15} aria-hidden="true" />
                        <input type="checkbox" checked={onionSkinEnabled} onChange={e => setOnionSkinEnabled(e.target.checked)} />
                        <span>Onion skin</span>
                    </label>
                    <label className="timeline_fps" title="Custom playback speed in frames per second"><Gauge size={16} aria-hidden="true" /><span>FPS</span><input aria-label="Frames per second" type="number" inputMode="decimal" min="1" max="60" step="0.1" value={playbackFps} onChange={e => { const raw = e.target.value; if (raw === "") { setPlaybackFps(""); return; } const value = Number(raw); if (Number.isFinite(value)) setPlaybackFps(Math.max(1, Math.min(60, value))); }} onBlur={() => setPlaybackFps(value => value === "" || !Number.isFinite(Number(value)) ? 12 : Math.max(1, Math.min(60, Number(value))))} /></label>
                </div>
            </div>

            {projectDialog && (
                <div className="lemove_dialog_backdrop" role="presentation" onMouseDown={event => {
                    if (event.target === event.currentTarget) { setProjectDialog(null); pendingProjectFileRef.current = null; }
                }}>
                    <div className="lemove_dialog" role="dialog" aria-modal="true" aria-labelledby="lemove-dialog-title">
                        <div className="lemove_dialog_brand">
                            <strong id="lemove-dialog-title">{projectDialog === "save" ? "Save Animation Project" : projectDialog === "load" ? "Load Animation Project" : "LEM.CO Animation Lab"}</strong>
                            <span>LEM.CO · Animation Lab</span>
                        </div>
                        {projectDialog === "save" && <p>Save all frames, artwork, layers, layer groups, playback speed, and onion-skin settings in an encrypted <code>.lemove</code> file. No password is required. This format encryption obscures the project data but is not intended to protect secrets from a determined reverse engineer.</p>}
                        {projectDialog === "load" && <p>The selected <code>.lemove</code> project will replace the current animation only after it has been decrypted and validated.</p>}
                        {projectDialogMessage && <p className={`lemove_dialog_message ${projectDialogMessage.toLowerCase().includes("successfully") ? "success" : ""}`} role="status">{projectDialogMessage}</p>}
                        <div className="lemove_dialog_actions">
                            <button type="button" onClick={() => { setProjectDialog(null); pendingProjectFileRef.current = null; }}>Cancel</button>
                            {projectDialog === "save" && <button type="button" className="primary" onClick={saveLemoveFile}>Save .lemove</button>}
                            {projectDialog === "load" && <button type="button" className="primary" onClick={importLemoveFile}>Load Project</button>}
                            {projectDialog === "message" && <button type="button" className="primary" onClick={() => setProjectDialog(null)}>OK</button>}
                        </div>
                    </div>
                </div>
            )}

        </div>

    );

}

export default App;
