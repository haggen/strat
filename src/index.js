import "resetize";
import "./style.css";

const clientId = Date.now();

const state = {
  ui: {
    grabIsLocked: true,
    isDrawing: false,
    isGrabbing: false,
    lastMousePosition: [0, 0]
  },
  background: {
    image: new Image(),
    x: 0,
    y: 0
  },
  viewPort: {
    scale: 1,
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
  },
  clients: {
    [clientId]: {
      id: clientId,
      color: "black",
      width: 1,
      strokes: []
    }
  }
};

state.background.image.onload = function(e) {
  state.background.x = (state.viewPort.width - this.width) * 0.5;
  state.background.y = (state.viewPort.height - this.height) * 0.5;
};

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

function update() {
  canvas.width = state.viewPort.width;
  canvas.height = state.viewPort.height;

  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(state.viewPort.scale, state.viewPort.scale);
  ctx.translate(state.viewPort.x, state.viewPort.y);

  if (state.background.image) {
    ctx.drawImage(
      state.background.image,
      state.background.x,
      state.background.y
    );
  }

  for (let id in state.clients) {
    const client = state.clients[id];

    for (let i = 0; i < client.strokes.length; i++) {
      const stroke = client.strokes[i];
      if (stroke.length < 6) continue;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = client.width;
      ctx.strokeStyle = client.color;
      ctx.shadowBlur = client.width * 2;
      ctx.shadowColor = client.color;
      ctx.beginPath();
      ctx.moveTo(...stroke.slice(0, 2));
      for (let j = 2; j < stroke.length - 2; j += 2) {
        ctx.quadraticCurveTo(
          ...stroke.slice(j, j + 2),
          ...stroke.slice(j + 2, j + 4)
        );
      }
      ctx.lineTo(...stroke.slice(-2));
      ctx.stroke();
    }
  }

  if (state.ui.isGrabbing) {
    canvas.style.cursor = "-webkit-grabbing";
  } else if (state.ui.grabIsLocked) {
    canvas.style.cursor = "default";
  } else {
    canvas.style.cursor = "-webkit-grab";
  }

  requestAnimationFrame(update);
}
update();

// -
// -
// -

canvas.addEventListener("mousedown", e => {
  if (state.ui.grabIsLocked) {
    state.clients[clientId].strokes.push([]);
    state.ui.isDrawing = true;
  } else {
    state.ui.isGrabbing = true;
  }
  state.ui.lastMousePosition = [e.clientX, e.clientY];
});

canvas.addEventListener("mouseup", e => {
  state.ui.isGrabbing = false;
  state.ui.isDrawing = false;
});

canvas.addEventListener("mousemove", e => {
  if (state.ui.isGrabbing) {
    state.viewPort.x +=
      (e.clientX - state.ui.lastMousePosition[0]) / state.viewPort.scale;
    state.viewPort.y +=
      (e.clientY - state.ui.lastMousePosition[1]) / state.viewPort.scale;
  } else if (state.ui.isDrawing) {
    const strokes = state.clients[clientId].strokes;
    strokes[strokes.length - 1].push(
      e.clientX / state.viewPort.scale - state.viewPort.x,
      e.clientY / state.viewPort.scale - state.viewPort.y
    );
  }
  state.ui.lastMousePosition = [e.clientX, e.clientY];
});

canvas.addEventListener("mousewheel", e => {
  const previousScale = state.viewPort.scale;

  if (e.wheelDeltaY > 0) {
    state.viewPort.scale += state.viewPort.scale * 0.1;
  } else if (e.wheelDeltaY < 0) {
    state.viewPort.scale -= state.viewPort.scale * 0.1;
  }

  state.viewPort.x +=
    (state.viewPort.width / state.viewPort.scale -
      state.viewPort.width / previousScale) *
    (state.ui.lastMousePosition[0] / state.viewPort.width);

  state.viewPort.y +=
    (state.viewPort.height / state.viewPort.scale -
      state.viewPort.height / previousScale) *
    (state.ui.lastMousePosition[1] / state.viewPort.height);

  e.preventDefault();
});

window.addEventListener("keydown", e => {
  if (e.code === "Space") state.ui.grabIsLocked = false;
});

window.addEventListener("keyup", e => {
  state.ui.grabIsLocked = true;
});

window.addEventListener("resize", e => {
  state.viewPort.width = window.innerWidth;
  state.viewPort.height = window.innerHeight;
});

window.addEventListener("dragenter", e => {
  e.preventDefault();
});

window.addEventListener("dragover", e => {
  e.preventDefault();
});

window.addEventListener("drop", e => {
  e.preventDefault();
  let reader = new FileReader();
  reader.readAsDataURL(e.dataTransfer.files[0]);
  reader.onloadend = e => {
    state.background.image.src = reader.result;
  };
});

window.addEventListener("paste", e => {
  const text = e.clipboardData.getData("text");
  try {
    const url = new URL(text);
    state.background.image.src = text;
  } catch {}
});

const toolbar = document.createElement("div");
toolbar.classList.add("toolbar");
document.body.appendChild(toolbar);
const widthSlider = document.createElement("input");
widthSlider.type = "range";
widthSlider.value = state.clients[clientId].width;
widthSlider.min = 1;
widthSlider.max = 4;
widthSlider.step = 1;
widthSlider.addEventListener("change", e => {
  state.clients[clientId].width = widthSlider.value;
});
toolbar.appendChild(widthSlider);
const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.addEventListener("input", e => {
  state.clients[clientId].color = colorPicker.value;
});
toolbar.appendChild(colorPicker);
const resetButton = document.createElement("button");
resetButton.textContent = "Reset";
toolbar.appendChild(resetButton);
resetButton.addEventListener("click", e => {
  state.clients[clientId].strokes = [];
  state.viewPort.scale = 1;
  state.viewPort.x = 0;
  state.viewPort.y = 0;
});

state.background.image.src =
  "https://aishouzuo.org/wp-content/uploads/2018/08/shoreline-map-comprehensive-guide-player-resources-united-we-image-2629x1640.png";

var socket = new WebSocket("wss://ws.crz.li/strat/1234");
socket.onopen = e => {
  setInterval(() => socket.send(JSON.stringify(state.clients[clientId])), 1000);
};
socket.onmessage = e => {
  if (e.type !== "message") return;
  const data = JSON.parse(e.data);
  state.clients[data.id] = data;
};
