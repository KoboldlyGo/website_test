/* =========================================================
   1. DOM REFERENCES
========================================================= */

// Get the canvas and its drawing context
const canvas = document.getElementById("characterCanvas");
const ctx = canvas.getContext("2d");

const colorPickers = {
    1: document.getElementById("primaryColor"),
    2: document.getElementById("secondaryColor"),
    3: document.getElementById("limbSecondaryColor"),
    4: document.getElementById("clawColor"),
    5: document.getElementById("hornColor"),
    6: document.getElementById("eyeColor"),
    7: document.getElementById("scaleColor"),
    8: document.getElementById("plateColor"),
    9: document.getElementById("browColor"),
    10: document.getElementById("finColor"),
    11: document.getElementById("earColor")
};

/* =========================================================
   2. CHARACTER CONFIGURATION
========================================================= */

// Available character options
const characterParts = {
    tail: {
        folder: "Tail",
        name: "Tail",
        count: 2,
        flats: [1, 2, 7]
    },

    feet: {
        folder: "Feet",
        name: "Feet",
        count: 2,
        flats: [1, 3, 4, 7]
    },

    body: {
        folder: "Body",
        name: "Body",
        count: 7,
        flats: [1, 2, 7]
    },

    hands: {
        folder: "Hands",
        name: "Hands",
        count: 2,
        flats: [1, 3, 4, 7]
    },

    muzzle: {
        folder: "Muzzle",
        name: "Muzzle",
        count: 3,
        flats: [1, 2, 7]
    },

    brow: {
        folder: "Brows",
        name: "Brow",
        count: 5,
        flats: [1, 9]
    },

    side: {
        folder: "Side",
        name: "Side",
        count: 5,
        flats: [1, 5, 11]
    },

    eyes: {
        folder: "Eyes",
        name: "Eyes",
        count: 5,
        flats: [2, 6]
    },

    horns: {
        folder: "Horns",
        name: "Horns",
        count: 3,
        flats: [1, 5, 8],
        splitLayers: ["Bottom", "Top"]
    }
};

// Define layer order bottom to top for rendering
const layerOrder = [
    { part: "tail" },
    { part: "feet" },
    { part: "body" },
    { part: "hands" },

    { part: "horns", splitLayer: "Bottom" },

    { part: "muzzle" },
    { part: "brow" },
    { part: "eyes" },

    { part: "horns", splitLayer: "Top" },

    { part: "side" }
];

const flatLabels = {
    1: "Body Primary",
    2: "Body Secondary",
    3: "Hands/Feet Secondary",
    4: "Claws",
    5: "Horns",
    6: "Eyes",
    7: "Scales",
    8: "Plates",
    9: "Brow",
    10: "Fins",
    11: "Ears"
};

const partLabelElements = {
    tail: "tailLabel",
    feet: "feetLabel",
    body: "bodyLabel",
    hands: "handsLabel",
    muzzle: "muzzleLabel",
    brow: "browLabel",
    side: "sideLabel",
    eyes: "eyesLabel",
    horns: "hornsLabel"
};

const optionContainers = {
    tail: "tailOptions",
    feet: "feetOptions",
    body: "bodyOptions",
    hands: "handsOptions",
    muzzle: "muzzleOptions",
    brow: "browOptions",
    side: "sideOptions",
    eyes: "eyesOptions",
    horns: "hornOptions"
};

const flatToggleContainers = {
    tail: "tailFlatToggles",
    feet: "feetFlatToggles",
    body: "bodyFlatToggles",
    hands: "handsFlatToggles",
    muzzle: "muzzleFlatToggles",
    brow: "browFlatToggles",
    side: "sideFlatToggles",
    eyes: "eyesFlatToggles",
    horns: "hornFlatToggles"
};

const backgroundCount = 4;

/* =========================================================
   3. Default Selections
========================================================= */

// Current character selections
let selectedBackground = 0;

const selectedParts = {
    tail: 0,
    feet: 0,
    body: 0,
    hands: 0,
    muzzle: 0,
    brow: 0,
    side: 0,
    eyes: 0,
    horns: 0
};

// Current colors
const defaultColors = {
    1: "#b83b35",  // Body Primary
    2: "#da8f8b",  // Body Secondary
    3: "#da8f8b",  // Hands/Feet Secondary
    4: "#fff1d6",  // Claws
    5: "#e2a87e",  // Horns
    6: "#d6d251",  // Eyes
    7: "#751a1a",  // Scales
    8: "#282624",  // Plates
    9: "#751a1a",  // Brow
    10: "#751a1a", // Fins
    11: "#da8f8b"  // Ears
};

