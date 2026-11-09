(() => {
"use strict";

const $ = id => document.getElementById(id);
const KEY = "lemco-writing-hub-v1";
const fresh = {
    projectName: "Untitled Story",
    pages: [{ id: "p1", title: "Chapter 1", html: "<p>Begin your story here...</p>" }],
    currentPageId: "p1",
    characters: [],
    places: [],
    world: { overview: "", history: "", rules: "", notes: "" }
};

let state;
try {
    state = { ...fresh, ...JSON.parse(localStorage.getItem(KEY)) };
} catch (e) {
    state = JSON.parse(JSON.stringify(fresh));
}
if (!Array.isArray(state.pages) || !state.pages.length) state.pages = fresh.pages;

let timer;

function save() {
    clearTimeout(timer);
    $("saveStatus").textContent = "● Saving…";
    timer = setTimeout(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
            $("saveStatus").textContent = "● Saved locally";
        } catch (e) {
            $("saveStatus").textContent = "● Save unavailable";
        }
    }, 200);
}

function toast(message) {
    const toastElement = $("toast");
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastElement.classList.remove("show"), 1800);
}

const showToast = toast;

function askConfirm(title, message) {
    return new Promise(resolve => {
        const modal = $("confirmModal");
        $("confirmTitle").textContent = title;
        $("confirmMessage").textContent = message;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");

        const finish = answer => {
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
            $("acceptConfirm").removeEventListener("click", accept);
            $("cancelConfirm").removeEventListener("click", cancel);
            modal.removeEventListener("click", backdrop);
            document.removeEventListener("keydown", escape);
            resolve(answer);
        };
        const accept = () => finish(true);
        const cancel = () => finish(false);
        const backdrop = event => { if (event.target === modal) finish(false); };
        const escape = event => { if (event.key === "Escape") finish(false); };

        $("acceptConfirm")?.addEventListener("click", accept);
        $("cancelConfirm")?.addEventListener("click", cancel);
        modal.addEventListener("click", backdrop);
        document.addEventListener("keydown", escape);
        $("cancelConfirm").focus();
    });
}

function page() {
    return state.pages.find(p => p.id === state.currentPageId) || state.pages[0];
}

function words(text) {
    return (text.trim().match(/\b[\w’'-]+\b/g) || []).length;
}

function htmlToText(html) {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.innerText || div.textContent || "";
}

function updateCount() {
    const current = words($("writingArea").innerText || "");
    const total = state.pages.reduce((sum, p) => sum + words(htmlToText(p.html)), 0);
    $("pageWords").textContent = current + " WORDS";
    $("wordCount").textContent = total;
}

function savePage() {
    const current = page();
    current.title = $("pageTitle").value;
    current.html = $("writingArea").innerHTML;
    renderPages();
    updateCount();
    save();
}

function loadPage() {
    const current = page();
    $("pageTitle").value = current.title;
    $("writingArea").innerHTML = current.html || "<p><br></p>";
    $("pageNumber").textContent = "PAGE " + (state.pages.indexOf(current) + 1);
    $("topTitle").textContent = state.projectName;
    editorSelectionRange = null;
    typingTextColor = null;
    updateCount();
}

/* Preserve editor selection while toolbar controls (especially color pickers) are used. */
let editorSelectionRange = null;
function rememberEditorSelection() {
    const selection = window.getSelection();
    const editor = $("writingArea");
    if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        if (editor && editor.contains(range.commonAncestorContainer)) {
            editorSelectionRange = range.cloneRange();
        }
    }
}
function syncTextColorFromSelection() {
    const editor = $("writingArea");
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    // Use the computed colour at the beginning of the selected passage as
    // the current toolbar colour, just as a word processor does.
    let node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
        node = node.childNodes[range.startOffset] || node;
    }
    if (node.nodeType !== Node.TEXT_NODE) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        node = walker.nextNode();
    }
    if (!node) return;
    const element = node.parentElement;
    const color = element ? getComputedStyle(element).color : null;
    if (!color) return;

    const probe = document.createElement("span");
    probe.style.color = color;
    document.body.appendChild(probe);
    const normalized = getComputedStyle(probe).color;
    probe.remove();

    // Store the selected text colour as hex so it remains compatible with
    // the palette's custom colour input and opacity handling.
    const rgb = normalized.match(/\d+/g);
    if (!rgb || rgb.length < 3) return;
    const hex = "#" + rgb.slice(0, 3).map(value =>
        Number(value).toString(16).padStart(2, "0")
    ).join("").toUpperCase();
    currentTextColor = hex;
    selectedPaletteColor = hex;
    const swatch = $("textColorSwatch");
    if (swatch) swatch.style.backgroundColor = normalized;
}

document.addEventListener("selectionchange", () => {
    rememberEditorSelection();
    syncTextColorFromSelection();
});

function restoreEditorSelection() {
    if (!editorSelectionRange) return false;
    const editor = $("writingArea");
    if (!editor.contains(editorSelectionRange.commonAncestorContainer)) return false;
    editor.focus();
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(editorSelectionRange);
    return true;
}

