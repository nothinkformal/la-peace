// ============================================================
// MUSIC MAKER
// ============================================================


// ============================================================
// HTML ELEMENTS
// ============================================================

const grid =
    document.getElementById("grid");


const playButton =
    document.getElementById("playButton");


const stopButton =
    document.getElementById("stopButton");


const clearButton =
    document.getElementById("clearButton");


const tempoInput =
    document.getElementById("tempoInput");


const tempoValue =
    document.getElementById("tempoValue");


const downloadButton =
    document.getElementById("downloadButton");


/*
    Optional download format selector.

    If your HTML contains:

    <select id="downloadFormat">
        <option value="wav">WAV</option>
        <option value="webm">WebM</option>
    </select>

    the selected format will be used.

    If it doesn't exist, WAV is used automatically.
*/

const downloadFormat =
    document.getElementById("downloadFormat");


// ============================================================
// SETTINGS ELEMENTS
// ============================================================

const settingsButton =
    document.getElementById("settingsButton");


const settingsOverlay =
    document.getElementById("settingsOverlay");


const closeSettingsButton =
    document.getElementById("closeSettingsButton");


const volumeInput =
    document.getElementById("volumeInput");


const volumeValue =
    document.getElementById("volumeValue");


const muteInput =
    document.getElementById("muteInput");


const decreaseLengthButton =
    document.getElementById("decreaseLengthButton");


const increaseLengthButton =
    document.getElementById("increaseLengthButton");


const trackLengthValue =
    document.getElementById("trackLengthValue");


// ============================================================
// GRID SETTINGS
// ============================================================

let columns = 32;


/*
    16 rows total:

    0  - 13 = melody
    14      = kick
    15      = snare
*/

const rows = 16;


const MELODY_ROWS = 14;


const KICK_ROW = 14;


const SNARE_ROW = 15;


const MIN_COLUMNS = 16;


const MAX_COLUMNS = 128;


const COLUMN_STEP = 4;


// ============================================================
// NOTES
// ============================================================

/*
    The 14 melody rows use:

    C6
    B5
    A5
    G5
    F5
    E5
    D5
    C5
    B4
    A4
    G4
    F4
    E4
    D4
*/

const notePool = [

    "C6",

    "B5",

    "A5",

    "G5",

    "F5",

    "E5",

    "D5",

    "C5",

    "B4",

    "A4",

    "G4",

    "F4",

    "E4",

    "D4"

];


// ============================================================
// CELL COLORS
// ============================================================

const cellColors = [

    "#ff6b6b",

    "#ff9f43",

    "#feca57",

    "#48dbfb",

    "#54a0ff",

    "#5f27cd",

    "#1dd1a1",

    "#ff6ff3",

    "#00d2d3",

    "#ff7f50"

];


// ============================================================
// CURRENT INSTRUMENT
// ============================================================

let currentInstrument = "piano";


// ============================================================
// SONG DATA
// ============================================================

let song = [];


// ============================================================
// CREATE EMPTY SONG DATA
// ============================================================

function createSongData() {

    song = [];


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        song[row] = [];


        for (
            let column = 0;
            column < columns;
            column++
        ) {

            song[row][column] = {

                active: false,

                instrument: null,

                color: null

            };

        }

    }

}


// ============================================================
// CREATE INITIAL SONG
// ============================================================

createSongData();


// ============================================================
// RESIZE SONG DATA
// ============================================================

/*
    Changes the number of columns while
    preserving existing notes wherever possible.
*/

function resizeSongData(newColumns) {

    const oldSong = song;


    const oldColumns = columns;


    columns = newColumns;


    song = [];


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        song[row] = [];


        for (
            let column = 0;
            column < columns;
            column++
        ) {

            if (
                column < oldColumns &&
                oldSong[row] &&
                oldSong[row][column]
            ) {

                song[row][column] =
                    oldSong[row][column];

            } else {

                song[row][column] = {

                    active: false,

                    instrument: null,

                    color: null

                };

            }

        }

    }

}


// ============================================================
// AUDIO MASTER
// ============================================================

const masterVolume =
    new Tone.Volume(0)
        .toDestination();


let recorder = null;

// ============================================================
// AUDIO EFFECTS
// ============================================================


// ------------------------------------------------------------
// STRINGS FILTER
// ------------------------------------------------------------