const selectedColors = {
    ...defaultColors
};

/* =========================================================
   4. APPLICATION STATE
========================================================= */

const flatVisibility = {};

const partNames = {};

let renderVersion = 0;

/* =========================================================
   5. ASSET / DATA LOADING UTILITIES
========================================================= */

// Load an image
const imageCache = new Map();

function loadImage(path) {

    if (imageCache.has(path)) {
        return imageCache.get(path);
    }

    const promise = new Promise((resolve, reject) => {

        const image = new Image();

        image.onload = () => resolve(image);

        image.onerror = () => {
            imageCache.delete(path);
            reject(new Error("Could not load " + path));
        };

        image.src = path;
    });

    imageCache.set(path, promise);

    return promise;
}


async function loadPartNames() {

    try {

        const response =
            await fetch("assets/character/PartNames.csv");

        if (!response.ok) {
            throw new Error(
                `Could not load PartNames.csv: ${response.status}`
            );
        }

        const csvText = await response.text();

        const lines =
            csvText
                .trim()
                .split(/\r?\n/);

        // Skip the header row
        for (let i = 1; i < lines.length; i++) {

            const line = lines[i];

            // Split only on the first comma
            const commaIndex = line.indexOf(",");

            if (commaIndex === -1) {
                continue;
            }

            const part =
                line
                    .slice(0, commaIndex)
                    .trim();

            const name =
                line
                    .slice(commaIndex + 1)
                    .trim();

            partNames[part] = name;
        }

    } catch (error) {

        console.error(
            "Could not load part names:",
            error
        );
    }
}


function getPartPaths(partName, index, splitLayer = null) {

    const part = characterParts[partName];

    // Files start at 1; JavaScript selections start at 0
    const fileNumber = index + 1;

    let basePath =
        `assets/character/${part.folder}/${part.name}${fileNumber}`;

    // Split parts such as Horns use:
    // Horns1_Top_Flats1.png
    // Horns1_Bottom_Flats1.png
    if (splitLayer !== null) {
        basePath += `_${splitLayer}`;
    }

    return {
        flats: part.flats.map(flatNumber => ({
            number: flatNumber,
            path: `${basePath}_Flats${flatNumber}.png`
        })),

        lines: `${basePath}_Lines.png`
    };
}

function getPreviewPaths(partName) {

    const part = characterParts[partName];
    const previews = [];

    for (let i = 0; i < part.count; i++) {

        const fileNumber = i + 1;

        // Preferred custom thumbnail
        const thumbnailPath =
            `assets/character/Thumbnails/${part.name}${fileNumber}.png`;

        let partPaths;

        if (part.splitLayers) {

            // Horns are split into Top and Bottom.
            // Use the Top flat as the fallback preview.
            partPaths = getPartPaths(
                partName,
                i,
                "Top"
            );

        } else {

            partPaths = getPartPaths(
                partName,
                i
            );
        }

        // Existing first flat becomes the fallback
        const fallbackPath =
            partPaths.flats[0].path;

        previews.push({
            thumbnail: thumbnailPath,
            fallback: fallbackPath
        });
    }

    return previews;
}

function getBackgroundPaths() {

    const paths = [];

    for (let i = 1; i <= backgroundCount; i++) {
        paths.push(
            `assets/character/Background/Background${i}.png`
        );
    }

    return paths;
}

/* =========================================================
   6. IMAGE / RENDERING UTILITIES
========================================================= */

function colorFlat(image, color) {

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    const tempCtx = tempCanvas.getContext("2d");

    // Draw the original flat to establish its shape
    tempCtx.drawImage(image, 0, 0);

    // Only draw the new color where the flat already exists
    tempCtx.globalCompositeOperation = "source-in";

    tempCtx.fillStyle = color;

    tempCtx.fillRect(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );

    // Restore normal drawing behavior
    tempCtx.globalCompositeOperation = "source-over";

    return tempCanvas;
}

