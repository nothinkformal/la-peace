import { useEffect, useRef, useState } from "react";
import Konva from "konva";

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

    const [draggedLayerId, setDraggedLayerId] =
        useState(null);

    const [editingLayerId, setEditingLayerId] =
        useState(null);

    const [editingLayerName, setEditingLayerName] =
        useState("");


    
    
    

    const [history, setHistory] = useState([]);
    const [redoHistory, setRedoHistory] = useState([]);


    
    
    

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
            width: window.innerWidth,
            height: window.innerHeight - 90
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


    useEffect(() => {
        let cancelled = false;
        const restoreProject = async () => {
            try {
                const raw = localStorage.getItem(persistenceKey);
                if (raw) {
                    const saved = JSON.parse(raw);
                    const [restoredObjects, restoredFills] = await Promise.all([
                        Promise.all((saved.objects || []).map(async object => ({
                            ...object,
                            ...(object.imageData ? { image: await restoreImage(object.imageData) } : {}),
                            imageData: undefined
                        }))),
                        Promise.all((saved.fills || []).map(async fill => ({
                            ...fill,
                            image: await restoreImage(fill.imageData),
                            imageData: undefined
                        })))
                    ]);
                    if (cancelled) return;
                    setLines(Array.isArray(saved.lines) ? saved.lines : []);
                    setObjects(restoredObjects.filter(object => object.type !== "image" || object.image));
                    setFills(restoredFills.filter(fill => fill.image));
                    if (Array.isArray(saved.layers) && saved.layers.length) setLayers(saved.layers);
                    if (saved.activeLayerId) setActiveLayerId(saved.activeLayerId);
                    if (typeof saved.referenceImage === "string") setReferenceImage(saved.referenceImage);
                    if (typeof saved.referenceWidth === "number") setReferenceWidth(saved.referenceWidth);
                    if (typeof saved.showGrid === "boolean") setShowGrid(saved.showGrid);
                    if (typeof saved.color === "string") setColor(saved.color);
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
                    layers,
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
    }, [lines, objects, fills, layers, activeLayerId, referenceImage, referenceWidth, showGrid, color]);


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
                width: window.innerWidth,
                height: window.innerHeight - 90
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



    const handleLayerDragStart =
        (e, layerId) => {

            setDraggedLayerId(
                layerId
            );

            e.dataTransfer.effectAllowed =
                "move";

        };

const handleLayerDragEnd = () => {
    setDraggedLayerId(null);
};


    const handleLayerDragOver =
        e => {

            e.preventDefault();

            e.dataTransfer.dropEffect =
                "move";

        };


    const handleLayerDrop =
        (e, targetLayerId) => {

            e.preventDefault();

            if (
                !draggedLayerId ||
                draggedLayerId ===
                    targetLayerId
            ) {

                setDraggedLayerId(null);

                return;

            }


            
            
            const displayOrder =
                [...layers].reverse();


            const fromIndex =
                displayOrder.findIndex(
                    layer =>
                        layer.id ===
                        draggedLayerId
                );


            if (fromIndex === -1) {

                setDraggedLayerId(null);

                return;

            }


            const [
                movedLayer
            ] =
                displayOrder.splice(
                    fromIndex,
                    1
                );


            const targetIndex =
                displayOrder.findIndex(
                    layer =>
                        layer.id ===
                        targetLayerId
                );


            if (targetIndex === -1) {

                setDraggedLayerId(null);

                return;

            }


            const targetElement =
                e.currentTarget;

            const rect =
                targetElement.getBoundingClientRect();

            const dropAbove =
                e.clientY <
                rect.top +
                rect.height / 2;


            const insertIndex =
                dropAbove
                    ? targetIndex
                    : targetIndex + 1;


            displayOrder.splice(
                insertIndex,
                0,
                movedLayer
            );


            
            
            setLayers(
                displayOrder.reverse()
            );


            setDraggedLayerId(null);

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

        const position = getPointerPosition();

        if (!position) {
            return;
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

        const result = floodFillRegion(
            renderedCanvas,
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


    const startFreehandDrawing =
        () => {

            if (
                tool !== "pen" &&
                tool !== "eraser"
            ) {
                return;
            }

            const activeLayer =
                getLayerById(
                    activeLayerId
                );

            if (
                !activeLayer ||
                !activeLayer.visible
            ) {
                return;
            }

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
                    activeLayerId,

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


        if (
            tool !== "select" &&
            !(tool === "fill" && type === "fill")
        ) {
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


    
    
    

    const exportCanvas = () => {

        const stage = stageRef.current;

        if (!stage) return;

        const selectionLayer =
            selectionUiLayerRef.current;

        const transformerLayer =
            transformerUiLayerRef.current;

        const previousSelectionVisibility =
            selectionLayer?.visible() ?? true;

        const previousTransformerVisibility =
            transformerLayer?.visible() ?? true;

        if (selectionLayer) {
            selectionLayer.visible(false);
        }

        if (transformerLayer) {
            transformerLayer.visible(false);
        }

        
        
        const previousScale = stage.scaleX();
        const previousPosition = stage.position();

        stage.scale({
            x: 1,
            y: 1
        });

        stage.position({
            x: 0,
            y: 0
        });

        stage.draw();

        const dataURL = stage.toDataURL({
            pixelRatio: 2,
            mimeType: "image/png"
        });

        stage.scale({
            x: previousScale,
            y: previousScale
        });

        stage.position(previousPosition);

        if (selectionLayer) {
            selectionLayer.visible(
                previousSelectionVisibility
            );
        }

        if (transformerLayer) {
            transformerLayer.visible(
                previousTransformerVisibility
            );
        }

        stage.draw();

        const link = document.createElement("a");
        link.download = "la-peace-lab-drawing.png";
        link.href = dataURL;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

                        fill="transparent"

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

                        fill="transparent"

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

                        fill="transparent"

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

                        fill="transparent"

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

                        fill="transparent"

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

                        fill="transparent"

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

                        fill="transparent"

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

                        fill="transparent"

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

                            fill="transparent"

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

                            fill="transparent"

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

                        fill="transparent"

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
                    min-width: 190px;
                    padding: 6px;
                    background: white;
                    border: 2px solid #222;
                    border-radius: 8px;
                    box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.22);
                    font-family: Arial, sans-serif;
                }

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

                    {isMobile && (
                        <button
                            type="button"
                            className="mobile_panel_close"
                            onClick={() =>
                                setMobilePanelOpen(false)
                            }
                        >
                            Close
                        </button>
                    )}
                </div>


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

                        <button

                            type="button"

                            className={
                                "add_layer_button"
                            }

                            onClick={
                                addLayer
                            }

                        >
                            + Layer
                        </button>

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

                        {layers
                            .slice()
                            .reverse()
                            .map(
                                layer => {

                                    const active =
                                        activeLayerId ===
                                        layer.id;


                                    const dragging =
                                        draggedLayerId ===
                                        layer.id;


                                    return (

                                        <div

                                            key={
                                                layer.id
                                            }

                                            className={

                                                "layer_item" +

                                                (
                                                    active
                                                        ? " active"
                                                        : ""
                                                ) +

                                                (
                                                    dragging
                                                        ? " dragging"
                                                        : ""
                                                )

                                            }

                                            draggable={
                                                true
                                            }

                                            onDragStart={
                                                e =>
                                                    handleLayerDragStart(
                                                        e,
                                                        layer.id
                                                    )
                                            }

                                            onDragEnd={
                                                    handleLayerDragEnd
                                            }

                                            onDragOver={
                                                handleLayerDragOver
                                            }

                                            onDrop={
                                                e =>
                                                    handleLayerDrop(
                                                        e,
                                                        layer.id
                                                    )
                                            }

                                            onClick={() =>
                                                setActiveLayerId(
                                                    layer.id
                                                )
                                            }

                                            onDoubleClick={() =>
                                                startLayerRename(
                                                    layer
                                                )
                                            }

                                        >


                                            <span className="layer_drag_handle">
                                                ⋮⋮
                                            </span>

                                            <button

                                                type="button"

                                                className={
                                                    "layer_control"
                                                }

                                                title={
                                                    layer.visible
                                                        ? "Hide layer"
                                                        : "Show layer"
                                                }

                                                onClick={
                                                    e => {

                                                        e.stopPropagation();

                                                        toggleLayerVisibility(
                                                            layer.id
                                                        );

                                                    }
                                                }

                                            >
                                                {
                                                    layer.visible
                                                        ? "👁"
                                                        : "🚫"
                                                }
                                            </button>


                                            {editingLayerId ===
                                                layer.id ? (

                                                <input

                                                    autoFocus

                                                    className={
                                                        "layer_name_input"
                                                    }

                                                    value={
                                                        editingLayerName
                                                    }

                                                    onChange={
                                                        e =>
                                                            setEditingLayerName(
                                                                e.target.value
                                                            )
                                                    }

                                                    onBlur={
                                                        finishLayerRename
                                                    }

                                                    onKeyDown={
                                                        e => {

                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            ) {

                                                                finishLayerRename();

                                                            }

                                                            if (
                                                                e.key ===
                                                                "Escape"
                                                            ) {

                                                                setEditingLayerId(
                                                                    null
                                                                );

                                                            }

                                                        }
                                                    }

                                                    onClick={
                                                        e =>
                                                            e.stopPropagation()
                                                    }

                                                />

                                            ) : (

                                                <span className="layer_name">

                                                    {
                                                        layer.name
                                                    }

                                                </span>

                                            )}



                                            <button

                                                type="button"

                                                className={
                                                    "layer_control delete_layer"
                                                }

                                                title={
                                                    "Delete layer"
                                                }

                                                onClick={
                                                    e => {

                                                        e.stopPropagation();

                                                        deleteLayer(
                                                            layer.id
                                                        );

                                                    }
                                                }

                                            >
                                                🗑
                                            </button>

                                        </div>

                                    );

                                }
                            )}

                    </div>

                </div>
				
<div className="export_section">
    <h2>Export</h2>

    <button
        type="button"
        className="export_button"
        onClick={exportCanvas}
    >
        Export Canvas
    </button>

    <p className="export_hint">
        Export and Download your canvas as a image
    </p>
</div>

</div>

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

            {layerContextMenu && (
                <div
                    className="layer_context_menu"
                    style={{
                        position: "fixed",
                        left: Math.max(8, Math.min(layerContextMenu.x, window.innerWidth - 230)),
                        top: Math.max(8, Math.min(layerContextMenu.y, window.innerHeight - 410)),
                        zIndex: 5000
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

            <div className="bottom_toolbar">

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

        </div>

    );

}

export default App;