const stringFilter =
    new Tone.Filter(
        2200,
        "lowpass"
    ).connect(masterVolume);


// ------------------------------------------------------------
// STRINGS VIBRATO
// ------------------------------------------------------------

const stringVibrato =
    new Tone.Vibrato(
        5,
        0.08
    ).connect(stringFilter);


// ------------------------------------------------------------
// FLUTE FILTER
// ------------------------------------------------------------

const fluteFilter =
    new Tone.Filter(
        2800,
        "lowpass"
    ).connect(masterVolume);


// ------------------------------------------------------------
// FLUTE VIBRATO
// ------------------------------------------------------------

const fluteVibrato =
    new Tone.Vibrato(
        5.5,
        0.03
    ).connect(fluteFilter);


// ------------------------------------------------------------
// FLUTE REVERB
// ------------------------------------------------------------

const fluteReverb =
    new Tone.Reverb({

        decay: 1.5,

        wet: 0.18

    }).connect(fluteVibrato);


// ============================================================
// INSTRUMENTS
// ============================================================


// ============================================================
// PIANO
// ============================================================

const piano =
    new Tone.PolySynth(
        Tone.FMSynth,
        {

            harmonicity: 3,

            modulationIndex: 10,

            oscillator: {

                type: "sine"

            },

            envelope: {

                attack: 0.005,

                decay: 0.45,

                sustain: 0.08,

                release: 1.2

            },

            modulation: {

                type: "sine"

            },

            modulationEnvelope: {

                attack: 0.005,

                decay: 0.2,

                sustain: 0.1,

                release: 0.5

            }

        }

    ).connect(masterVolume);


// ============================================================
// SYNTH
// ============================================================

const synthFilter =
    new Tone.Filter(
        1600,
        "lowpass"
    ).connect(masterVolume);


const synth =
    new Tone.PolySynth(
        Tone.Synth,
        {

            oscillator: {

                type: "sawtooth"

            },

            envelope: {

                attack: 0.03,

                decay: 0.25,

                sustain: 0.65,

                release: 0.6

            }

        }

    ).connect(synthFilter);


// ============================================================
// MARIMBA
// ============================================================

const marimba =
    new Tone.PolySynth(
        Tone.FMSynth,
        {

            harmonicity: 3,

            modulationIndex: 8,

            oscillator: {

                type: "sine"

            },

            envelope: {

                attack: 0.001,

                decay: 0.7,

                sustain: 0.02,

                release: 0.3

            },

            modulation: {

                type: "sine"

            },

            modulationEnvelope: {

                attack: 0.001,

                decay: 0.25,

                sustain: 0,

                release: 0.2

            }

        }

    ).connect(masterVolume);


// ============================================================
// STRINGS
// ============================================================

const strings =
    new Tone.PolySynth(
        Tone.Synth,
        {

            oscillator: {

                type: "sawtooth"

            },

            envelope: {

                attack: 0.35,

                decay: 0.4,

                sustain: 0.8,

                release: 1.8

            }

        }

    ).connect(stringVibrato);


// ============================================================
// FLUTE
// ============================================================

const flute =
    new Tone.FMSynth({

        harmonicity: 1,

        modulationIndex: 1.5,

        oscillator: {

            type: "sine"

        },

        envelope: {

            attack: 0.12,

            decay: 0.2,

            sustain: 0.75,

            release: 0.8

        },

        modulation: {

            type: "sine"

        },

        modulationEnvelope: {

            attack: 0.1,

            decay: 0.2,

            sustain: 0.3,

            release: 0.5

        }

    }).connect(fluteReverb);


// ============================================================
// DRUMS
// ============================================================


// ------------------------------------------------------------
// KICK
// ------------------------------------------------------------

const kick =
    new Tone.MembraneSynth({

        pitchDecay: 0.05,

        octaves: 4,

        oscillator: {

            type: "sine"

        },

        envelope: {

            attack: 0.001,

            decay: 0.25,

            sustain: 0,

            release: 0.05

        }

    }).connect(masterVolume);


// ------------------------------------------------------------
// SNARE
// ------------------------------------------------------------

const snare =
    new Tone.NoiseSynth({

        noise: {

            type: "white"

        },

        envelope: {

            attack: 0.001,

            decay: 0.12,

            sustain: 0,

            release: 0.05

        }

    }).connect(masterVolume);