async function drawCharacter() {

    const thisRender = ++renderVersion;

    try {

        // Load background
        const backgroundPath =
            `assets/character/Background/Background${selectedBackground + 1}.png`;

        const backgroundImage =
            await loadImage(backgroundPath);


        // Load all character layers
        const loadedLayers = [];

        for (const layer of layerOrder) {

            const partName = layer.part;
            const splitLayer = layer.splitLayer ?? null;

            const paths = getPartPaths(
                partName,
                selectedParts[partName],
                splitLayer
            );

            const loadedLayer = {
                partName: partName,
                splitLayer: splitLayer,
                flats: [],
                lines: await loadImage(paths.lines)
            };

            for (const flat of paths.flats) {

                loadedLayer.flats.push({
                    number: flat.number,
                    image: await loadImage(flat.path)
                });
            }

            loadedLayers.push(loadedLayer);
        }


        // Stop if a newer render started while loading
        if (thisRender !== renderVersion) {
            return;
        }


        // Clear canvas
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // Draw background first
        ctx.drawImage(backgroundImage, 0, 0);


        // Draw character layers from back to front
        for (const layer of loadedLayers) {

            const partName = layer.partName;

            // Lowest-numbered flat is drawn first.
            // Higher flat numbers therefore appear on top.
            const sortedFlats =
                [...layer.flats].sort(
                    (a, b) => a.number - b.number
                );

            for (const flat of sortedFlats) {

                // Flats1 is always visible.
                // Other flats respect their individual toggle.
                if (
                    flat.number !== 1 &&
                    !flatVisibility[partName][flat.number]
                ) {
                    continue;
                }

                const coloredFlat =
                    colorFlat(
                        flat.image,
                        selectedColors[flat.number]
                    );

                ctx.drawImage(coloredFlat, 0, 0);
            }

            // Linework goes above all flats for this layer
            ctx.drawImage(layer.lines, 0, 0);
        }

    } catch (error) {

        console.error(
            "Could not draw character:",
            error
        );
    }
}

/* =========================================================
   7. UI UPDATE FUNCTIONS
========================================================= */

function updatePartLabel(partName) {

    const headingId =
        partLabelElements[partName];

    const heading =
        document.getElementById(headingId);

    if (!heading) {
        return;
    }

    const selectionName =
        heading.querySelector(".part-selection-name");

    if (!selectionName) {
        return;
    }

    const part =
        characterParts[partName];

    const fileNumber =
        selectedParts[partName] + 1;

    const lookupKey =
        `${part.name}${fileNumber}`;

    const customName =
        partNames[lookupKey];

    if (customName) {
        selectionName.textContent = customName;
    } else {
        selectionName.textContent = "";
    }
}

function updateAllPartLabels() {

    for (const partName of Object.keys(characterParts)) {
        updatePartLabel(partName);
    }
}

function updateSelectedButtons(containerId, selectedIndex) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Option container not found: ${containerId}`);
        return;
    }

    const buttons =
        container.querySelectorAll(".option-button");

    buttons.forEach((button, index) => {

        if (index === selectedIndex) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
}

function updateAllSelectedButtons() {

    updateSelectedButtons(
        "backgroundOptions",
        selectedBackground
    );

    for (const partName of Object.keys(characterParts)) {

        updateSelectedButtons(
            optionContainers[partName],
            selectedParts[partName]
        );
    }
}

function updateFlatToggleCheckboxes() {

    for (const partName of Object.keys(characterParts)) {

        const container =
            document.getElementById(
                flatToggleContainers[partName]
            );

        if (!container) {
            continue;
        }

        const checkboxes =
            container.querySelectorAll(
                'input[type="checkbox"]'
            );

        checkboxes.forEach(checkbox => {

            const flatNumber =
                Number(checkbox.dataset.flatNumber);

            checkbox.checked =
                flatVisibility[partName][flatNumber];
        });
    }
}

/* =========================================================
   8. UI CREATION FUNCTIONS
========================================================= */


function createOptionMenu(
    containerId,
    options,
    selectFunction,
    getSelectedIndex
) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Option container not found: ${containerId}`);
        return;
    }

    options.forEach((option, index) => {

        const button = document.createElement("button");
        button.classList.add("option-button");

        const image = document.createElement("img");

        // Character-part options have a custom thumbnail
        // plus a fallback image.
        if (
            typeof option === "object" &&
            option.thumbnail
        ) {

            image.src = option.thumbnail;

            // If the thumbnail doesn't exist,
            // fall back to the original flat preview.
            image.onerror = () => {

                // Prevent an infinite error loop if
                // the fallback is also missing.
                image.onerror = null;

                image.src = option.fallback;
            };

        } else {

            // Background options are still normal image paths.
            image.src = option;
        }

        button.appendChild(image);

        button.addEventListener("click", () => {

            selectFunction(index);

            updateSelectedButtons(
                containerId,
                getSelectedIndex()
            );
        });

        container.appendChild(button);
    });

    // Highlight the initially selected option
    updateSelectedButtons(
        containerId,
        getSelectedIndex()
    );
}