function wrapSelectedText(tagName, styles = {}) {
    const editor = $("writingArea");
    restoreEditorSelection();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return false;

    const wrapper = document.createElement(tagName);
    Object.entries(styles).forEach(([key, value]) => wrapper.style[key] = value);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    const caret = document.createRange();
    caret.setStartAfter(wrapper);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
    editorSelectionRange = null;
    return true;
}

/* Right-click a selected passage to open the custom text menu. */
const contextMenu = $("textContextMenu");
let savedTextRange = null;
$("writingArea")?.addEventListener("contextmenu", event => {
    const liveSelection=window.getSelection();
    if(liveSelection && liveSelection.rangeCount && !liveSelection.isCollapsed &&
       $("writingArea").contains(liveSelection.getRangeAt(0).commonAncestorContainer)) {
        editorSelectionRange=liveSelection.getRangeAt(0).cloneRange();
    } else {
        rememberEditorSelection();
    }
    if (!editorSelectionRange || editorSelectionRange.collapsed ||
        !$("writingArea").contains(editorSelectionRange.commonAncestorContainer)) {
        contextMenu.classList.remove("open");
        return;
    }
    event.preventDefault();
    savedTextRange = editorSelectionRange.cloneRange();
    contextMenu.style.left = Math.max(8, Math.min(event.clientX, window.innerWidth - 225)) + "px";
    contextMenu.style.top = Math.max(8, Math.min(event.clientY, window.innerHeight - 100)) + "px";
    contextMenu.classList.add("open");
});
contextMenu.addEventListener("mousedown", event => {
    // Keep the editor selection for menu actions, but allow the size slider
    // to receive pointer input and be dragged normally.
    if (!event.target.closest('input[type="range"]')) event.preventDefault();
});
function applyRangeWrapper(rangeToFormat, tagName, styles = {}) {
    const editor = $("writingArea");
    if (!rangeToFormat || !editor.contains(rangeToFormat.commonAncestorContainer)) return false;
    const wrapper = document.createElement(tagName);
    Object.entries(styles).forEach(([key, value]) => wrapper.style[key] = value);
    wrapper.appendChild(rangeToFormat.extractContents());
    rangeToFormat.insertNode(wrapper);
    const caret = document.createRange();
    caret.setStartAfter(wrapper);
    caret.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(caret);
    editorSelectionRange = null;
    editor.focus();
    return true;
}

function unwrapMatchingElements(root, selector, clearBackground=false) {
    root.querySelectorAll(selector).forEach(node => {
        if (clearBackground) node.style.removeProperty("background-color");
        const parent=node.parentNode;
        while(node.firstChild) parent.insertBefore(node.firstChild,node);
        node.remove();
    });
}

function unwrapMarksAndClearBackground(root) {
    // First unwrap <mark> nodes from deepest to shallowest.
    [...root.querySelectorAll("mark")].reverse().forEach(mark=>{
        const parent=mark.parentNode;
        if(!parent) return;
        while(mark.firstChild) parent.insertBefore(mark.firstChild,mark);
        mark.remove();
    });

    // Remove background formatting only. Keep text colour, size, bold, etc.
    root.querySelectorAll("*").forEach(node=>{
        if(!node.style) return;
        node.style.removeProperty("background-color");
        node.style.removeProperty("background");
        if(!node.getAttribute("style")?.trim()) node.removeAttribute("style");
    });
}

function insertFormattedFragment(rangeToEdit, fragment) {
    rangeToEdit.insertNode(fragment);
    const selection=window.getSelection();
    const caret=document.createRange();
    const node=rangeToEdit.endContainer;
    const offset=rangeToEdit.endOffset;
    caret.setStart(node,offset);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
    $("writingArea").focus();
    editorSelectionRange=caret.cloneRange();
}

function removeHighlightFromRange(rangeToEdit) {
    const editor=$("writingArea");
    if(!rangeToEdit || rangeToEdit.collapsed ||
       !editor.contains(rangeToEdit.commonAncestorContainer)) return false;

    const fragment=rangeToEdit.extractContents();
    const holder=document.createElement("div");
    holder.appendChild(fragment);
    unwrapMarksAndClearBackground(holder);

    const clean=document.createDocumentFragment();
    let lastInserted=null;
    while(holder.firstChild) {
        lastInserted=holder.firstChild;
        clean.appendChild(holder.firstChild);
    }
    rangeToEdit.insertNode(clean);

    const selection=window.getSelection();
    selection.removeAllRanges();
    const caret=document.createRange();
    if(lastInserted && lastInserted.parentNode) caret.setStartAfter(lastInserted);
    else caret.setStart(rangeToEdit.startContainer,rangeToEdit.startOffset);
    caret.collapse(true);
    selection.addRange(caret);
    editor.focus();
    editorSelectionRange=caret.cloneRange();
    return true;
}