// ============================================================
// PLAY DRUM
// ============================================================

function playDrum(
    row,
    time = undefined
) {

    if (row === KICK_ROW) {

        kick.triggerAttackRelease(
            "C1",
            "8n",
            time
        );

        return;

    }


    if (row === SNARE_ROW) {

        snare.triggerAttackRelease(
            "8n",
            time
        );

    }

}


// ============================================================
// INSTRUMENT COLLECTION
// ============================================================

const instruments = {

    piano: piano,

    synth: synth,

    marimba: marimba,

    strings: strings,

    flute: flute

};


// ============================================================
// GRID CELL REFERENCES
// ============================================================

let cells = [];


// ============================================================
// GET NOTES
// ============================================================

function getNotes() {

    /*
        Only the first 14 rows are melodic.

        The final two rows are drums and
        therefore never use this list.
    */

    return notePool.slice(
        0,
        MELODY_ROWS
    );

}


// ============================================================
// ACTIVATE CELL
// ============================================================

function activateCell(
    row,
    column
) {

    const cellData =
        song[row][column];


    const cell =
        cells[row][column];


    if (cellData.active) {

        return;

    }


    cellData.active = true;


    /*
        Drum rows don't use the selected
        melody instrument.
    */

    if (row < MELODY_ROWS) {

        cellData.instrument =
            currentInstrument;

    } else {

        cellData.instrument =
            null;

    }


    const randomColor =
        cellColors[
            Math.floor(
                Math.random() *
                cellColors.length
            )
        ];


    cellData.color =
        randomColor;


    cell.style.backgroundColor =
        randomColor;


    /*
        Preview the sound immediately.
    */

    if (row >= MELODY_ROWS) {

        playDrum(row);

        return;

    }


    const notes =
        getNotes();


    playNote(
        notes[row],
        cellData.instrument
    );

}


// ============================================================
// DEACTIVATE CELL
// ============================================================

function deactivateCell(
    row,
    column
) {

    const cellData =
        song[row][column];


    const cell =
        cells[row][column];


    if (!cellData.active) {

        return;

    }


    cellData.active = false;


    cellData.instrument = null;


    cellData.color = null;


    cell.style.backgroundColor =
        "";

}


// ============================================================
// TOGGLE CELL
// ============================================================

function toggleCell(
    row,
    column
) {

    const cellData =
        song[row][column];


    if (cellData.active) {

        deactivateCell(
            row,
            column
        );

    } else {

        activateCell(
            row,
            column
        );

    }

}


// ============================================================
// CREATE GRID
// ============================================================

function createGrid() {

    grid.innerHTML = "";


    cells = [];


    grid.style.setProperty(
        "--columns",
        columns
    );


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        cells[row] = [];


        for (
            let column = 0;
            column < columns;
            column++
        ) {

            const cell =
                document.createElement(
                    "div"
                );


            cell.classList.add(
                "cell"
            );


            cell.dataset.row =
                row;


            cell.dataset.column =
                column;


            /*
                Mark the drum rows.
            */

            if (
                row >= MELODY_ROWS
            ) {

                cell.classList.add(
                    "drum-cell"
                );

            }


            if (
                row === KICK_ROW
            ) {

                cell.classList.add(
                    "kick-row"
                );

            }


            if (
                row === SNARE_ROW
            ) {

                cell.classList.add(
                    "snare-row"
                );

            }


            /*
                Restore existing song data.
            */

            const cellData =
                song[row][column];


            if (
                cellData.active
            ) {

                cell.style.backgroundColor =
                    cellData.color;

            }


            cells[row][column] =
                cell;


            grid.appendChild(
                cell
            );

        }

    }

}


// ============================================================
// CREATE INITIAL GRID
// ============================================================

createGrid();


// ============================================================
// UPDATE TRACK LENGTH DISPLAY
// ============================================================

function updateTrackLengthDisplay() {

    trackLengthValue.textContent =
        columns;

}


updateTrackLengthDisplay();


// ============================================================
// NORMAL CLICK
// ============================================================

let suppressNextClick = false;


