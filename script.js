// la peace
//elements
const grid =
    document.getElementById("grid");

const scrollLeftButton =
    document.getElementById("scrollLeftButton");

const scrollRightButton =
    document.getElementById("scrollRightButton");


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


const downloadFormat =
    document.getElementById("downloadFormat");


//settings

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


//grid

let columns = 32;


/*
    16 rows:

    0  - 13 is melody
    14      is kick
    15      is snare
*/

const rows = 16;


const MELODY_ROWS = 14;


const KICK_ROW = 14;


const SNARE_ROW = 15;


const MIN_COLUMNS = 16;


const MAX_COLUMNS = 128;


const COLUMN_STEP = 4;

//notes
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


// possible cell colors

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

//current instrument

let currentInstrument = "piano";


//song data
let song = [];


// creates empty song data as starting point

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


//function call
createSongData();


// optimization

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

// audio stuff
const masterVolume =
    new Tone.Volume(0)
        .toDestination();


let recorder = null;

// more audio stuff

const stringFilter =
    new Tone.Filter(
        2200,
        "lowpass"
    ).connect(masterVolume);


// even more audio stuff
const stringVibrato =
    new Tone.Vibrato(
        5,
        0.08
    ).connect(stringFilter);


// flute
const fluteFilter =
    new Tone.Filter(
        2800,
        "lowpass"
    ).connect(masterVolume);


// flute configuration 
const fluteVibrato =
    new Tone.Vibrato(
        5.5,
        0.03
    ).connect(fluteFilter);


// phonk reverb

const fluteReverb =
    new Tone.Reverb({

        decay: 1.5,

        wet: 0.18

    }).connect(fluteVibrato);


// instruments
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

//synth

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


//marimba

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

//string

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

//flute again

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

// kick
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


//snare

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


//drums

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

//instrument table

const instruments = {

    piano: piano,

    synth: synth,

    marimba: marimba,

    strings: strings,

    flute: flute

};


//cells

let cells = [];

// notes receiver
function getNotes() {
    return notePool.slice(
        0,
        MELODY_ROWS
    );

}

//active cell

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

//deactivate the cells so no more music

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

// select cell so it makes music

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

//create grid

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

//function call

createGrid();

//more track

function updateTrackLengthDisplay() {

    trackLengthValue.textContent =
        columns;

}


updateTrackLengthDisplay();

// click
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


//drag click

let isPointerDown = false;


let isDragging = false;


let dragMode = null;


let dragStartRow = null;


let dragStartColumn = null;


let draggedCells =
    new Set();

//pointer

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


//pointer again

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


//pointer

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

//cancel pointer

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

//play note

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

//instruments

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

//sequencer

let currentColumn = 0;


let isPlaying = false;


let bpm =
    Number(
        tempoInput.value
    );


// thats quite my tempo
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

settingsButton.addEventListener(
    "click",
    () => {

        settingsOverlay.classList.add(
            "open"
        );

    }
);


closeSettingsButton.addEventListener(
    "click",
    () => {

        settingsOverlay.classList.remove(
            "open"
        );

    }
);


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

//volume

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

//mute

muteInput.addEventListener(
    "change",
    () => {

        masterVolume.mute =
            muteInput.checked;

    }
);


//track length configuration

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

//decrease the track length

decreaseLengthButton.addEventListener(
    "click",
    () => {

        changeTrackLength(
            -COLUMN_STEP
        );

    }
);

//increase the track length

increaseLengthButton.addEventListener(
    "click",
    () => {

        changeTrackLength(
            COLUMN_STEP
        );

    }
);


//clear

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

// yeah
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

//play column

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

//sequencer starter

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

    Tone.Transport.cancel();


    
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

function stopSequencer() {

    isPlaying = false;


    Tone.Transport.stop();


    Tone.Transport.cancel();


    currentColumn = 0;


    clearPlayhead();

}

// recorder
let isRecording = false;


const EXPORT_TAIL_SECONDS = 2.0;


//wav maker

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

    writeString(
        12,
        "fmt "
    );


    view.setUint32(
        16,
        16,
        true
    );


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


    writeString(
        36,
        "data"
    );


    view.setUint32(
        40,
        dataLength,
        true
    );


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

            value =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        value
                    )
                );

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

// save audio file

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

//download track

async function downloadTrack() {

    if (isRecording) {
        return;
    }

    await Tone.start();

    const audioContext = Tone.getContext().rawContext;

await audioContext.resume();

if (audioContext.state !== "running") {
    throw new Error("Audio context could not be started.");
}
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

                stopSequencer();

Tone.Transport.stop();
Tone.Transport.cancel();
Tone.Transport.position = 0;

await new Promise(resolve => setTimeout(resolve, 100));
await Tone.start();
await audioContext.resume();
Tone.Transport.bpm.value =
    bpm;

        const stepDuration =
            Tone.Time(
                "8n"
            ).toSeconds();

        const trackDuration =
            columns *
            stepDuration;


            const exportDuration =
            trackDuration +
            EXPORT_TAIL_SECONDS;

        recorder =
            new Tone.Recorder();

        masterVolume.connect(
            recorder
        );


             await recorder.start();


             currentColumn = 0;

        isPlaying = true;

        Tone.Transport.stop();

        Tone.Transport.cancel();

        Tone.Transport.position = 0;

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

                    recorder.dispose();

                    recorder = null;

                    const format =
                        downloadFormat
                            ? downloadFormat.value
                            : "wav";


                    if (
                        format === "webm"
                    ) {

                        saveAudioBlob(
                            recording,
                            "La-Peace-Lab-Track.webm"
                        );

                    }

                    else {

                        downloadButton.textContent =
                            "Converting...";

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
                        "no export ",
                        error
                    );


                    alert(
                        "sorry i cant fulfill this request"
                    );

                }


                finally {

                    //start controls

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


        Tone.Transport.start("+0.05");

    }


    catch (error) {

        console.error(
            "Could not start export:",
            error
        );

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

        try {

            if (recorder) {

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


        isPlaying = false;

        currentColumn = 0;

        clearPlayhead();

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

playButton.addEventListener(
    "click",
    async () => {

        await startSequencer();

    }
);

stopButton.addEventListener(
    "click",
    () => {

        stopSequencer();

    }
);

clearButton.addEventListener(
    "click",
    () => {

        clearSong();

    }
);

downloadButton.addEventListener(
    "click",
    downloadTrack
);

if (scrollLeftButton) {

    scrollLeftButton.addEventListener(
        "click",
        () => {

            const container =
                document.querySelector(
                    ".grid-container"
                );

            if (!container) {
                return;
            }

            container.scrollBy({
                left: -container.clientWidth * 0.8,
                behavior: "smooth"
            });

        }
    );

}


if (scrollRightButton) {

    scrollRightButton.addEventListener(
        "click",
        () => {

            const container =
                document.querySelector(
                    ".grid-container"
                );

            if (!container) {
                return;
            }

            container.scrollBy({
                left: container.clientWidth * 0.8,
                behavior: "smooth"
            });

        }
    );

}