function applyTextColorToRange(rangeToEdit,color) {
    const editor=$("writingArea");
    if(!rangeToEdit || rangeToEdit.collapsed ||
       !editor.contains(rangeToEdit.commonAncestorContainer)) return false;

    const fragment=rangeToEdit.extractContents();
    const holder=document.createElement("span");
    holder.appendChild(fragment);
    // Clear older font colours inside the selected fragment so the newly
    // chosen colour is consistent across the entire selection.
    holder.querySelectorAll("*").forEach(node=>{
        if(node.style && node.style.color) {
            node.style.removeProperty("color");
            if(!node.getAttribute("style")?.trim()) node.removeAttribute("style");
        }
    });
    const clean=document.createDocumentFragment();
    while(holder.firstChild) clean.appendChild(holder.firstChild);
    const wrapper=document.createElement("span");
    wrapper.style.color=color;
    wrapper.appendChild(clean);
    rangeToEdit.insertNode(wrapper);

    const caret=document.createRange();
    caret.setStartAfter(wrapper);
    caret.collapse(true);
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(caret);
    editor.focus();
    editorSelectionRange=caret.cloneRange();
    currentTextColor=color;
    $("textColorSwatch").style.backgroundColor=color;
    return true;
}

function applyHighlightToRange(rangeToEdit,color) {
    const editor=$("writingArea");
    if(!rangeToEdit || rangeToEdit.collapsed ||
       !editor.contains(rangeToEdit.commonAncestorContainer)) return false;

    const fragment=rangeToEdit.extractContents();
    const holder=document.createElement("div");
    holder.appendChild(fragment);
    unwrapMarksAndClearBackground(holder);

    const highlight=document.createElement("span");
    highlight.className="text-highlight";
    highlight.style.backgroundColor=color;
    while(holder.firstChild) highlight.appendChild(holder.firstChild);
    rangeToEdit.insertNode(highlight);

    const selection=window.getSelection();
    selection.removeAllRanges();
    const caret=document.createRange();
    caret.setStartAfter(highlight);
    caret.collapse(true);
    selection.addRange(caret);
    editor.focus();
    editorSelectionRange=caret.cloneRange();
    currentHighlightColor=color;
    $("highlightColorSwatch").style.backgroundColor=color;
    return true;
}

function applyFontSizeToRange(rangeToEdit,size,options={}) {
    const editor=$("writingArea");
    if(!rangeToEdit || rangeToEdit.collapsed ||
       !editor.contains(rangeToEdit.commonAncestorContainer)) return false;

    const selectedSize=Math.max(8,Math.min(72,Number(size)||16));
    const fragment=rangeToEdit.extractContents();
    const holder=document.createElement("div");
    holder.appendChild(fragment);

    // Clear nested font-size values inside this selection only.
    holder.querySelectorAll("*").forEach(node=>{
        if(node.style) {
            node.style.removeProperty("font-size");
            if(!node.getAttribute("style")?.trim()) node.removeAttribute("style");
        }
        if(node.tagName==="FONT") node.removeAttribute("size");
    });

    const formatted=document.createElement("span");
    formatted.className="context-sized-text";
    formatted.style.setProperty("font-size",selectedSize+"px","important");
    while(holder.firstChild) formatted.appendChild(holder.firstChild);
    rangeToEdit.insertNode(formatted);

    if(options.moveCaret!==false) {
        // Put the insertion point in a separate run using the toolbar default.
        const typingRun=document.createElement("span");
        typingRun.className="default-typing-size";
        typingRun.style.setProperty("font-size",toolbarFontSize+"px","important");
        formatted.after(typingRun);

        const caret=document.createRange();
        caret.setStart(typingRun,0);
        caret.collapse(true);
        const selection=window.getSelection();
        selection.removeAllRanges();
        selection.addRange(caret);
        editor.focus();
        editorSelectionRange=caret.cloneRange();
    }
    // Deliberately never write to the toolbar input here.
    return true;
}

function insertTextAtDefaultSize(text) {
    const editor=$("writingArea");
    const selection=window.getSelection();
    if(!selection || !selection.rangeCount || !selection.isCollapsed) return false;
    const range=selection.getRangeAt(0);
    if(!editor.contains(range.commonAncestorContainer)) return false;

    // Keep consecutive keystrokes (especially spaces) in one text run.
    // Creating a new span for every character made trailing spaces collapse
    // between adjacent inline spans in contenteditable.
    let typingRun=null;
    let textNode=null;
    let offset=0;

    if(range.startContainer.nodeType===Node.TEXT_NODE &&
       range.startContainer.parentElement?.classList.contains("default-typing-size")) {
        typingRun=range.startContainer.parentElement;
        textNode=range.startContainer;
        offset=range.startOffset;
    } else if(range.startContainer.nodeType===Node.ELEMENT_NODE) {
        const previous=range.startContainer.childNodes[range.startOffset-1];
        if(previous?.nodeType===Node.ELEMENT_NODE &&
           previous.classList.contains("default-typing-size")) {
            typingRun=previous;
            textNode=typingRun.lastChild;
            if(!textNode || textNode.nodeType!==Node.TEXT_NODE) {
                textNode=document.createTextNode("");
                typingRun.appendChild(textNode);
            }
            offset=textNode.data.length;
        }
    }

    if(typingRun && textNode) {
        textNode.insertData(offset,text);
        const caret=document.createRange();
        caret.setStart(textNode,offset+text.length);
        caret.collapse(true);
        selection.removeAllRanges();
        selection.addRange(caret);
        editorSelectionRange=caret.cloneRange();
        return true;
    }

    const span=document.createElement("span");
    span.className="default-typing-size";
    span.style.setProperty("font-size",toolbarFontSize+"px","important");
    if(typingTextColor) span.style.color=typingTextColor;
    const node=document.createTextNode(text);
    span.appendChild(node);
    range.deleteContents();
    range.insertNode(span);

    const caret=document.createRange();
    caret.setStart(node,node.data.length);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
    editorSelectionRange=caret.cloneRange();
    return true;
}