grid.addEventListener(
    "click",
    async (event) => {

        if (suppressNextClick) {

            suppressNextClick = false;

            return;

        }


        const cell =
            event.target.closest(
                ".cell"
            );


        if (!cell) {

            return;

        }


        await Tone.start();


        const row =
            Number(
                cell.dataset.row
            );


        const column =
            Number(
                cell.dataset.column
            );


        toggleCell(
            row,
            column
        );

    }
);


// ============================================================
// DRAG SYSTEM
// ============================================================

let isPointerDown = false;


let isDragging = false;


let dragMode = null;


let dragStartRow = null;


let dragStartColumn = null;


let draggedCells =
    new Set();


// ============================================================
// POINTER DOWN
// ============================================================

grid.addEventListener(
    "pointerdown",
    async (event) => {

        const cell =
            event.target.closest(
                ".cell"
            );


        if (!cell) {

            return;

        }


        event.preventDefault();


        await Tone.start();


        isPointerDown = true;


        isDragging = false;


        dragStartRow =
            Number(
                cell.dataset.row
            );


        dragStartColumn =
            Number(
                cell.dataset.column
            );


        const cellData =
            song[
                dragStartRow
            ][
                dragStartColumn
            ];


        if (
            cellData.active
        ) {

            dragMode = "remove";

        } else {

            dragMode = "add";

        }


        draggedCells.clear();

    }
);


// ============================================================
// POINTER MOVE
// ============================================================

grid.addEventListener(
    "pointermove",
    (event) => {

        if (!isPointerDown) {

            return;

        }


        const element =
            document.elementFromPoint(
                event.clientX,
                event.clientY
            );


        if (!element) {

            return;

        }


        const targetCell =
            element.closest(
                ".cell"
            );


        if (!targetCell) {

            return;

        }


        const row =
            Number(
                targetCell.dataset.row
            );


        const column =
            Number(
                targetCell.dataset.column
            );


        const key =
            `${row}-${column}`;


        /*
            Begin drag.
        */

        if (!isDragging) {

            isDragging = true;


            suppressNextClick = true;


            const startKey =
                `${dragStartRow}-${dragStartColumn}`;


            draggedCells.add(
                startKey
            );


            if (
                dragMode === "add"
            ) {

                activateCell(
                    dragStartRow,
                    dragStartColumn
                );

            } else {

                deactivateCell(
                    dragStartRow,
                    dragStartColumn
                );

            }

        }


        /*
            Don't process the same cell twice.
        */

        if (
            draggedCells.has(key)
        ) {

            return;

        }


        draggedCells.add(
            key
        );


        if (
            dragMode === "add"
        ) {

            activateCell(
                row,
                column
            );

        } else {

            deactivateCell(
                row,
                column
            );

        }

    }
);


// ============================================================
// POINTER UP
// ============================================================

document.addEventListener(
    "pointerup",
    () => {

        isPointerDown = false;


        isDragging = false;


        dragMode = null;


        dragStartRow = null;


        dragStartColumn = null;


        draggedCells.clear();

    }
);


// ============================================================
// POINTER CANCEL
// ============================================================

document.addEventListener(
    "pointercancel",
    () => {

        isPointerDown = false;


        isDragging = false;


        dragMode = null;


        dragStartRow = null;


        dragStartColumn = null;


        draggedCells.clear();

    }
);


// ============================================================
// PLAY NOTE
// ============================================================

/*
    The important change here is the optional
    "time" parameter.

    When called by Tone.Transport, the note is
    scheduled at the exact Transport time instead
    of being triggered immediately.
*/

function playNote(
    note,
    instrumentName,
    time = undefined
) {

    const instrument =
        instruments[
            instrumentName
        ];


    if (!instrument) {

        console.warn(
            "Instrument not found:",
            instrumentName
        );

        return;

    }


    if (
        instrumentName === "flute"
    ) {

        instrument.triggerAttackRelease(
            note,
            "4n",
            time
        );

        return;

    }


    if (
        instrumentName === "strings"
    ) {

        instrument.triggerAttackRelease(
            note,
            "4n",
            time
        );

        return;

    }


    instrument.triggerAttackRelease(
        note,
        "8n",
        time
    );

}


// ============================================================
// INSTRUMENT SELECTION
// ============================================================

const instrumentButtons =
    document.querySelectorAll(
        ".instrument"
    );


instrumentButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            async () => {

                await Tone.start();


                currentInstrument =
                    button.dataset.instrument;


                instrumentButtons.forEach(
                    otherButton => {

                        otherButton.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                console.log(
                    "Selected instrument:",
                    currentInstrument
                );

            }
        );

    }
);


