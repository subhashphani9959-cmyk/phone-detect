/* RoadFocus: all inference happens locally in the browser using COCO-SSD. */
const video = document.querySelector('#webcam');
const canvas = document.querySelector('#overlay');
const ctx = canvas.getContext('2d');
const el = id => document.getElementById(id);
let model, stream, running = false, soundOn = true, warning = false;
let alertCount = 0, lastAlert = 0, startedAt = 0, timer, lastFrame = performance.now(), frames = 0;

async function loadModel() {
  try {
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    el('modelStatus').textContent = 'Vision model ready';
    document.querySelector('.model-dot').classList.add('ready');
    el('startButton').disabled = false;
  } catch (error) {
    el('modelStatus').textContent = 'Model could not load — check connection';
    console.error(error);
  }
}

async function startCamera() {
  if (!model) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    running = true; startedAt = Date.now();
    el('emptyState').hidden = true; el('startButton').disabled = true; el('stopButton').disabled = false;
    el('systemDot').classList.add('active'); el('systemLabel').textContent = 'Monitoring active';
    document.querySelector('.live-label i').classList.add('active');
    timer = setInterval(updateTime, 1000);
    detect();
  } catch (error) {
    el('riskTitle').textContent = 'Camera unavailable';
    el('riskText').textContent = 'Allow camera permission, then try again.';
    console.error(error);
  }
}

function stopCamera() {
  running = false; clearInterval(timer); stream?.getTracks().forEach(track => track.stop()); stream = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height); setWarning(false, 0);
  el('emptyState').hidden = false; el('startButton').disabled = !model; el('stopButton').disabled = true;
  el('systemDot').classList.remove('active'); el('systemLabel').textContent = 'System standby';
  document.querySelector('.live-label i').classList.remove('active'); el('fps').textContent = '-- FPS';
  el('riskTitle').textContent = 'Ready to monitor'; el('riskText').textContent = 'Turn on your camera to start the safety check.';
}

async function detect() {
  if (!running) return;
  if (video.readyState >= 2) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const predictions = await model.detect(video, 6, 0.35);
    const phone = predictions.filter(item => item.class === 'cell phone').sort((a,b) => b.score-a.score)[0];
    draw(predictions, phone);
    setWarning(Boolean(phone && phone.score >= .50), phone?.score || 0);
    frames++; const now = performance.now();
    if (now - lastFrame > 1000) { el('fps').textContent = `${frames} FPS`; frames = 0; lastFrame = now; }
  }
  requestAnimationFrame(detect);
}

function draw(predictions, phone) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!phone || phone.score < .35) return;
  const [x,y,w,h] = phone.bbox;
  ctx.save(); ctx.scale(-1,1); // match the mirrored video
  const mx = -x-w;
  ctx.strokeStyle = phone.score >= .5 ? '#e84c38' : '#c6ee52'; ctx.lineWidth = 4;
  ctx.strokeRect(mx,y,w,h); ctx.fillStyle = ctx.strokeStyle;
  ctx.font = '600 16px Manrope, sans-serif'; const label = `PHONE  ${Math.round(phone.score*100)}%`;
  ctx.fillRect(mx, Math.max(0,y-28), ctx.measureText(label).width+16, 28);
  ctx.fillStyle = '#fff'; ctx.fillText(label,mx+8,Math.max(19,y-9)); ctx.restore();
}

function setWarning(isWarning, score) {
  const pct = Math.round(score * 100);
  el('confidenceValue').textContent = score ? `${pct}%` : '—'; el('confidenceBar').style.width = `${pct}%`;
  if (isWarning === warning) return;
  warning = isWarning;
  el('warningBanner').classList.toggle('show', warning); el('riskCard').classList.toggle('warning', warning);
  if (warning) {
    el('riskIcon').textContent = '!'; el('riskTitle').textContent = 'Distraction detected'; el('riskText').textContent = 'A mobile phone is visible. Please put it away.';
    if (Date.now() - lastAlert > 2500) { alertCount++; lastAlert = Date.now(); el('alertCount').textContent = String(alertCount).padStart(2,'0'); if (soundOn) beep(); }
  } else if (running) {
    el('riskIcon').textContent = '✓'; el('riskTitle').textContent = 'Focused driving'; el('riskText').textContent = 'No phone detected in the current view.';
  }
}

function beep() { const audio = new AudioContext(); const oscillator = audio.createOscillator(); const gain = audio.createGain(); oscillator.frequency.value = 740; gain.gain.setValueAtTime(.07,audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25); oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime+.25); }
function updateTime() { const seconds = Math.floor((Date.now()-startedAt)/1000); el('sessionTime').textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
el('startButton').addEventListener('click', startCamera); el('stopButton').addEventListener('click', stopCamera);
el('soundButton').addEventListener('click', () => { soundOn = !soundOn; el('soundButton').classList.toggle('off',!soundOn); el('soundButton').setAttribute('aria-pressed',soundOn); el('soundButton').querySelector('span').textContent = soundOn ? 'Sound on' : 'Sound off'; });
el('startButton').disabled = true; loadModel();
