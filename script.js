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


// Load an image
function loadImage(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load " + path));

        image.src = path;
    });
}


// Draw the character
async function drawCharacter() {

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load all four layers
    const backgroundImage = await loadImage(backgrounds[selectedBackground]);
    const bodyImage = await loadImage(bodies[selectedBody]);
    const faceImage = await loadImage(faces[selectedFace]);
    const hornsImage = await loadImage(horns[selectedHorns]);

    // Draw in order from back to front
    ctx.drawImage(backgroundImage, 0, 0);
    ctx.drawImage(bodyImage, 0, 0);
    ctx.drawImage(faceImage, 0, 0);
    ctx.drawImage(hornsImage, 0, 0);
}


// Draw the initial character
drawCharacter();

function changeBackground(direction) {
    selectedBackground += direction;

    if (selectedBackground < 0) {
        selectedBackground = backgrounds.length - 1;
    }

    if (selectedBackground >= backgrounds.length) {
        selectedBackground = 0;
    }

    drawCharacter();
}


function changeBody(direction) {
    selectedBody += direction;

    if (selectedBody < 0) {
        selectedBody = bodies.length - 1;
    }

    if (selectedBody >= bodies.length) {
        selectedBody = 0;
    }

    drawCharacter();
}


function changeFace(direction) {
    selectedFace += direction;

    if (selectedFace < 0) {
        selectedFace = faces.length - 1;
    }

    if (selectedFace >= faces.length) {
        selectedFace = 0;
    }

    drawCharacter();
}


function changeHorns(direction) {
    selectedHorns += direction;

    if (selectedHorns < 0) {
        selectedHorns = horns.length - 1;
    }

    if (selectedHorns >= horns.length) {
        selectedHorns = 0;
    }

    drawCharacter();
}