# NeuroNav

Spatial Adaptation Study 001 — an AI Accelerator research prototype.

NeuroNav explores how a learned target location affects visual search after the target moves. The current implementation combines an eight-trial spacecraft-panel task with webcam gaze estimation. The current UI requires camera calibration and a quality check before entering the experiment.

**Status:** local functional prototype; webcam integration has not yet been validated with a live participant. This is not a diagnostic tool. No saccade or fixation detector is currently integrated.

## Study flow

1. Read instructions and explicitly consent to camera use.
2. Enable the camera and position the face in its guide.
3. Calibrate at nine screen positions, clicking each point five times while looking at it.
4. Complete a separate five-point validation without clicking. Validation does not train the model.
5. Complete eight searches for **O₂ WARNING**.
6. Review click results and exploratory gaze summaries; download data.

| Trials | Environment | Target location |
| --- | --- | --- |
| 1–5 | A / Original | Upper-right |
| 6–8 | B / Changed | Lower-left |

The same deterministic 1200 × 680 control panel is rendered in both states; only the target indicator moves. The change is not announced during trials. Incorrect clicks are recorded without ending the trial. A successful click briefly displays “Target Found” before continuing. No gaze cursor, scores, or search hints appear during the task.

## Run locally

This is a static HTML/CSS/JavaScript application with no build step.

From the prototype directory, with Python installed:

```sh
python -m http.server 5186 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:5186 in a modern desktop browser. Use localhost or HTTPS for camera permission, a webcam, an internet connection for the external tracking library and model assets, and a viewport of at least 900 × 650 CSS pixels.

Syntax checks with Node.js:

```sh
node --check dist/app.js
node --check dist/gaze.js
```

## Source layout

| File | Responsibility |
| --- | --- |
| `dist/index.html` | Entry point and page metadata |
| `dist/style.css` | Layout, study screen, calibration, results |
| `dist/app.js` | Panel rendering, trial state, clicks, timing, CSV exports |
| `dist/gaze.js` | WebGazer adapter, consent, calibration, validation, gaze summaries, JSON export |
| `dist/icon.svg` | App icon |
| `AGENTS.md` | Guidance for future coding agents |

## Data and measurements

Click records contain session ID, trial and attempt numbers, start and click timestamps, reaction time, panel-relative coordinates, correctness, error count, target location, and environment state. Reaction time uses `performance.now()` near the rendered stimulus onset and ends at the correct pointer event. It is a browser estimate, not photodiode-verified display timing.

Webcam records include callback-arrival time relative to trial onset, viewport and panel coordinates, validity, region, and panel geometry. Trial summaries include first sampled region, first sample in the target quadrant, the upper-right share of on-panel samples, and valid predictions per second.

These are **gaze estimates and sample statistics**, not measured fixations, saccades, or dwell duration. Callback timestamps include inference latency. Valid callbacks do not establish coverage of all camera frames.

Available downloads:

- Trial CSV: the successful attempt for each completed trial.
- Click-log CSV: clicks and interrupted-attempt markers.
- Full-session JSON: gaze samples, validation samples and errors, region summaries, click events, and protocol metadata.

Data is held in browser memory. The application does not upload or record camera video or participant data. WebGazer and its model assets are loaded from external services. Downloads are user initiated. Closing or reloading the page discards session data.

## Quality controls and limitations

- The prototype gate requires at least eight valid validation samples at each of five points and per-point median error no greater than 12% of viewport diagonal. This is an engineering feasibility threshold, not a validated scientific criterion.
- Automatic mouse-based training is disabled; calibration explicitly records the calibration-dot coordinates.
- Gaze prediction dots and camera feedback are hidden during trials.
- Hidden-page trial attempts restart and are flagged in the event log. Calibration/validation interruption or a changed window size requires a fresh session.
- The camera stops at completion, explicit cancellation, or page exit.
- There is no drift correction, fixation detector, saccade detector, hardware synchronization, or benchmark against a reference tracker.
- Eight trials demonstrate the interaction and data flow. They do not establish learning effects, clinical validity, or statistical power.
- The remotely loaded WebGazer script is currently unpinned. Pin an audited release and review its license and model dependencies before research deployment.
- Full live-camera end-to-end verification is outstanding. Existing checks cover JavaScript syntax and the base eight-trial click flow using simulated inputs; they do not validate gaze accuracy.

## Open-source eye-movement options

Research checked on September 29, 2026:

| Project | What it provides | Relevance to NeuroNav |
| --- | --- | --- |
| [REMoDNaV](https://github.com/psychoinformatics-de/remodnav) | MIT-licensed Python event detection for saccades, fixations, pursuit, and post-saccadic oscillations | Candidate offline detector for appropriate recorded gaze data. Requires dense regular sampling, known sampling rate, and pixel-to-visual-angle conversion. It does not capture camera data. |
| [OpenIris](https://github.com/ocular-motor-lab/OpenIris) | AGPL-3.0 Windows eye-tracking framework with camera plugins and a network interface | Candidate acquisition backend with compatible hardware. Its documented pipelines can exceed 500 Hz with suitable systems; this does not make a laptop webcam a high-speed tracker. |
| [OpenIrisDPI](https://github.com/ryan-ressmeyer/OpenIrisDPI) | GPL-3.0 dual-Purkinje-image plugin; documented 500 Hz tracking with appropriate optics | Research hardware route, not a drop-in webcam/browser library. |
| [PyGaze](https://github.com/esdalmaijer/PyGaze) | GPL-3.0 experiment toolbox with eye-tracker interfaces and saccade event methods | Candidate for a desktop experiment/hardware integration. |
| [WebGazer](https://webgazer.cs.brown.edu/) | Browser webcam gaze estimation, GPLv3 | Current feasibility adapter; no saccade claims are made. |
| [OcuTrace](https://mirket.io/ocutrace/) | Website advertises webcam saccade/antisaccade detection | Unverified dependency: the linked GitHub repository returned 404 during review. Do not rely on its performance claims without accessible code and validation. |

Recommended next research step: evaluate compatible eye-tracking acquisition hardware/software and a detector such as REMoDNaV against a reference dataset before integrating saccade metrics. Preserve raw data, device timestamps, stimulus events, coordinate transformations, missing intervals, and algorithm parameters. Do not upsample sparse webcam estimates and claim that this recovers unmeasured saccades.

## Deployment

A private Sites project was registered, but publication has not succeeded because the source-host connection failed. The local preview remains the usable prototype. GitHub documentation publication and website deployment are separate operations.

## Licensing

No project-wide license has been selected yet. Dependencies retain their own licenses; WebGazer is GPLv3. Review those obligations before redistribution or choosing a license for the combined application.