async function copyOrCutSelection(cut=false) {
    if(!savedTextRange || savedTextRange.collapsed) return;
    const range=savedTextRange.cloneRange();
    const text=range.toString();
    try {
        if(navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const temp=document.createElement("textarea");
            temp.value=text; temp.style.position="fixed"; temp.style.opacity="0";
            document.body.appendChild(temp); temp.select();
            document.execCommand("copy"); temp.remove();
        }
    } catch(error) {
        const temp=document.createElement("textarea");
        temp.value=text; temp.style.position="fixed"; temp.style.opacity="0";
        document.body.appendChild(temp); temp.select();
        document.execCommand("copy"); temp.remove();
    }
    if(cut) {
        range.deleteContents();
        const selection=window.getSelection();
        selection.removeAllRanges(); selection.addRange(range);
        editorSelectionRange=range.cloneRange();
        savePage();
    }
    contextMenu.classList.remove("open");
}

contextMenu.querySelectorAll("[data-context-action]").forEach(button => {
    button.addEventListener("click", () => {
        if(button.dataset.contextAction==="copy") { copyOrCutSelection(false); return; }
        if(button.dataset.contextAction==="cut") { copyOrCutSelection(true); return; }
        if(!savedTextRange || !$("writingArea").contains(savedTextRange.commonAncestorContainer)) {
            contextMenu.classList.remove("open");
            return;
        }
        const range=savedTextRange.cloneRange();
        let changed=false;
        if(button.dataset.contextAction==="highlight") {
            changed=applyHighlightToRange(range,currentHighlightColor);
        } else if(button.dataset.contextAction==="remove-highlight") {
            changed=removeHighlightFromRange(range);
        }
        if(changed) savePage();
        savedTextRange=null;
        contextMenu.classList.remove("open");
    });
});

const contextFontSize=$("contextFontSize");
const contextFontSizeValue=$("contextFontSizeValue");
contextFontSize?.addEventListener("input",()=>{
    if(contextFontSizeValue) contextFontSizeValue.textContent=contextFontSize.value+" px";
});
$("applyContextFontSize")?.addEventListener("click",()=>{
    if(!savedTextRange) return;
    const changed=applyFontSizeToRange(savedTextRange.cloneRange(),Number(contextFontSize.value),{moveCaret:true});
    if(changed) savePage();
    savedTextRange=null;
    contextMenu.classList.remove("open");
});

document.addEventListener("click", event => {
    if (!contextMenu.contains(event.target)) contextMenu.classList.remove("open");
});
window.addEventListener("scroll", () => contextMenu.classList.remove("open"), true);

function renderPages() {
    const list = $("pageList");
    list.replaceChildren();

    state.pages.forEach((p, index) => {
        const row = document.createElement("div");
        row.className = "page-row" + (p.id === state.currentPageId ? " active" : "");

        const select = document.createElement("button");
        select.className = "page-select";
        select.textContent = String(index + 1).padStart(2, "0") + "  " + (p.title || "Untitled page");
        select.onclick = () => {
            savePage();
            state.currentPageId = p.id;
            loadPage();
            renderPages();
        };

        const remove = document.createElement("button");
        remove.className = "delete-page";
        remove.textContent = "×";
        remove.title = "Delete page";
        remove.onclick = () => {
            if (state.pages.length < 2) return toast("Keep at least one page.");
            askConfirm("Delete this page?", "This page and its contents will be permanently removed.")
                .then(confirmed => {
                    if (!confirmed) return;
                    state.pages = state.pages.filter(item => item.id !== p.id);
                    if (state.currentPageId === p.id) state.currentPageId = state.pages[0].id;
                    loadPage();
                    renderPages();
                    save();
                });
        };

        row.append(select, remove);
        list.append(row);
    });

    updateCount();
}

function newPage() {
    savePage();
    const p = {
        id: "p" + Date.now(),
        title: "Chapter " + (state.pages.length + 1),
        html: "<p><br></p>"
    };
    state.pages.push(p);
    state.currentPageId = p.id;
    loadPage();
    renderPages();
    save();
    $("pageTitle").focus();
}

$("projectName").value = state.projectName;
$("projectName").oninput = () => {
    state.projectName = $("projectName").value;
    $("topTitle").textContent = state.projectName;
    save();
};