function createFlatToggles(partName) {

    const containerId =
        flatToggleContainers[partName];

    const container =
        document.getElementById(containerId);

    if (!container) {
        console.error(
            `Flat toggle container not found: ${containerId}`
        );
        return;
    }

    const part =
        characterParts[partName];


    for (const flatNumber of part.flats) {

        // Flats1 is always visible,
        // so don't create a toggle for it.
        if (flatNumber === 1) {
            continue;
        }


        const label =
            document.createElement("label");

        label.classList.add("flat-toggle");


        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.dataset.flatNumber = flatNumber;

        checkbox.addEventListener("change", () => {

            flatVisibility[partName][flatNumber] =
                checkbox.checked;

            drawCharacter();
        });


        const text =
            document.createElement("span");

        text.textContent =
            flatLabels[flatNumber] ??
            `Flats ${flatNumber}`;


        label.appendChild(checkbox);
        label.appendChild(text);

        container.appendChild(label);

    }
}


/* =========================================================
   9. CHARACTER ACTIONS
========================================================= */

function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0");
}

function randomizeCharacter() {

    selectedBackground =
        Math.floor(Math.random() * backgroundCount);

    // Randomize all character parts
    for (const partName of Object.keys(characterParts)) {

        selectedParts[partName] =
            Math.floor(
                Math.random() *
                characterParts[partName].count
            );
    }

    // Randomize every color channel
    for (const flatNumber of Object.keys(selectedColors)) {

        selectedColors[flatNumber] =
            randomColor();

        if (colorPickers[flatNumber]) {
            colorPickers[flatNumber].value =
                selectedColors[flatNumber];
        }
    }

    updateAllSelectedButtons();
    updateAllPartLabels();
    drawCharacter();
}

function clearCharacter() {

    // Reset all selected character parts
    for (const partName of Object.keys(selectedParts)) {
        selectedParts[partName] = 0;
    }

    // Reset background
    selectedBackground = 0;

    // Reset all colors
    for (const flatNumber of Object.keys(defaultColors)) {

        selectedColors[flatNumber] =
            defaultColors[flatNumber];

        if (colorPickers[flatNumber]) {
            colorPickers[flatNumber].value =
                selectedColors[flatNumber];
        }
    }

    for (const partName of Object.keys(flatVisibility)) {

        for (const flatNumber of Object.keys(
            flatVisibility[partName]
        )) {

            flatVisibility[partName][flatNumber] = true;
        }
    }

    updateAllSelectedButtons();
    updateAllPartLabels();
    updateFlatToggleCheckboxes();
    drawCharacter();
}

/* =========================================================
   10. INITIALIZATION / SETUP
========================================================= */

function initializeFlatVisibility() {

    for (const partName of Object.keys(characterParts)) {

        flatVisibility[partName] = {};

        for (const flatNumber of characterParts[partName].flats) {
            flatVisibility[partName][flatNumber] = true;
        }
    }
}


function initializeOptionMenus() {

    for (const partName of Object.keys(characterParts)) {

        createOptionMenu(
            optionContainers[partName],
            getPreviewPaths(partName),

            index => {
                selectedParts[partName] = index;

                updatePartLabel(partName);
                drawCharacter();
            },

            () => selectedParts[partName]
        );
    }

    createOptionMenu(
        "backgroundOptions",
        getBackgroundPaths(),

        index => {
            selectedBackground = index;
            drawCharacter();
        },

        () => selectedBackground
    );
}


function initializeColorPickers() {

    for (const flatNumber of Object.keys(defaultColors)) {

        if (colorPickers[flatNumber]) {
            colorPickers[flatNumber].value =
                defaultColors[flatNumber];
        }
    }

    for (const flatNumber of Object.keys(colorPickers)) {

        const picker = colorPickers[flatNumber];

        if (!picker) {
            console.error(
                `Color picker not found for flat ${flatNumber}`
            );

            continue;
        }

        picker.addEventListener("input", () => {

            selectedColors[flatNumber] = picker.value;

            drawCharacter();
        });
    }
}


function initializeFlatToggles() {

    for (const partName of Object.keys(characterParts)) {
        createFlatToggles(partName);
    }
}


function initializeEventListeners() {

    document
        .getElementById("randomizeButton")
        .addEventListener("click", randomizeCharacter);

    document
        .getElementById("clearButton")
        .addEventListener("click", clearCharacter);
}

async function initializeCharacterCreator() {

    initializeFlatVisibility();
    initializeOptionMenus();
    initializeColorPickers();
    initializeFlatToggles();
    initializeEventListeners();

    await loadPartNames();

    updateAllPartLabels();

    drawCharacter();
}


/* =========================================================
   11. START APPLICATION
========================================================= */


initializeCharacterCreator();