// ============================================================
// SEQUENCER
// ============================================================

let currentColumn = 0;


let isPlaying = false;


let bpm =
    Number(
        tempoInput.value
    );


// ============================================================
// TEMPO
// ============================================================

function updateTempo() {

    let newTempo =
        Number(
            tempoInput.value
        );


    if (
        !Number.isFinite(
            newTempo
        )
    ) {

        newTempo = 120;

    }


    if (
        newTempo < 40
    ) {

        newTempo = 40;

    }


    if (
        newTempo > 240
    ) {

        newTempo = 240;

    }


    tempoInput.value =
        newTempo;


    bpm =
        newTempo;


    Tone.Transport.bpm.value =
        bpm;


    if (tempoValue) {

        tempoValue.textContent =
            bpm;

    }

}


tempoInput.addEventListener(
    "input",
    updateTempo
);


tempoInput.addEventListener(
    "change",
    updateTempo
);


updateTempo();


// ============================================================
// SETTINGS — OPEN
// ============================================================

settingsButton.addEventListener(
    "click",
    () => {

        settingsOverlay.classList.add(
            "open"
        );

    }
);


// ============================================================
// SETTINGS — CLOSE
// ============================================================

closeSettingsButton.addEventListener(
    "click",
    () => {

        settingsOverlay.classList.remove(
            "open"
        );

    }
);


// ============================================================
// SETTINGS — CLICK OUTSIDE
// ============================================================

settingsOverlay.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            settingsOverlay
        ) {

            settingsOverlay.classList.remove(
                "open"
            );

        }

    }
);


// ============================================================
// VOLUME
// ============================================================

function updateVolume() {

    const volume =
        Number(
            volumeInput.value
        );


    volumeValue.textContent =
        `${volume}%`;


    if (
        volume === 0
    ) {

        masterVolume.volume.value =
            -Infinity;

        return;

    }


    const db =
        -40 +
        (volume / 100) *
        40;


    masterVolume.volume.value =
        db;

}


volumeInput.addEventListener(
    "input",
    updateVolume
);


updateVolume();


// ============================================================
// MUTE
// ============================================================

muteInput.addEventListener(
    "change",
    () => {

        masterVolume.mute =
            muteInput.checked;

    }
);


// ============================================================
// CHANGE TRACK LENGTH
// ============================================================

function changeTrackLength(
    amount
) {

    const newColumns =
        columns + amount;


    if (
        newColumns < MIN_COLUMNS
    ) {

        return;

    }


    if (
        newColumns > MAX_COLUMNS
    ) {

        return;

    }


    stopSequencer();


    resizeSongData(
        newColumns
    );


    createGrid();


    updateTrackLengthDisplay();


    const gridContainer =
        grid.parentElement;


    if (gridContainer) {

        gridContainer.scrollLeft =
            0;

    }

}


// ============================================================
// DECREASE TRACK LENGTH
// ============================================================

decreaseLengthButton.addEventListener(
    "click",
    () => {

        changeTrackLength(
            -COLUMN_STEP
        );

    }
);


// ============================================================
// INCREASE TRACK LENGTH
// ============================================================

increaseLengthButton.addEventListener(
    "click",
    () => {

        changeTrackLength(
            COLUMN_STEP
        );

    }
);


// ============================================================
// CLEAR PLAYHEAD
// ============================================================

function clearPlayhead() {

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            cells[row][column]
                .classList
                .remove(
                    "playing"
                );

        }

    }

}


// ============================================================
// SHOW PLAYHEAD
// ============================================================

function showPlayhead(
    column
) {

    clearPlayhead();


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        cells[row][column]
            .classList
            .add(
                "playing"
            );

    }

}


// ============================================================
// PLAY COLUMN
// ============================================================

function playColumn(
    column,
    time = undefined
) {

    showPlayhead(
        column
    );


    const notes =
        getNotes();


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        const cellData =
            song[row][column];


        if (
            !cellData.active
        ) {

            continue;

        }


        /*
            Rows 14 and 15 are drums.
        */

        if (
            row >= MELODY_ROWS
        ) {

            playDrum(
                row,
                time
            );

        } else {

            playNote(
                notes[row],
                cellData.instrument,
                time
            );

        }

    }

}