$("pageTitle").oninput = savePage;
$("writingArea").addEventListener("beforeinput", event => {
    if (event.inputType === "insertText" && event.data) {
        const selection=window.getSelection();
        if(selection && selection.isCollapsed && selection.rangeCount &&
           $("writingArea").contains(selection.getRangeAt(0).commonAncestorContainer)) {
            event.preventDefault();
            insertTextAtDefaultSize(event.data);
            savePage();
            return;
        }
    }
    if (!typingTextColor || event.inputType !== "insertText" || !event.data) return;
    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!$("writingArea").contains(range.commonAncestorContainer)) return;
    event.preventDefault();
    insertTypedTextWithColor(event.data, typingTextColor);
    savePage();
});
$("writingArea").oninput = savePage;
$("newPage").onclick = $("newPageTop").onclick = newPage;

$("toggleSidebar").onclick = () => $("appShell").classList.toggle("sidebar-hidden");

function setPagesHidden(hidden) {
    const panel = $("pagesPanel");
    const area = document.querySelector(".work-area");

    if (innerWidth <= 650) {
        panel.classList.toggle("mobile-open", !hidden);
        return;
    }

    panel.classList.toggle("collapsed", hidden);
    area.classList.toggle("pages-hidden", hidden);
    $("appShell").classList.toggle("pages-panel-hidden", hidden);
    $("restorePages").style.display = hidden ? "inline-block" : "none";
}

$("togglePages").onclick = () => setPagesHidden(!$("pagesPanel").classList.contains("collapsed"));
$("restorePages").onclick = () => setPagesHidden(false);
$("toggleToolbar").onclick = () => $("toolbar").classList.toggle("collapsed");

$("themeToggle").onclick = () => {
    document.body.classList.toggle("dark");
    $("themeToggle").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
};

/* Keep the current text selection when a toolbar button is clicked. */
document.querySelectorAll("[data-cmd]").forEach(button => {
    button.addEventListener("mousedown", event => event.preventDefault());
    button.onclick = () => {
        $("writingArea").focus();
        document.execCommand(button.dataset.cmd, false, null);
        savePage();
    };
});

$("format").onchange = event => {
    $("writingArea").focus();
    document.execCommand("formatBlock", false, event.target.value);
    savePage();
};

$("fontFamily").onchange = event => {
    $("writingArea").focus();
    document.execCommand("fontName", false, event.target.value);
    savePage();
};

// Font sizing uses two independent values:
// 1) toolbarFontSize = the default size for newly typed text
// 2) context-menu size = formatting for the selected passage only.
let toolbarFontSize = Math.max(1,Math.min(200,Number($("fontSize")?.value)||17));

function applyCustomFontSize(size) {
    toolbarFontSize=Math.max(1,Math.min(200,Number(size)||17));
    $("fontSize").value=toolbarFontSize;

    const selection=window.getSelection();
    if(selection && selection.rangeCount && !selection.isCollapsed &&
       $("writingArea").contains(selection.getRangeAt(0).commonAncestorContainer)) {
        const changed=applyFontSizeToRange(selection.getRangeAt(0).cloneRange(),toolbarFontSize,{moveCaret:false});
        if(changed) savePage();
        return;
    }
    // No selection: this changes only the default for future typing.
    savePage();
}
$("fontSize")?.addEventListener("change",event=>applyCustomFontSize(event.target.value));
$("fontSize")?.addEventListener("keydown",event=>{
    if(event.key==="Enter") {
        event.preventDefault();
        applyCustomFontSize(event.target.value);
        $("fontSize").blur();
    }
});
document.querySelectorAll("[data-font-step]").forEach(button=>{
    button.addEventListener("click",()=>{
        applyCustomFontSize(toolbarFontSize+Number(button.dataset.fontStep));
    });
});

let currentTextColor = "#171717";
let currentHighlightColor = "#fff176";
let textColorRange = null;
let highlightColorRange = null;
let paletteKind = null;
let paletteAnchor = null;
let selectedPaletteColor = "#171717";
let selectedPaletteOpacity = 100;
const recentPaletteColors = ["#FFFFFF","#F2F2F2","#808080","#000000","#F44336","#FF9800","#FFEB3B","#4CAF50","#03A9F4","#3F51B5","#9C27B0","#E91E63"];

