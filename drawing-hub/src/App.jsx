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

    const [brushSize, setBrushSize] =
        useState(5);

    
    
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


    
    
    

    const [editingNote, setEditingNote] =
        useState(null);

    const [editingText, setEditingText] =
        useState(null);

    const noteInputRef =
        useRef(null);

    const textInputRef =
        useRef(null);


    
    
    

    const [selectedElements, setSelectedElements] =
        useState([]);

    
    const [layerContextMenu, setLayerContextMenu] =
        useState(null);

    
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


    
    
    

    const [zoom, setZoom] =
        useState(1);

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;



    
    
    
    
    
    

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
                objects: objects.map(object => ({ ...object }))
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
                objects: objects.map(object => ({ ...object }))
            }
        ]);

        setLines(
            previous.lines.map(line => ({ ...line, points: [...line.points] }))
        );

        setObjects(
            previous.objects.map(object => ({ ...object }))
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
                objects: objects.map(object => ({ ...object }))
            }
        ]);

        setLines(
            next.lines.map(line => ({ ...line, points: [...line.points] }))
        );

        setObjects(
            next.objects.map(object => ({ ...object }))
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


            const newLine = {

                layerId:
                    activeLayerId,

                points: [
                    pos.x,
                    pos.y
                ],

                stroke:
                    tool === "eraser"
                        ? "#000000"
                        : color,

                strokeWidth:
                    brushSize,

                globalCompositeOperation:
                    tool === "eraser"
                        ? "destination-out"
                        : "source-over",

                lineCap:
                    "round",

                lineJoin:
                    "round",

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


    const draw = () => {

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
            getPointerPosition();

        if (!pos) {
            return;
        }


        setLines(prev => {

            if (
                prev.length === 0
            ) {
                return prev;
            }


            const updated = [
                ...prev
            ];


            const last =
                updated[
                    updated.length - 1
                ];


            last.points = [
                ...last.points,
                pos.x,
                pos.y
            ];


            return updated;

        });

    };


    const stopDrawing = () => {

        if (!isDrawing) {
            return;
        }

        setIsDrawing(false);

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


    
    
    
    const handleEditingContextMenu = (type, index, e) => {

        e.preventDefault();
        e.stopPropagation();

        const selection = [{
            type: "object",
            index
        }];

        setSelectedElements(selection);

        setLayerContextMenu({
            x: e.clientX,
            y: e.clientY,
            selection
        });

    };


    
    
    

    const handleElementContextMenu = (type, index, e) => {

        e.evt.preventDefault();
        e.cancelBubble = true;

        let selection = selectedElements;

        
        
        
        if (!isSelected(type, index)) {
            selection = [{ type, index }];
            setSelectedElements(selection);
        }

        setLayerContextMenu({
            x: e.evt.clientX,
            y: e.evt.clientY,
            selection
        });
    };

    const handleStageContextMenu = e => {
        e.evt.preventDefault();
        isRightPanning.current = false;
        lastPanPointer.current = null;

        if (selectedElements.length === 0) {
            setLayerContextMenu(null);
            return;
        }

        setLayerContextMenu({
            x: e.evt.clientX,
            y: e.evt.clientY,
            selection: selectedElements
        });
    };


    
    
    
    const handleTransformerContextMenu = e => {

        e.evt.preventDefault();
        e.cancelBubble = true;

        if (selectedElements.length === 0) {
            return;
        }

        setLayerContextMenu({
            x: e.evt.clientX,
            y: e.evt.clientY,
            selection: selectedElements
        });

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
        setLayerContextMenu(null);
    };

    const closeLayerContextMenu = () => {
        setLayerContextMenu(null);
    };

    
    
    

const handleElementMouseDown =
    (type, index, e) => {

        
        
        if (e.evt?.button === 2) {
            if (
                tool === "select" ||
                tool === "pen" ||
                tool === "eraser"
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
            tool !== "select"
        ) {
            return;
        }


        e.cancelBubble = true;


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
                : lines[index];


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
                    tool === "eraser"
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

                draw();

                return;

            }


            if (
                tool !== "select" ||
                !isSelecting.current
            ) {
                return;
            }


            const stage =
                stageRef.current;

            if (!stage) {
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


        setSelectedElements(
            selected
        );

    };


    const handleStageMouseUp =
        e => {

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
        layers
    ]);


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

                        onClick={() => {

                            if (
                                tool ===
                                "select"
                            ) {

                                setEditingText(
                                    index
                                );

                            }

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

                        onClick={() => {

                            if (
                                tool ===
                                "select"
                            ) {

                                setEditingNote(
                                    index
                                );

                            }

                        }}

                    >

                        <Rect

                            width={
                                196
                            }

                            height={
                                126
                            }

                            fill="#fff59d"

                            shadowColor="black"

                            shadowBlur={
                                5
                            }

                            shadowOpacity={
                                0.15
                            }

                            shadowOffset={{
                                x: 2,
                                y: 3
                            }}

                        />


                        <Text

                            x={
                                10
                            }

                            y={
                                10
                            }

                            width={
                                176
                            }

                            height={
                                106
                            }

                            text={
                                object.text ||
                                ""
                            }

                            fontSize={
                                18
                            }

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


                        return (

                            <Line

                                key={
                                    key
                                }

                                ref={
                                    node => {

                                        if (node) {

                                            nodeRefs.current[
                                                key
                                            ] = node;

                                        }

                                    }
                                }

                                points={
                                    line.points
                                }

                                stroke={
                                    line.stroke
                                }

                                strokeWidth={
                                    line.strokeWidth
                                }

                                lineCap="round"

                                lineJoin="round"

                                globalCompositeOperation={
                                    line.globalCompositeOperation
                                }

                                x={
                                    line.x ||
                                    0
                                }

                                y={
                                    line.y ||
                                    0
                                }

                                scaleX={
                                    line.scaleX ||
                                    1
                                }

                                scaleY={
                                    line.scaleY ||
                                    1
                                }

                                rotation={
                                    line.rotation ||
                                    0
                                }

                                draggable={
                                    tool ===
                                    "select"
                                }

                                hitStrokeWidth={
                                    20
                                }

                                onMouseDown={
                                    e =>
                                        handleElementMouseDown(
                                            "line",
                                            index,
                                            e
                                        )
                                }

                                onContextMenu={
                                    e =>
                                        handleElementContextMenu(
                                            "line",
                                            index,
                                            e
                                        )
                                }

                                onTouchStart={
                                    e =>
                                        handleElementMouseDown(
                                            "line",
                                            index,
                                            e
                                        )
                                }

                                onDragStart={
                                    () =>
                                        handleDragStart(
                                            "line",
                                            index
                                        )
                                }

                                onDragMove={
                                    e =>
                                        handleDragMove(
                                            "line",
                                            index,
                                            e
                                        )
                                }

                                onDragEnd={
                                    handleDragEnd
                                }

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
            `}</style>
            {}

            <div className="drawing_title">
                Drawing Lab
            </div>


            {}

            <Stage

                ref={
                    stageRef
                }

                width={
                    Math.max(
                        0,
                        stageSize.width -
                        referenceWidth
                    )
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

                {}

                <Layer listening={false}>
                    <Rect
                        x={0}
                        y={0}
                        width={Math.max(0, stageSize.width - referenceWidth)}
                        height={stageSize.height}
                        fill="white"
                    />
                </Layer>

                {}

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

                            {renderLayerLines(
                                layer.id
                            )}

                            {renderLayerObjects(
                                layer.id
                            )}

                        </Layer>

                    )
                )}


                {}

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


                {}

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
                            true
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

                        onContextMenu={
                            handleTransformerContextMenu
                        }

                    />

                </Layer>

            </Stage>


            {}

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
                                "none",

                            WebkitUserSelect:
                                "none",

                            zIndex:
                                1000

                        }}

                    />

                )
            }


            {}

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
                                "none",

                            WebkitUserSelect:
                                "none",

                            zIndex:
                                1000

                        }}

                    />

                )
            }


            {}

            <div

                className={
                    "reference_panel"
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


                <h2>
                    Reference
                </h2>


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


                {}

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

                                            {}

                                            <span className="layer_drag_handle">
                                                ⋮⋮
                                            </span>


                                            {}

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


                                            {}

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


                                            {}

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

                {}

                <div className="export_section">

                    <button
                        type="button"
                        className="export_button"
                        onClick={exportCanvas}
                    >
                        Export Canvas
                    </button>

                    <p className="export_hint">
                        Export the visible canvas as a PNG image.
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
                        left: Math.min(layerContextMenu.x, window.innerWidth - 220),
                        top: Math.min(layerContextMenu.y, window.innerHeight - 260),
                        zIndex: 5000
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                >
                    <div className="layer_context_title">Move to Layer</div>
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

            {}

            <div className="bottom_toolbar">

                <button
                    type="button"
                    onClick={undo}
                >
                    Undo
                </button>


                <button
                    type="button"
                    onClick={redo}
                >
                    Redo
                </button>


                <div className="zoom_controls">
                    <button
                        type="button"
                        onClick={() => zoomCanvas(zoom / 1.1)}
                        title="Zoom out"
                    >
                        −
                    </button>

                    <span>{Math.round(zoom * 100)}%</span>

                    <button
                        type="button"
                        onClick={() => zoomCanvas(zoom * 1.1)}
                        title="Zoom in"
                    >
                        +
                    </button>
                </div>


                <button

                    type="button"

                    className={
                        tool === "select"
                            ? "active"
                            : ""
                    }

                    onClick={() => {
                        setTool("select");
                        setPendingInsert(null);
                    }}

                >
                    🖐 Drag
                </button>


                <button

                    type="button"

                    className={
                        tool === "pen"
                            ? "active"
                            : ""
                    }

                    onClick={() => {
                        setTool("pen");
                        setPendingInsert(null);
                        setSelectedElements([]);
                    }}

                >
                    Pen
                </button>


                <button

                    type="button"

                    className={
                        tool === "eraser"
                            ? "active"
                            : ""
                    }

                    onClick={() => {
                        setTool("eraser");
                        setPendingInsert(null);
                        setSelectedElements([]);
                    }}

                >
                    Eraser
                </button>


                {}

                <div className="shape_menu">

                    <button
                        type="button"
                        className={
                            pendingInsert?.type === "shape"
                                ? "active"
                                : ""
                        }
                                        >
                        Shapes
                    </button>


                    <div className="shape_dropdown">

                        <div className="shape_grid">

                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "square"
                                    )
                                }
                            >
                                □
                                <span>
                                    Square
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "circle"
                                    )
                                }
                            >
                                ○
                                <span>
                                    Circle
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "triangle"
                                    )
                                }
                            >
                                △
                                <span>
                                    Triangle
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "diamond"
                                    )
                                }
                            >
                                ◇
                                <span>
                                    Diamond
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "hexagon"
                                    )
                                }
                            >
                                ⬡
                                <span>
                                    Hexagon
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "oval"
                                    )
                                }
                            >
                                ⬭
                                <span>
                                    Oval
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "parallelogram"
                                    )
                                }
                            >
                                ▱
                                <span>
                                    Parallelogram
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "star"
                                    )
                                }
                            >
                                ☆
                                <span>
                                    Star
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "cloud"
                                    )
                                }
                            >
                                ☁
                                <span>
                                    Cloud
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "heart"
                                    )
                                }
                            >
                                ♡
                                <span>
                                    Heart
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "incorrect"
                                    )
                                }
                            >
                                ☐
                                <span>
                                    Incorrect
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "correct"
                                    )
                                }
                            >
                                ☑
                                <span>
                                    Correct
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "leftArrow"
                                    )
                                }
                            >
                                ←
                                <span>
                                    Left
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "upArrow"
                                    )
                                }
                            >
                                ↑
                                <span>
                                    Up
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "downArrow"
                                    )
                                }
                            >
                                ↓
                                <span>
                                    Down
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    chooseShape(
                                        "rightArrow"
                                    )
                                }
                            >
                                →
                                <span>
                                    Right
                                </span>
                            </button>

                        </div>

                    </div>

                </div>


                {}

                <button
                    type="button"
                    className={
                        pendingInsert?.type === "text"
                            ? "active"
                            : ""
                    }
                    onClick={chooseText}
                >
                    Text
                </button>


                {}

                <button
                    type="button"
                    className={
                        pendingInsert?.type === "note"
                            ? "active"
                            : ""
                    }
                    onClick={chooseNote}
                >
                    Note
                </button>


                {}

                <label className="image_button">

                    Image

                    <input

                        type="file"

                        accept="image/*"

                        onChange={
                            addImage
                        }

                    />

                </label>


                {}

                <label>

                    Color

                    <input

                        type="color"

                        value={
                            color
                        }

                        onChange={
                            e =>
                                setColor(
                                    e.target.value
                                )
                        }

                    />

                </label>


                {}

                <label>

                    Size

                    <input

                        type="range"

                        min="1"

                        max="50"

                        value={
                            brushSize
                        }

                        onChange={
                            e =>
                                setBrushSize(
                                    Number(
                                        e.target.value
                                    )
                                )
                        }

                    />

                </label>

            </div>

        </div>

    );

}

export default App;