// ============================================================
// START SEQUENCER
// ============================================================

async function startSequencer() {

    if (
        isPlaying
    ) {

        return;

    }


    await Tone.start();


    isPlaying = true;


    currentColumn = 0;


    Tone.Transport.bpm.value =
        bpm;


    /*
        Remove any previous scheduled events.
    */

    Tone.Transport.cancel();


    /*
        IMPORTANT:

        The old version played column 0 immediately
        and then started the transport.

        That meant the first note was not actually
        synchronized with the transport clock.

        Now column 0 is scheduled at transport time 0.
    */

    Tone.Transport.scheduleRepeat(
        (time) => {

            const column =
                currentColumn;


            playColumn(
                column,
                time
            );


            currentColumn++;


            if (
                currentColumn >=
                columns
            ) {

                currentColumn = 0;

            }

        },
        "8n",
        0
    );


    Tone.Transport.start();

}


// ============================================================
// STOP SEQUENCER
// ============================================================

function stopSequencer() {

    isPlaying = false;


    Tone.Transport.stop();


    Tone.Transport.cancel();


    currentColumn = 0;


    clearPlayhead();

}


// ============================================================
// EXPORT SETTINGS
// ============================================================

let isRecording = false;


/*
    Extra time after the final column.

    This allows instruments such as strings,
    flute and piano to finish their releases
    instead of being abruptly cut off.
*/

const EXPORT_TAIL_SECONDS = 2.0;


// ============================================================
// WAV CONVERTER
// ============================================================

/*
    Tone.Recorder produces a browser recording,
    normally using a compressed MediaRecorder
    format such as WebM.

    This function converts the decoded audio
    into a genuine 16-bit PCM WAV file.
*/

function audioBufferToWav(
    audioBuffer
) {

    const numberOfChannels =
        audioBuffer.numberOfChannels;


    const sampleRate =
        audioBuffer.sampleRate;


    const bytesPerSample =
        2;


    const dataLength =
        audioBuffer.length *
        numberOfChannels *
        bytesPerSample;


    const buffer =
        new ArrayBuffer(
            44 + dataLength
        );


    const view =
        new DataView(
            buffer
        );


    function writeString(
        offset,
        string
    ) {

        for (
            let i = 0;
            i < string.length;
            i++
        ) {

            view.setUint8(
                offset + i,
                string.charCodeAt(i)
            );

        }

    }


    /*
        RIFF header.
    */

    writeString(
        0,
        "RIFF"
    );


    view.setUint32(
        4,
        36 + dataLength,
        true
    );


    writeString(
        8,
        "WAVE"
    );


    /*
        fmt chunk.
    */

    writeString(
        12,
        "fmt "
    );


    view.setUint32(
        16,
        16,
        true
    );


    /*
        PCM format.
    */

    view.setUint16(
        20,
        1,
        true
    );


    view.setUint16(
        22,
        numberOfChannels,
        true
    );


    view.setUint32(
        24,
        sampleRate,
        true
    );


    view.setUint32(
        28,
        sampleRate *
        numberOfChannels *
        bytesPerSample,
        true
    );


    view.setUint16(
        32,
        numberOfChannels *
        bytesPerSample,
        true
    );


    view.setUint16(
        34,
        16,
        true
    );


    /*
        Data chunk.
    */

    writeString(
        36,
        "data"
    );


    view.setUint32(
        40,
        dataLength,
        true
    );


    /*
        Get each channel's samples.
    */

    const channelData = [];


    for (
        let channel = 0;
        channel < numberOfChannels;
        channel++
    ) {

        channelData.push(
            audioBuffer.getChannelData(
                channel
            )
        );

    }


    let offset = 44;


    /*
        Interleave the channels.
    */

    for (
        let sample = 0;
        sample < audioBuffer.length;
        sample++
    ) {

        for (
            let channel = 0;
            channel < numberOfChannels;
            channel++
        ) {

            let value =
                channelData[
                    channel
                ][
                    sample
                ];


            /*
                Clamp the sample.
            */

            value =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        value
                    )
                );


            /*
                Convert float [-1, 1]
                into signed 16-bit PCM.
            */

            const pcmValue =
                value < 0
                    ? value * 0x8000
                    : value * 0x7fff;


            view.setInt16(
                offset,
                pcmValue,
                true
            );


            offset += 2;

        }

    }


    return new Blob(
        [buffer],
        {
            type: "audio/wav"
        }
    );

}