function hslToHex(h,s,l) {
 const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
 let r=0,g=0,b=0;
 if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
 else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
 return "#"+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,"0")).join("").toUpperCase();
}
function colorToRgba(hex,opacity) {
 const h=hex.replace("#","");
 const n=parseInt(h,16);
 return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${Math.max(0,Math.min(100,opacity))/100})`;
}
function buildCompactColorGrid() {
 const grid=$("compactColorGrid");
 grid.innerHTML="";
 const hues=12, rows=10;
 for(let row=0;row<rows;row++) {
   for(let col=0;col<hues;col++) {
     const hue=col*30;
     const sat=row===0?0:0.95;
     const light=row===0?1-(col/(hues-1))*0.92:0.96-row*0.085;
     const color=row===0?`#${Math.round(light*255).toString(16).padStart(2,"0").repeat(3)}`:hslToHex(hue,sat,Math.max(.08,light));
     const btn=document.createElement("button");
     btn.type="button"; btn.className="compact-color-cell";
     btn.style.backgroundColor=color; btn.title=color; btn.dataset.color=color;
     btn.addEventListener("click",()=>selectCompactColor(color));
     grid.appendChild(btn);
   }
 }
 const swatches=$("compactColorSwatches");
 swatches.innerHTML="";
 const current=paletteKind==="text"?currentTextColor:currentHighlightColor;
 const all=[current,...recentPaletteColors];
 all.forEach((color,index)=>{
   const btn=document.createElement("button");
   btn.type="button"; btn.className="compact-color-chip";
   btn.style.backgroundColor=color; btn.title=color;
   btn.addEventListener("click",()=>selectCompactColor(color));
   swatches.appendChild(btn);
 });
 const add=document.createElement("button");
 add.type="button"; add.className="compact-color-add"; add.textContent="+";
 add.title="Choose a custom colour";
 add.addEventListener("click",()=>$("customPopoverColor").click());
 swatches.appendChild(add);
}
function openPalette(kind,anchor,rangeOverride=null) {
 paletteKind=kind; paletteAnchor=anchor;
 const range=rangeOverride || editorSelectionRange;
 if(kind==="text") textColorRange=range?range.cloneRange():null;
 else highlightColorRange=range?range.cloneRange():null;
 selectedPaletteColor=kind==="text"?currentTextColor:currentHighlightColor;
 selectedPaletteOpacity=100;
 $("compactColorTitle").textContent=kind==="text"?"Text Color":"Highlight Color";
 $("colorOpacity").value=100; $("colorOpacityValue").textContent="100%";
 $("customPopoverColor").value=selectedPaletteColor;
 buildCompactColorGrid();
 const rect=anchor.getBoundingClientRect();
 const pop=$("colorPalette");
 const left=Math.max(8,Math.min(rect.left-35,window.innerWidth-280));
 const top=Math.max(8,Math.min(rect.bottom+5,window.innerHeight-400));
 pop.style.left=left+"px"; pop.style.top=top+"px";
 pop.classList.add("open"); pop.setAttribute("aria-hidden","false");
}
function closePalette() {
 $("colorPalette").classList.remove("open");
 $("colorPalette").setAttribute("aria-hidden","true");
}
function selectCompactColor(color) {
  selectedPaletteColor=color;
  if(paletteKind==="text") {
    currentTextColor=color;
    $("textColorSwatch").style.backgroundColor=color;
    // Font colour behaves like Word: apply to selected text, or set the
    // insertion point so the next characters use the chosen colour.
    applyColorToRange("text",color,textColorRange || editorSelectionRange);
  } else {
    currentHighlightColor=color;
    $("highlightColorSwatch").style.backgroundColor=color;
    // Selecting a swatch only changes the active highlighter colour.
    // The main highlight button applies it to a selected passage.
  }
  savePage();
  closePalette();
}

let typingTextColor = null;

function insertTypingColor(color, range) {
  const editor=$("writingArea");
  if(!range || !range.collapsed ||
     !editor.contains(range.commonAncestorContainer)) return false;

  // Do not recolour an existing parent span. Store the insertion colour and
  // apply it only to characters typed from this point onward.
  const selection=window.getSelection();
  editor.focus();
  selection.removeAllRanges();
  selection.addRange(range);
  typingTextColor=color;
  editorSelectionRange=range.cloneRange();
  return true;
}

function insertTypedTextWithColor(text, color) {
  const editor=$("writingArea");
  const selection=window.getSelection();
  if(!selection || !selection.rangeCount || !selection.isCollapsed) return false;
  const range=selection.getRangeAt(0);
  if(!editor.contains(range.commonAncestorContainer)) return false;

  const span=document.createElement("span");
  span.style.color=color;
  span.appendChild(document.createTextNode(text));
  range.deleteContents();
  range.insertNode(span);

  const caret=document.createRange();
  caret.setStartAfter(span);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);
  editorSelectionRange=caret.cloneRange();
  return true;
}

function applyColorToRange(kind,color,range) {
  const editor=$("writingArea");
  const savedRange=range || editorSelectionRange;
  if(!savedRange || !editor.contains(savedRange.commonAncestorContainer)) {
    showToast(kind==="text"?"Place the cursor in the page or select text first.":"Select text first to apply highlighting.");
    return false;
  }

  if(savedRange.collapsed) {
    if(kind==="text") {
      const inserted=insertTypingColor(color,savedRange.cloneRange());
      if(inserted) { savePage(); return true; }
    }
    showToast("Select text first to apply highlighting.");
    return false;
  }

  const changed = kind==="text"
    ? applyTextColorToRange(savedRange.cloneRange(),color)
    : applyHighlightToRange(savedRange.cloneRange(),color);
  if(changed) {
    if(kind==="text") {
      typingTextColor=color;
      currentTextColor=color;
      $("textColorSwatch").style.backgroundColor=color;
    } else {
      currentHighlightColor=color;
      $("highlightColorSwatch").style.backgroundColor=color;
    }
    savePage();
  }
  return changed;
}

