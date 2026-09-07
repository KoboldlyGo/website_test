// Get the canvas and its drawing context
const canvas = document.getElementById("characterCanvas");
const ctx = canvas.getContext("2d");

// Available character options
const backgrounds = [
    "assets/character/backgrounds/Blank.png",
    "assets/character/backgrounds/Background_1.png",
    "assets/character/backgrounds/Background_2.png"
];

const bodies = [
    "assets/character/bodies/Body_1.png",
    "assets/character/bodies/Body_2.png",
    "assets/character/bodies/Body_3.png"
];

const faces = [
    "assets/character/faces/Face_1.png",
    "assets/character/faces/Face_2.png"
];

const horns = [
    "assets/character/horns/Horns_1.png",
    "assets/character/horns/Horns_2.png"
];


// Current character selections
let selectedBackground = 0;
let selectedBody = 0;
let selectedFace = 0;
let selectedHorns = 0;

// Current colors
let selectedBodyColor = "#b83b35";
let selectedHornColor = "#b83b35";

// Load an image
function loadImage(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load " + path));

        image.src = path;
    });
}


async function drawCharacter() {

    try {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const backgroundImage =
            await loadImage(backgrounds[selectedBackground]);

        const bodyImage =
            await loadImage(bodies[selectedBody]);

        const faceImage =
            await loadImage(faces[selectedFace]);

        const hornsImage =
            await loadImage(horns[selectedHorns]);

        const coloredBody =
            recolorImage(bodyImage, selectedBodyColor);

        const coloredHorns =
            recolorImage(hornsImage, selectedHornColor);

        ctx.drawImage(backgroundImage, 0, 0);
        ctx.drawImage(coloredBody, 0, 0);
        ctx.drawImage(faceImage, 0, 0);
        ctx.drawImage(coloredHorns, 0, 0);

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
    const buttons = container.querySelectorAll(".option-button");

    buttons.forEach((button, index) => {

        if (index === selectedIndex) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }

    });
}

function selectBackground(index) {
    selectedBackground = index;
    drawCharacter();
}

function selectBody(index) {
    selectedBody = index;
    drawCharacter();
}

function selectFace(index) {
    selectedFace = index;
    drawCharacter();
}

function selectHorns(index) {
    selectedHorns = index;
    drawCharacter();
}

createOptionMenu(
    "backgroundOptions",
    backgrounds,
    selectBackground,
    () => selectedBackground
);

createOptionMenu(
    "bodyOptions",
    bodies,
    selectBody,
    () => selectedBody
);

createOptionMenu(
    "faceOptions",
    faces,
    selectFace,
    () => selectedFace
);

createOptionMenu(
    "hornOptions",
    horns,
    selectHorns,
    () => selectedHorns
);

const bodyColorPicker = document.getElementById("bodyColor");
const hornColorPicker = document.getElementById("hornColor");

bodyColorPicker.addEventListener("input", () => {
    selectedBodyColor = bodyColorPicker.value;
    drawCharacter();
});

hornColorPicker.addEventListener("input", () => {
    selectedHornColor = hornColorPicker.value;
    drawCharacter();
});

drawCharacter();

document
    .getElementById("randomizeButton")
    .addEventListener("click", randomizeCharacter);


function randomizeCharacter() {

    selectedBackground =
        Math.floor(Math.random() * backgrounds.length);

    selectedBody =
        Math.floor(Math.random() * bodies.length);

    selectedFace =
        Math.floor(Math.random() * faces.length);

    selectedHorns =
        Math.floor(Math.random() * horns.length);

    updateAllSelectedButtons();

    drawCharacter();
}

function updateAllSelectedButtons() {

    updateSelectedButtons(
        "backgroundOptions",
        selectedBackground
    );

    updateSelectedButtons(
        "bodyOptions",
        selectedBody
    );

    updateSelectedButtons(
        "faceOptions",
        selectedFace
    );

    updateSelectedButtons(
        "hornOptions",
        selectedHorns
    );
}

document
    .getElementById("clearButton")
    .addEventListener("click", clearCharacter);

function clearCharacter() {

    selectedBackground = 0;
    selectedBody = 0;
    selectedFace = 0;
    selectedHorns = 0;

    selectedBodyColor = "#b83b35";
    selectedHornColor = "#b83b35";

    bodyColorPicker.value = selectedBodyColor;
    hornColorPicker.value = selectedHornColor;

    updateAllSelectedButtons();
    drawCharacter();
}

function recolorImage(image, newColor) {

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    const tempCtx = tempCanvas.getContext("2d");

    tempCtx.drawImage(image, 0, 0);

    const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );

    const data = imageData.data;

    // Convert hex color to RGB
    const rNew = parseInt(newColor.substring(1, 3), 16);
    const gNew = parseInt(newColor.substring(3, 5), 16);
    const bNew = parseInt(newColor.substring(5, 7), 16);

    for (let i = 0; i < data.length; i += 4) {

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Ignore transparent pixels
        if (a === 0) {
            continue;
        }

        // Detect red-ish pixels
        if (
            r > 100 &&
            r > g * 1.5 &&
            r > b * 1.5
        ) {
            data[i] = rNew;
            data[i + 1] = gNew;
            data[i + 2] = bNew;
        }
    }

    tempCtx.putImageData(imageData, 0, 0);

    return tempCanvas;
}