// ============================================================
// SAVE AUDIO FILE
// ============================================================

function saveAudioBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


// ============================================================
// DOWNLOAD TRACK
// ============================================================

async function downloadTrack() {

    if (isRecording) {
        return;
    }

    await Tone.start();

    if (!Tone.Recorder.supported) {

        alert(
            "Audio recording is not supported in this browser."
        );

        return;
    }

    isRecording = true;

    downloadButton.disabled = true;

    playButton.disabled = true;
    stopButton.disabled = true;
    clearButton.disabled = true;

    decreaseLengthButton.disabled = true;
    increaseLengthButton.disabled = true;

    tempoInput.disabled = true;
    volumeInput.disabled = true;
    muteInput.disabled = true;

    if (downloadFormat) {
        downloadFormat.disabled = true;
    }

    downloadButton.textContent =
        "Recording...";


    try {

        // ========================================================
        // STOP NORMAL PLAYBACK
        // ========================================================

        stopSequencer();


        // ========================================================
        // SET TRANSPORT TEMPO
        // ========================================================

        Tone.Transport.bpm.value =
            bpm;


        // ========================================================
        // CALCULATE TIMING
        // ========================================================

        /*
            Every step in the sequencer is an eighth note.

            Tone.Transport is used for the entire export so
            the recording follows exactly the same musical
            clock as playback.
        */

        const stepDuration =
            Tone.Time(
                "8n"
            ).toSeconds();


        /*
            One complete pass through the song.
        */

        const trackDuration =
            columns *
            stepDuration;


        /*
            Extra time at the end allows instruments with
            longer releases to finish naturally.
        */

        const exportDuration =
            trackDuration +
            EXPORT_TAIL_SECONDS;


        // ========================================================
        // CREATE A FRESH RECORDER
        // ========================================================

        /*
            IMPORTANT:

            Never reuse the recorder from a previous export.

            A completely new Tone.Recorder is created every
            time Download is pressed.
        */

        recorder =
            new Tone.Recorder();


        /*
            Connect this recorder to the master output.

            The recorder receives exactly what the user hears.
        */

        masterVolume.connect(
            recorder
        );


        // ========================================================
        // START RECORDING
        // ========================================================

        /*
            Start recording BEFORE starting Tone.Transport.

            This ensures the first column is captured.
        */

        await recorder.start();


        // ========================================================
        // RESET TRANSPORT
        // ========================================================

        currentColumn = 0;

        isPlaying = true;

        Tone.Transport.stop();

        Tone.Transport.cancel();

        Tone.Transport.position = 0;


        // ========================================================
        // SCHEDULE EVERY COLUMN
        // ========================================================

        /*
            Schedule every column individually.

            We do NOT use scheduleRepeat here because the
            downloaded song should only play once.
        */

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            const columnTime =
                column *
                stepDuration;


            Tone.Transport.scheduleOnce(
                (time) => {

                    currentColumn =
                        column;


                    playColumn(
                        column,
                        time
                    );

                },
                columnTime
            );

        }


        // ========================================================
        // END EXPORT
        // ========================================================

        Tone.Transport.scheduleOnce(
            async () => {

                try {

                    isPlaying = false;

                    currentColumn = 0;

                    clearPlayhead();


                    /*
                        Stop the musical clock first.
                    */

                    Tone.Transport.stop();

                    Tone.Transport.cancel();


                    /*
                        Finish the recording.
                    */

                    const recording =
                        await recorder.stop();


                    // ====================================================
                    // DISPOSE RECORDER
                    // ====================================================

                    /*
                        This is important.

                        The recorder is destroyed after every export,
                        so the next download gets a completely fresh
                        MediaRecorder.
                    */

                    recorder.dispose();

                    recorder = null;


                    // ====================================================
                    // DETERMINE FORMAT
                    // ====================================================

                    const format =
                        downloadFormat
                            ? downloadFormat.value
                            : "wav";


                    // ====================================================
                    // WEBM
                    // ====================================================

                    if (
                        format === "webm"
                    ) {

                        saveAudioBlob(
                            recording,
                            "La-Peace-Lab-Track.webm"
                        );

                    }


                    // ====================================================
                    // WAV
                    // ====================================================

                    else {

                        downloadButton.textContent =
                            "Converting...";


                        /*
                            Convert the WebM recording into
                            an AudioBuffer.
                        */

                        const arrayBuffer =
                            await recording.arrayBuffer();


                        const audioContext =
                            Tone
                                .getContext()
                                .rawContext;


                        const audioBuffer =
                            await audioContext
                                .decodeAudioData(
                                    arrayBuffer.slice(0)
                                );


                        /*
                            Convert the AudioBuffer into
                            a standard 16-bit PCM WAV.
                        */

                        const wavBlob =
                            audioBufferToWav(
                                audioBuffer
                            );


                        saveAudioBlob(
                            wavBlob,
                            "La-Peace-Lab-Track.wav"
                        );

                    }

                }

                catch (error) {

                    console.error(
                        "Could not export track:",
                        error
                    );


                    alert(
                        "The track could not be exported. Check the browser console for details."
                    );

                }


                finally {

                    // ====================================================
                    // RESTORE CONTROLS
                    // ====================================================

                    isRecording = false;


                    downloadButton.disabled = false;

                    playButton.disabled = false;
                    stopButton.disabled = false;
                    clearButton.disabled = false;

                    decreaseLengthButton.disabled =
                        false;

                    increaseLengthButton.disabled =
                        false;

                    tempoInput.disabled = false;
                    volumeInput.disabled = false;
                    muteInput.disabled = false;


                    if (downloadFormat) {
                        downloadFormat.disabled =
                            false;
                    }


                    downloadButton.textContent =
                        "Download";

                }

            },

            exportDuration
        );


        // ========================================================
        // START TRANSPORT
        // ========================================================

        Tone.Transport.start();

    }


    catch (error) {

        console.error(
            "Could not start export:",
            error
        );


        // ========================================================
        // CLEAN UP TRANSPORT
        // ========================================================

        try {

            Tone.Transport.stop();

            Tone.Transport.cancel();

        }

        catch (transportError) {

            console.error(
                "Could not stop transport:",
                transportError
            );

        }


        // ========================================================
        // CLEAN UP RECORDER
        // ========================================================

        try {

            if (recorder) {

                /*
                    Only stop the recorder if it is actually
                    recording.
                */

                if (
                    recorder.state ===
                    "started"
                ) {

                    await recorder.stop();

                }


                recorder.dispose();

                recorder = null;

            }

        }

        catch (recorderError) {

            console.error(
                "Could not stop recorder:",
                recorderError
            );

        }


        // ========================================================
        // RESET SEQUENCER STATE
        // ========================================================

        isPlaying = false;

        currentColumn = 0;

        clearPlayhead();


        // ========================================================
        // RESTORE STATE
        // ========================================================

        isRecording = false;


        downloadButton.disabled = false;

        playButton.disabled = false;
        stopButton.disabled = false;
        clearButton.disabled = false;

        decreaseLengthButton.disabled =
            false;

        increaseLengthButton.disabled =
            false;

        tempoInput.disabled = false;
        volumeInput.disabled = false;
        muteInput.disabled = false;


        if (downloadFormat) {
            downloadFormat.disabled = false;
        }


        downloadButton.textContent =
            "Download";

    }

}
// ============================================================
// CLEAR SONG
// ============================================================

function clearSong() {

    stopSequencer();


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            song[row][column].active =
                false;


            song[row][column].instrument =
                null;


            song[row][column].color =
                null;


            /*
                Clearing the inline background
                allows CSS to restore the normal
                melody/drum cell background.
            */

            cells[row][column]
                .style
                .backgroundColor =
                "";

        }

    }

}


// ============================================================
// PLAY BUTTON
// ============================================================

playButton.addEventListener(
    "click",
    async () => {

        await startSequencer();

    }
);


// ============================================================
// STOP BUTTON
// ============================================================

stopButton.addEventListener(
    "click",
    () => {

        stopSequencer();

    }
);


// ============================================================
// CLEAR BUTTON
// ============================================================

clearButton.addEventListener(
    "click",
    () => {

        clearSong();

    }
);


// ============================================================
// DOWNLOAD BUTTON
// ============================================================

downloadButton.addEventListener(
    "click",
    downloadTrack
);
