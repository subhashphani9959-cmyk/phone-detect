# RoadFocus — Driver Distraction Detection

A software-only college demonstration: it uses a laptop webcam and a lightweight COCO-SSD model in the browser to detect a visible cell phone. No hardware, cloud backend, API key, or captured-video upload is required.

## Run it

Open the folder with a simple local web server (for example, VS Code Live Server), then open `http://localhost` in Chrome or Edge. Camera access works only on `localhost` or HTTPS — it will not work by double-clicking `index.html`.

Click **Start monitoring** and approve the browser camera prompt. When the model finds a `cell phone` with at least 50% confidence, the screen shows a red alert, draws a labelled box around the phone, increments the session alert count, and plays an optional short tone.

## Demonstration notes

- The detector is `COCO-SSD` with its lighter MobileNet V2 base, loaded from a public CDN on first use.
- Processing happens in the visitor's browser. The video stream is not sent to a server or saved.
- This is an educational risk indicator, not a safety-certified driving system. Good lighting and showing the phone clearly to the camera improve results.
