# NeuroNav — agent guidance

## Purpose and scope

Maintain a browser-based spatial-adaptation research prototype. Read `README.md` and the relevant source before editing. Preserve the user's latest requested scientific scope. Never describe this as a diagnostic or clinically validated system.

## Architecture

- Static application; no framework or build step is required.
- `dist/app.js` owns the deterministic panel, eight-trial sequence, click records, timing, and base results.
- `dist/gaze.js` extends that flow with camera consent, WebGazer calibration/validation, gaze collection, and results. It currently reassigns base functions; preserve load order or refactor both files together.
- `dist/saccades.js` adds an optional import for synchronized high-rate eye-tracker data and exploratory saccade candidates after results. It wraps the results function, so keep it loaded after `gaze.js`.
- `dist/style.css` includes immersive calibration/study layout and responsive results.
- Keep app-owned data in memory unless the user explicitly requests persistence.

## Experimental invariants

- Exactly eight trials: target upper-right for 1–5 and lower-left for 6–8.
- Only the target changes location; all other stimulus elements remain fixed.
- Do not announce the transition or show gaze traces, timing, scores, or target hints during a trial.
- Incorrect clicks remain in the event log and do not end the trial.
- Use the fixed 1200 × 680 stimulus coordinate system, with recorded viewport geometry for transformations.
- Keep monotonic timing separate from wall-clock timestamps. Preserve interruption/attempt identifiers and do not silently combine repeated attempts.

## Measurement integrity

- Label webcam outputs as gaze estimates and region/sample summaries.
- Do not label sample-to-sample jumps as saccades or clusters as fixations without an explicit, documented detector and suitable validation.
- Keep optional imported-tracker candidates distinct from webcam results. The current detector is a heuristic, not a validated scientific measure.
- Never generate substitute gaze data when the camera, model, or calibration fails.
- Keep calibration training and independent validation separate. Disable automatic click/mouse training during validation and trials.
- Treat the current 12%-diagonal validation gate as a prototype heuristic, not a published accuracy standard.
- A faster software loop or interpolated samples does not increase camera sampling rate.
- Preserve raw samples, missing data, device/arrival timestamps, coordinate units, and detector parameters when adding a hardware or analysis adapter.
- For REMoDNaV, respect its dense regular sampling and visual-angle conversion requirements; do not silently feed irregular callback data as if it were regularly sampled.

## Camera and data handling

- Request camera access only after participant consent and an explicit start action.
- Stop camera tracks on cancellation, completion, failure, and page exit.
- Do not transmit video, gaze data, or participant identifiers without explicit product requirements and corresponding participant disclosure.
- Do not commit recordings, exported sessions, credentials, tokens, or private participant data.
- Keep third-party dependencies and license obligations documented. Pin an audited tracking-library version before research deployment.

## Verification

Run `node --check dist/app.js`, `node --check dist/gaze.js`, and `node --check dist/saccades.js` after JavaScript changes. For experiment changes, verify all eight trials, incorrect clicks, the Trial 6 move, timestamps, interruptions, and exports. For gaze changes, verify denied permission, model-load failure, insufficient predictions, failed validation, resizing, camera shutdown, and no training leakage. Test the optional saccade importer against synthetic valid, sparse, irregular, and malformed recordings.

Use synthetic inputs only for clearly labeled software tests. Never report a mocked camera test as live-device or scientific validation. Report what was and was not verified. Do not access the user's camera just to perform automated UI checks.

## Collaboration and publication

- Use a `codex/` branch for new development branches unless the user specifies otherwise.
- Preserve unrelated files and existing repository instructions. Do not overwrite another project's README or AGENTS.md to place this project there.
- Keep website publication and GitHub pushes distinct; verify each before claiming success.
- Update the README when capabilities, limitations, run instructions, or deployment status change.
- Do not choose a new project license or change repository visibility without the user's direction.

