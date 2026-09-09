// Get the canvas and its drawing context
const canvas = document.getElementById("characterCanvas");
const ctx = canvas.getContext("2d");

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
        count: 2,
        flats: [1, 2, 7]
    },

    hands: {
        folder: "Hands",
        name: "Hands",
        count: 2,
        flats: [1, 3, 4, 7]
    },

    head: {
        folder: "Head",
        name: "Head",
        count: 2,
        flats: [1, 2, 5, 7]
    },

    eyes: {
        folder: "Eyes",
        name: "Eyes",
        count: 2,
        flats: [6]
    },

    horns: {
        folder: "Horns",
        name: "Horns",
        count: 2,
        flats: [1, 5, 8]
    }
};

// Current character selections
let selectedBackground = 0;
const selectedParts = {
    tail: 0,
    feet: 0,
    body: 0,
    hands: 0,
    head: 0,
    eyes: 0,
    horns: 0
};

const flatVisibility = {};

for (const partName of Object.keys(characterParts)) {

    flatVisibility[partName] = {};

    for (const flatNumber of characterParts[partName].flats) {
        flatVisibility[partName][flatNumber] = true;
    }
}


function getPartPaths(partName, index) {

    const part = characterParts[partName];

    // Files start at 1; JavaScript selections start at 0
    const fileNumber = index + 1;

    const basePath =
        `assets/character/${part.folder}/${part.name}${fileNumber}`;

    return {
        flats: part.flats.map(flatNumber => ({
            number: flatNumber,
            path: `${basePath}_Flats${flatNumber}.png`
        })),

        lines: `${basePath}_Lines.png`
    };
}


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


// Current colors
const defaultColors = {
    1: "#b83b35",  // Body Primary
    2: "#8f2f2a",  // Body Secondary
    3: "#8f2f2a",  // Hands/Feet Secondary
    4: "#f2e2c4",  // Claws
    5: "#6b4a32",  // Horns
    6: "#ffffff",    // Eyes
    7: "#6b4a32",  // Scales
    8: "#000000"  // Plates
};

const selectedColors = {
    ...defaultColors
};

const layerOrder = [
    "tail",
    "feet",
    "body",
    "hands",
    "head",
    "eyes",
    "horns"
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
    9: "Ears",
    10: "Wings",
    11: "Spine"
};

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

let renderVersion = 0;

async function drawCharacter() {

    const thisRender = ++renderVersion;

    try {

        // Load background
        const backgroundPath =
            `assets/character/Background/Background${selectedBackground + 1}.png`;

        const backgroundImage =
            await loadImage(backgroundPath);


        // Load all character layers
        const loadedParts = {};

        for (const partName of layerOrder) {

            const paths = getPartPaths(
                partName,
                selectedParts[partName]
            );

            loadedParts[partName] = {
                flats: [],
                lines: await loadImage(paths.lines)
            };

            // Load every flat belonging to this part
            for (const flat of paths.flats) {

                loadedParts[partName].flats.push({
                    number: flat.number,
                    image: await loadImage(flat.path)
                });
            }
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


        // Draw character parts from back to front
        for (const partName of layerOrder) {

            const part = loadedParts[partName];

            // Draw flats from lowest number to highest number
            const sortedFlats =
                [...part.flats].sort(
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

            // Lines always remain visible
            ctx.drawImage(part.lines, 0, 0);
        }

    } catch (error) {

        console.error(
            "Could not draw character:",
            error
        );
    }
}


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

    options.forEach((imagePath, index) => {

        const button = document.createElement("button");
        button.classList.add("option-button");

        const image = document.createElement("img");
        image.src = imagePath;

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

function getPreviewPaths(partName) {

    const part = characterParts[partName];
    const paths = [];

    for (let i = 0; i < part.count; i++) {

        const partPaths =
            getPartPaths(partName, i);

        paths.push(
            partPaths.flats[0].path
        );
    }

    return paths;
}

const optionContainers = {
    tail: "tailOptions",
    feet: "feetOptions",
    body: "bodyOptions",
    hands: "handsOptions",
    head: "headOptions",
    eyes: "eyesOptions",
    horns: "hornOptions"
};

const flatToggleContainers = {
    tail: "tailFlatToggles",
    feet: "feetFlatToggles",
    body: "bodyFlatToggles",
    hands: "handsFlatToggles",
    head: "headFlatToggles",
    eyes: "eyesFlatToggles",
    horns: "hornFlatToggles"
};

for (const partName of Object.keys(characterParts)) {

    createOptionMenu(
        optionContainers[partName],
        getPreviewPaths(partName),

        index => {
            selectedParts[partName] = index;
            drawCharacter();
        },

        () => selectedParts[partName]
    );
}

const backgroundCount = 3;

function getBackgroundPaths() {

    const paths = [];

    for (let i = 1; i <= backgroundCount; i++) {
        paths.push(
            `assets/character/Background/Background${i}.png`
        );
    }

    return paths;
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

const colorPickers = {
    1: document.getElementById("primaryColor"),
    2: document.getElementById("secondaryColor"),
    3: document.getElementById("limbSecondaryColor"),
    4: document.getElementById("clawColor"),
    5: document.getElementById("hornColor"),
    6: document.getElementById("eyeColor"),
    7: document.getElementById("scaleColor"),
    8: document.getElementById("plateColor")
};

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

drawCharacter();

function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0");
}

document
    .getElementById("randomizeButton")
    .addEventListener("click", randomizeCharacter);


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
    drawCharacter();
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

document
    .getElementById("clearButton")
    .addEventListener("click", clearCharacter);


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
    updateFlatToggleCheckboxes();
    drawCharacter();
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

for (const partName of Object.keys(characterParts)) {
    createFlatToggles(partName);
}