function applyCompactColor() {
  selectCompactColor(selectedPaletteColor);
}
let pendingTextApplyRange = null;
let pendingHighlightApplyRange = null;

$("textColorDropdown")?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    rememberEditorSelection();
    pendingTextApplyRange = editorSelectionRange ? editorSelectionRange.cloneRange() : null;
});
$("textColorDropdown")?.addEventListener("click", () => {
    if($("colorPalette").classList.contains("open") && paletteKind==="text") {
        closePalette();
    } else {
        openPalette("text", $("textColorDropdown"), pendingTextApplyRange);
    }
    pendingTextApplyRange = null;
});

$("highlightColorDropdown")?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    rememberEditorSelection();
    pendingHighlightApplyRange = editorSelectionRange ? editorSelectionRange.cloneRange() : null;
});
$("highlightColorDropdown")?.addEventListener("click", () => {
    if($("colorPalette").classList.contains("open") && paletteKind==="highlight") {
        closePalette();
    } else {
        openPalette("highlight", $("highlightColorDropdown"), pendingHighlightApplyRange);
    }
    pendingHighlightApplyRange = null;
});

$("textColorApply")?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    rememberEditorSelection();
    pendingTextApplyRange = editorSelectionRange ? editorSelectionRange.cloneRange() : null;
});
$("textColorApply")?.addEventListener("click", () => {
    applyColorToRange("text", currentTextColor, pendingTextApplyRange || editorSelectionRange);
    pendingTextApplyRange = null;
});

$("highlightColorApply")?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    rememberEditorSelection();
    pendingHighlightApplyRange = editorSelectionRange ? editorSelectionRange.cloneRange() : null;
});
$("highlightColorApply")?.addEventListener("click", () => {
    const range=pendingHighlightApplyRange || editorSelectionRange;
    if(range && !range.collapsed) {
        applyHighlightToRange(range.cloneRange(),currentHighlightColor);
        savePage();
    } else {
        showToast("Select text first to highlight it.");
    }
    // Highlight is a one-shot selection action: no persistent highlighter mode.
    pendingHighlightApplyRange=null;
});

$("colorOpacity")?.addEventListener("input",event=>{
 selectedPaletteOpacity=Number(event.target.value);
 $("colorOpacityValue").textContent=selectedPaletteOpacity+"%";
});
$("customPopoverColor")?.addEventListener("change",event=>{
 selectedPaletteColor=event.target.value.toUpperCase();
 applyCompactColor();
});
$("closeColorPalette")?.addEventListener("click",event=>{
 event.preventDefault();
 event.stopPropagation();
 closePalette();
});
$("colorPalette")?.addEventListener("click",event=>event.stopPropagation());
document.addEventListener("keydown",event=>{
 if(event.key==="Escape") closePalette();
});
document.addEventListener("click",event=>{
 if(!$("colorPalette").contains(event.target) &&
    !$("textColorDropdown").contains(event.target) &&
    !$("highlightColorDropdown").contains(event.target) &&
    !$("textColorApply").contains(event.target) &&
    !$("highlightColorApply").contains(event.target)) closePalette();
});
$("textColorSwatch").style.backgroundColor=currentTextColor;
$("highlightColorSwatch").style.backgroundColor=currentHighlightColor;

/* Right-click selected text can open this same compact colour popover. */
$("contextTextColorButton")?.addEventListener("click",()=>{
 if(!savedTextRange)return;
 contextMenu.classList.remove("open");
 openPalette("text",$("textColorDropdown"),savedTextRange.cloneRange());
});

$("undoButton").onclick = () => {
    $("writingArea").focus();
    document.execCommand("undo");
    savePage();
};

$("redoButton").onclick = () => {
    $("writingArea").focus();
    document.execCommand("redo");
    savePage();
};

$("clearFormat").onclick = () => {
    $("writingArea").focus();
    document.execCommand("removeFormat");
    savePage();
};

/* Right-hand resource drawer: open it as a real grid column on desktop.
   This makes the editor and paper shift left; closing restores their width. */
const drawer = $("drawer");
const tabs = [...document.querySelectorAll(".resource")];
const workArea = document.querySelector(".work-area");

tabs.forEach(button => {
    button.onclick = () => openTab(button.dataset.tab);
});

$("closeDrawer").onclick = closeDrawer;

function closeDrawer() {
    drawer.classList.remove("open");
    workArea.classList.remove("drawer-open");
    tabs.forEach(button => button.classList.remove("active"));
}

function openTab(tab) {
    tabs.forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
    drawer.classList.add("open");

    if (innerWidth > 650) {
        workArea.classList.add("drawer-open");
    }

    const labels = {
        characters: ["CHARACTER NOTES", "Characters"],
        places: ["SETTING NOTES", "Places"],
        world: ["WORLD BUILDING", "World"],
        export: ["FINISH & SHARE", "Export"]
    };

    $("drawerEyebrow").textContent = labels[tab][0];
    $("drawerTitle").textContent = labels[tab][1];

    if (tab === "characters") {
        collectionForm("characters", "Character", "Name", "Role",
            "information about the character");
    }
    if (tab === "places") {
        collectionForm("places", "Place", "Place name", "Type of place",
            "description about the world");
    }
    if (tab === "world") worldForm();
    if (tab === "export") exportPanel();
}

