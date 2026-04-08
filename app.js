// ── CONFIG ───────────────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS = 5;

// ── STATE ────────────────────────────────────────────────────────────────────
let mediaStream = null;
let scanning = false;

// ── ELEMENTS ──────────────────────────────────────────────────────────────────
const fab      = document.getElementById("fab");
const fabIcon  = document.getElementById("fab-icon");
const spinner  = document.getElementById("spinner");
const fabCount = document.getElementById("fab-count");
const panel    = document.getElementById("panel");
const badge    = document.getElementById("panel-badge");
const verdict  = document.getElementById("panel-verdict");
const reason   = document.getElementById("panel-reason");
const thumb    = document.getElementById("panel-thumb");
const closeBtn = document.getElementById("close-btn");
const toast    = document.getElementById("toast");

// ── FAB CLICK ─────────────────────────────────────────────────────────────────
fab.addEventListener("click", async () => {
  if (scanning) return;
  scanning = true;

  hidePanel();
  setFabState("countdown");

  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false,
    });
  } catch (err) {
    showToast("Screen share cancelled.");
    resetFab();
    return;
  }

  let count = COUNTDOWN_SECONDS;
  fabCount.textContent = count;

  const interval = setInterval(async () => {
    count--;
    if (count > 0) {
      fabCount.textContent = count;
      return;
    }

    clearInterval(interval);
    setFabState("scanning");

    try {
      const dataUrl = await captureFrame(mediaStream);
      stopStream(mediaStream);
      const result = await analyzeWithServer(dataUrl);
      showResult(result, dataUrl);
    } catch (err) {
      console.error(err);
      showToast("Analysis failed. Check console.");
      setFabState("error");
      setTimeout(resetFab, 2000);
    }
  }, 1000);
});

closeBtn.addEventListener("click", hidePanel);

// ── CAPTURE ───────────────────────────────────────────────────────────────────
function captureFrame(stream) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      const canvas = document.createElement("canvas");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    video.onerror = reject;
  });
}

function stopStream(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

// ── API CALL (via server — key never exposed) ─────────────────────────────────
async function analyzeWithServer(dataUrl) {
  const base64 = dataUrl.split(",")[1];

  const response = await fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64 }),
  });

  if (!response.ok) throw new Error("Server error: " + response.status);
  return await response.json();
}

// ── UI ────────────────────────────────────────────────────────────────────────
function showResult({ verdict: v, confidence, reason: r }, dataUrl) {
  const isPhishing = v?.toLowerCase() === "phishing";

  badge.textContent = isPhishing ? "⚠ Phishing" : "✓ Legitimate";
  badge.className   = `badge ${isPhishing ? "phishing" : "legitimate"}`;

  verdict.textContent = isPhishing
    ? "This page looks dangerous"
    : "This page looks safe";
  verdict.className = `verdict ${isPhishing ? "phishing" : "legitimate"}`;

  reason.textContent = (r || "No explanation returned.") +
    (confidence ? ` (${confidence} confidence)` : "");

  thumb.src = dataUrl;
  thumb.classList.remove("hidden");
  panel.classList.remove("hidden");
  resetFab();
}

function hidePanel() {
  panel.classList.add("hidden");
  thumb.classList.add("hidden");
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ── FAB STATES ────────────────────────────────────────────────────────────────
function setFabState(state) {
  fab.className = "";
  fabIcon.classList.add("hidden");
  spinner.classList.add("hidden");
  fabCount.classList.add("hidden");

  if (state === "countdown") {
    fab.classList.add("scanning");
    fabCount.classList.remove("hidden");
  } else if (state === "scanning") {
    fab.classList.add("scanning");
    spinner.classList.remove("hidden");
  } else if (state === "error") {
    fab.classList.add("error");
    fabIcon.classList.remove("hidden");
  }
}

function resetFab() {
  scanning = false;
  fab.className = "";
  fabIcon.classList.remove("hidden");
  spinner.classList.add("hidden");
  fabCount.classList.add("hidden");
}