function collectionForm(key, label, nameLabel, typeLabel, placeholder) {
    const root = $("drawerContent");
    root.replaceChildren();

    const form = document.createElement("form");
    form.className = "form";
    form.innerHTML = `
        <label>${nameLabel}<input name="name" required maxlength="100" placeholder="Enter a name"></label>
        <label>${typeLabel}<input name="type" maxlength="100" placeholder="Optional"></label>
        <label>Information and Lore<textarea name="details" placeholder="${placeholder}"></textarea></label>
        <button class="primary">＋ Save ${label}</button>
    `;

    form.onsubmit = event => {
        event.preventDefault();
        const data = new FormData(form);
        state[key].push({
            id: Date.now() + "",
            name: data.get("name").trim(),
            type: data.get("type").trim(),
            details: data.get("details").trim()
        });
        save();
        collectionForm(key, label, nameLabel, typeLabel, placeholder);
        toast(label + " saved");
    };

    root.append(form);

    const list = document.createElement("div");
    list.className = "cards";

    if (!state[key].length) {
        const message = document.createElement("p");
        message.className = "help";
        message.textContent = "Nothing saved yet";
        list.append(message);
    }

    state[key].forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        const info = document.createElement("div");
        info.className = "card-main";

        const title = document.createElement("strong");
        title.textContent = item.name;

        const description = document.createElement("p");
        description.textContent = [item.type, item.details].filter(Boolean).join("\\n\\n");
        info.append(title, description);

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.onclick = () => {
            form.elements.name.value = item.name;
            form.elements.type.value = item.type;
            form.elements.details.value = item.details;
            form.onsubmit = event => {
                event.preventDefault();
                const data = new FormData(form);
                Object.assign(item, {
                    name: data.get("name").trim(),
                    type: data.get("type").trim(),
                    details: data.get("details").trim()
                });
                save();
                collectionForm(key, label, nameLabel, typeLabel, placeholder);
                toast("Changes saved");
            };
        };

        const remove = document.createElement("button");
        remove.textContent = "×";
        remove.onclick = () => {
            askConfirm("Delete " + item.name + "?", "This " + label.toLowerCase() + " will be permanently removed from this project.")
                .then(confirmed => {
                    if (!confirmed) return;
                    state[key] = state[key].filter(x => x.id !== item.id);
                    save();
                    collectionForm(key, label, nameLabel, typeLabel, placeholder);
                });
        };

        actions.append(edit, remove);
        card.append(info, actions);
        list.append(card);
    });

    root.append(list);
}

function worldForm() {
    const root = $("drawerContent");
    const form = document.createElement("form");
    form.className = "form";
    form.innerHTML = `
        <label>World overview<textarea name="overview" placeholder="world overview"></textarea></label>
        <label>History and timeline<textarea name="history" placeholder="events, legends, eras"></textarea></label>
        <label>Rules and systems<textarea name="rules" placeholder="politics, culture, law"></textarea></label>
        <label>Extra notes<textarea name="notes" placeholder="notes"></textarea></label>
        <button class="primary">Save notes</button>
    `;

    Object.keys(state.world).forEach(key => form.elements[key].value = state.world[key] || "");
    form.onsubmit = event => {
        event.preventDefault();
        Object.keys(state.world).forEach(key => state.world[key] = form.elements[key].value);
        save();
        toast("World notes saved");
    };

    root.replaceChildren(form);
}

function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

function safe(name) {
    return (name || "story").replace(/[<>:"/\\\\|?*\\x00-\\x1F]/g, "-").trim() || "story";
}

function exportPanel() {
    const root = $("drawerContent");
    root.innerHTML = `
        <p class="help">Export your script</p>
        <div class="export-actions">
            <button id="txtExport">Export manuscript (.txt)</button>
            <button id="jsonExport">Export project backup (.json)</button>
            <button id="printExport">Print manuscript</button>
        </div>
    `;

    $("txtExport").onclick = () => {
        savePage();
        const output = [state.projectName, "\\n"];
        state.pages.forEach((p, index) => {
            const div = document.createElement("div");
            div.innerHTML = p.html;
            output.push(`\\n${index + 1}. ${p.title}\\n\\n${div.innerText}\\n`);
        });
        download(safe(state.projectName) + ".txt", output.join(""), "text/plain;charset=utf-8");
    };

    $("jsonExport").onclick = () => {
        savePage();
        download(safe(state.projectName) + "-backup.json", JSON.stringify(state, null, 2), "application/json");
    };

    $("printExport").onclick = () => window.print();
}

$("topTitle").textContent = state.projectName;
$("restorePages").style.display = "none";
renderPages();
loadPage();
openTab("characters");
})();