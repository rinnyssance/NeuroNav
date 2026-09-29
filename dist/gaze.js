/* Webcam feasibility adapter. Predictions are never labelled as fixations or saccades. */
const gazeState={mode:'setup',samples:[],validation:[],validationSamples:[],point:null,pointStart:0,lastPrediction:null,calibrationSize:null,run:0,started:false,simulated:false};
const median=values=>{const a=[...values].sort((a,b)=>a-b);return a.length?a[Math.floor(a.length/2)]:null};
const finitePrediction=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const region=(x,y)=>x<0||y<0||x>W||y>H?'outside':`${y<H/2?'upper':'lower'}-${x<W/2?'left':'right'}`;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const originalResults=results,originalShowTrial=showTrial;
function gazeIntro(){
 app.innerHTML=`<div class="intro"><section><div class="eyebrow">WEBCAM GAZE / FEASIBILITY STUDY</div><h1>Where you look.<br>How you adapt.</h1><p>A visual-search study pairing estimated gaze with click responses. Calibrate your camera, complete eight searches, then explore where your gaze was sampled.</p><div class="facts"><div><strong>09</strong><span>Calibration points</span></div><div><strong>05</strong><span>Validation points</span></div><div><strong>08</strong><span>Search trials</span></div></div><div class="scope"><span class="chip">REGION-LEVEL GAZE</span><p>Webcam estimates help explore broad search regions. This prototype does not measure saccades or identify fixations.</p></div></section><section class="brief"><div class="eyebrow">BEFORE YOU BEGIN</div><h2>Set up your viewing space</h2><div class="step"><b>01</b><div><strong>Use a laptop or desktop</strong>Keep the whole panel visible. Sit comfortably, face the camera, and use even front lighting.</div></div><div class="step"><b>02</b><div><strong>Calibrate, then check</strong>Look at and click each calibration dot. A separate hands-off check tests the gaze estimates before the study.</div></div><div class="step"><b>03</b><div><strong>Find O₂ WARNING</strong>Select it as quickly and accurately as possible. The environment may change. Complete all eight trials.</div></div><label class="consent"><input type="checkbox" id="consent"> <span>I agree to use my camera for this session.</span></label><button id="camera" class="primary">Enable camera & calibrate</button><p class="note">Camera frames are processed in your browser. This app does not record or upload video. The tracking library and model files are loaded over the internet. Gaze and click data remain in memory until downloaded or the page is closed.</p><button id="demo" class="secondary">Try simulated walkthrough (no camera)</button><p class="note">Walkthrough uses cursor position as simulated gaze. It skips calibration and is for interface testing only, not research data.</p><p class="setup-error" id="setup-error" role="alert"></p></section></div>`;
 app.querySelector('#camera').onclick=startCamera;
 app.querySelector('#demo').onclick=startDemo;
}
function startDemo(){gazeState.simulated=true;gazeState.calibrationSize={width:innerWidth,height:innerHeight};gazeState.mode='study';trial=1;showTrial()}
document.addEventListener('mousemove',e=>{if(gazeState.simulated&&gazeState.mode==='study')onGaze({x:e.clientX,y:e.clientY})});
async function loadTracker(){
 if(window.webgazer)return;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://webgazer.cs.brown.edu/webgazer.js';s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('The tracking library could not load. Check your internet connection and try again.'))};document.head.append(s)});
}
async function startCamera(){
 const error=app.querySelector('#setup-error'),button=app.querySelector('#camera');
 if(!app.querySelector('#consent').checked){error.textContent='Please select the camera consent checkbox to continue.';return}
 if(innerWidth<900||innerHeight<650){error.textContent='Please use a larger browser window (at least 900 × 650 pixels). This gaze study needs the full panel in view.';return}
 button.disabled=true;button.textContent='Starting camera…';error.textContent='';
 try{
  await loadTracker();
  // The published WebGazer bundle defaults to a relative MediaPipe path, which
  // resolves against this site's root and fails on static deployments.
  webgazer.params.faceMeshSolutionPath='https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';
  webgazer.saveDataAcrossSessions(false).showPredictionPoints(false).applyKalmanFilter(false).setGazeListener(onGaze);
  await webgazer.begin();webgazer.removeMouseEventListeners();gazeState.started=true;
  webgazer.showVideo(true).showFaceOverlay(true).showFaceFeedbackBox(true);
  app.innerHTML=`<section class="brief camera-ready"><div class="eyebrow">CAMERA SETUP</div><h1>Get comfortable.</h1><p>Position your face inside the camera guide. Keep your head still and both eyes visible throughout the study.</p><p>Next, look directly at each dot and click it five times. Keep looking at the dot while clicking.</p><button id="calibrate">Start calibration</button><button id="cancel" class="secondary">Stop camera</button></section>`;
  app.querySelector('#calibrate').onclick=calibrate;app.querySelector('#cancel').onclick=()=>{stopCamera();gazeIntro()};
 }catch(e){console.error('WebGazer startup failed',e);stopCamera();gazeIntro();app.querySelector('#setup-error').textContent=e.name==='NotAllowedError'?'Camera access was denied. Allow camera access in your browser settings, then try again.':e.message||'Camera setup failed. Check camera access and try again.'}
}
function stopCamera(){if(window.webgazer){try{webgazer.stopVideo()}catch(e){console.warn('Camera stop failed',e)}if(gazeState.started){webgazer.end();gazeState.started=false}}gazeState.mode='stopped';document.body.classList.remove('immersive')}
function onGaze(p){
 const now=performance.now();if(finitePrediction(p))gazeState.lastPrediction={x:p.x,y:p.y,time:now};
 if(gazeState.mode==='validation'&&gazeState.point&&now-gazeState.pointStart>=600){gazeState.validationSamples.push({valid:!!finitePrediction(p),x:p?.x??null,y:p?.y??null,error_px:finitePrediction(p)?Math.hypot(p.x-gazeState.point.x,p.y-gazeState.point.y):null});}
 if(!active||gazeState.mode!=='study')return;
 const b=canvas.getBoundingClientRect(),valid=!!finitePrediction(p),x=valid?(p.x-b.left)*W/b.width:null,y=valid?(p.y-b.top)*H/b.height:null;
 gazeState.samples.push({session_id:sessionId,trial,attempt,timestamp:new Date().toISOString(),elapsed_ms:now-startMono,viewport_x:valid?p.x:null,viewport_y:valid?p.y:null,panel_x:x,panel_y:y,valid,region:valid?region(x,y):'missing',panel_left:b.left,panel_top:b.top,panel_width:b.width,panel_height:b.height});
}
async function calibrate(){
 const run=++gazeState.run;gazeState.mode='calibration';gazeState.validation=[];
 await webgazer.clearData();if(run!==gazeState.run)return;
 webgazer.removeMouseEventListeners().showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);
 document.body.classList.add('immersive');gazeState.calibrationSize={width:innerWidth,height:innerHeight};
 const points=[[.12,.15],[.5,.15],[.88,.15],[.12,.5],[.5,.5],[.88,.5],[.12,.85],[.5,.85],[.88,.85]];
 let index=0,count=0;
 function paint(){const [x,y]=points[index];app.innerHTML=`<div class="calibration"><div class="calibration-label"><span class="eyebrow">CALIBRATION ${index+1} / 9</span><p>Look at the dot. Click ${5-count} more time${5-count===1?'':'s'}.</p><span class="note">Keep your head still.</span></div><button class="calibration-dot" style="left:${x*100}%;top:${y*100}%" aria-label="Calibration point ${index+1}, click ${count+1} of 5">${count}</button><p id="calibration-status" role="status"></p><button class="calibration-cancel secondary">Cancel</button></div>`;
  app.querySelector('.calibration-cancel').onclick=()=>{gazeState.run++;stopCamera();gazeIntro()};
  app.querySelector('.calibration-dot').onclick=()=>{const video=document.getElementById('webgazerVideoFeed');if(!video||video.readyState<2){app.querySelector('#calibration-status').textContent='Waiting for camera frames…';return}webgazer.recordScreenPosition(x*innerWidth,y*innerHeight,'click');count++;if(count===5){count=0;index++}if(index===9)validationIntro();else paint()};
 }paint();
}
function validationIntro(){gazeState.mode='ready';app.innerHTML='<section class="brief center-card"><div class="eyebrow">INDEPENDENT QUALITY CHECK</div><h1>Follow with your eyes.</h1><p>Five dots will appear, one at a time. Look at each dot without clicking. This check does not train the gaze model.</p><button id="validate">Check tracking</button></section>';app.querySelector('#validate').onclick=validateGaze}
async function validateGaze(){
 const run=++gazeState.run;gazeState.validation=[];gazeState.mode='validation';
 for(const [index,p] of [[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]].entries()){
  if(run!==gazeState.run)return;
  gazeState.point={x:p[0]*innerWidth,y:p[1]*innerHeight};gazeState.pointStart=performance.now();gazeState.validationSamples=[];
  app.innerHTML=`<div class="calibration"><div class="calibration-label"><span class="eyebrow">QUALITY CHECK ${index+1} / 5</span><p>Look at the dot. No clicking.</p></div><span class="calibration-dot passive" style="left:${p[0]*100}%;top:${p[1]*100}%">+</span></div>`;
  await wait(2400);if(run!==gazeState.run)return;
  const samples=[...gazeState.validationSamples],valid=samples.filter(s=>s.valid);
  gazeState.validation.push({point:index+1,target_x:gazeState.point.x,target_y:gazeState.point.y,samples:valid.length,median_error_px:median(valid.map(s=>s.error_px)),raw_samples:samples});
 }
 gazeState.point=null;gazeState.mode='validated';showValidationResult();
}
function showValidationResult(){
 const diagonal=Math.hypot(innerWidth,innerHeight),limit=diagonal*.12,passed=gazeState.validation.every(p=>p.samples>=8&&p.median_error_px<=limit);
 gazeState.passed=passed;
 app.innerHTML=`<section class="brief center-card"><div class="eyebrow">TRACKING QUALITY</div><h1>${passed?'Ready for broad regions.':'Let’s recalibrate.'}</h1><p>${passed?'The estimates passed this prototype’s region-level quality check. Keep your posture and window size unchanged.':'The estimates are too sparse or too far from the dots. Improve front lighting, reduce glare, and keep your head still before trying again.'}</p><table><thead><tr><th>Point</th><th>Samples</th><th>Median error</th></tr></thead><tbody>${gazeState.validation.map(p=>`<tr><td>${p.point}</td><td>${p.samples}</td><td>${p.median_error_px===null?'No estimate':Math.round(p.median_error_px)+' px'}</td></tr>`).join('')}</tbody></table><p class="note">Prototype gate: at least 8 samples per point and each point’s median error ≤ ${Math.round(limit)} px (12% of the viewport diagonal). This is a feasibility threshold, not research validation.</p><div class="actions">${passed?'<button id="start-study">Begin Experiment</button>':''}<button class="secondary" id="recalibrate">Recalibrate</button><button class="secondary" id="stop">Stop camera</button></div></section>`;
 if(passed)app.querySelector('#start-study').onclick=()=>{gazeState.mode='study';trial=1;showTrial()};
 app.querySelector('#recalibrate').onclick=calibrate;app.querySelector('#stop').onclick=()=>{stopCamera();gazeIntro()};
}
showTrial=function(){originalShowTrial();gazeState.mode='study';document.body.classList.add('immersive');if(gazeState.simulated)app.querySelector('.trialtop').insertAdjacentHTML('beforeend','<span class="chip">SIMULATED CURSOR DATA</span>')};
function gazeMetrics(r){
 const samples=gazeState.samples.filter(s=>s.trial===r.trial&&s.attempt===r.attempt),inside=samples.filter(s=>s.valid&&s.region!=='outside'),valid=samples.filter(s=>s.valid);
 const target=r.trial<=5?'upper-right':'lower-left',first=inside.find(s=>s.region===target);
 return {trial:r.trial,attempt:r.attempt,total_samples:samples.length,valid_samples:valid.length,on_panel_samples:inside.length,predictions_per_second:valid.length/(r.reaction_time_ms/1000),first_sampled_region:inside[0]?.region??'unavailable',first_target_region_sample_ms:first?.elapsed_ms??null,old_region_sample_share:inside.length?inside.filter(s=>s.region==='upper-right').length/inside.length:null};
}
function saveJSON(){const payload={protocol:'NeuroNav webcam feasibility 002',session_id:sessionId,tracker:gazeState.simulated?'SIMULATED CURSOR POSITION; NO EYE TRACKING':'WebGazer browser predictions; Kalman filter off; mouse learning disabled outside calibration',limitations:gazeState.simulated?'Interface walkthrough only. Cursor positions are not gaze or saccade measurements.':'Region samples only. No fixation or saccade detection. Arrival timestamps include inference latency. No pre/post drift correction.',viewport:gazeState.calibrationSize,validation_gate:gazeState.simulated?null:{min_samples_per_point:8,max_median_error_fraction_diagonal:.12},validation:gazeState.validation,trials:records,click_events:events,gaze_samples:gazeState.samples,region_summary:records.map(gazeMetrics)};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`neuronav-${sessionId}-${gazeState.simulated?'simulated':'gaze'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
results=function(){
 originalResults();stopCamera();gazeState.mode='results';const rows=records.map(gazeMetrics),section=document.createElement('section');section.className='gaze-results';
 section.innerHTML=`<div class="eyebrow">${gazeState.simulated?'SIMULATED WALKTHROUGH RESULTS':'EXPLORATORY GAZE RESULTS'}</div><h2>${gazeState.simulated?'Where the cursor moved':'Where the estimates landed'}</h2><p>${gazeState.simulated?'These are cursor positions, not eye tracking. Use this view only to test the interface.':'Each sample is an estimated gaze position. Region shares describe samples on the panel, not fixation duration. Missing or off-panel samples are excluded from region shares.'}</p><div class="table-scroll"><table><thead><tr><th>Trial</th><th>First sampled region</th><th>First target-region sample</th><th>Upper-right share</th><th>Valid / callbacks</th><th>${gazeState.simulated?'Cursor samples/s':'Predictions/s'}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.trial}</td><td>${r.first_sampled_region}</td><td>${r.first_target_region_sample_ms===null?'Unavailable':secs(r.first_target_region_sample_ms)+' s'}</td><td>${r.old_region_sample_share===null?'Unavailable':Math.round(r.old_region_sample_share*100)+'%'}</td><td>${r.valid_samples} / ${r.total_samples}</td><td>${r.predictions_per_second.toFixed(1)}</td></tr>`).join('')}</tbody></table></div><p class="note">The upper-right region contained the target in Trials 1–5. The target was in the lower-left region in Trials 6–8. Valid/callbacks is not a measure of camera-frame coverage.</p><div class="sample-view"><div class="trial-picker"><h3>${gazeState.simulated?'Simulated cursor samples':'Estimated gaze samples'}</h3><label>Trial <select id="gaze-trial">${records.map(r=>`<option value="${r.trial}">${r.trial}</option>`).join('')}</select></label></div><canvas id="gaze-map" width="1200" height="680" aria-label="Samples plotted over the control panel"></canvas><p class="note">Teal dots show on-panel ${gazeState.simulated?'cursor positions':'gaze estimates'}. No connecting lines or fixation labels are inferred.</p></div><button id="gaze-export">Download full ${gazeState.simulated?'simulated walkthrough':'gaze session'} (JSON)</button><p class="note">${gazeState.simulated?'Simulated data only. No camera was used.':'Includes raw estimates, timestamps, panel geometry, calibration validation, region summaries, click events, and interrupted attempts. Camera stopped.'}</p>`;
 app.append(section);section.querySelector('#gaze-export').onclick=saveJSON;section.querySelector('#gaze-trial').onchange=e=>plotSamples(Number(e.target.value));plotSamples(1);
};
function plotSamples(n){const oldTrial=trial,oldCanvas=canvas;trial=n;canvas=app.querySelector('#gaze-map');drawPanel();const completed=records.find(r=>r.trial===n);for(const p of gazeState.samples.filter(s=>s.trial===n&&s.attempt===completed.attempt&&s.valid&&s.region!=='outside')){ctx.beginPath();ctx.arc(p.panel_x,p.panel_y,5,0,Math.PI*2);ctx.fillStyle='#67ffdc80';ctx.fill()}trial=oldTrial;canvas=oldCanvas}
function invalidViewport(){if(!gazeState.started||gazeState.mode==='results')return;gazeState.run++;clearTimeout(transitionTimer);active=false;stopCamera();app.innerHTML='<section class="brief center-card"><h1>Viewing conditions changed.</h1><p>The window changed size or calibration was interrupted. Start a new session to calibrate against the current viewing area.</p><button id="restart">Start new session</button></section>';app.querySelector('#restart').onclick=()=>location.reload()}
window.addEventListener('resize',()=>{if(gazeState.calibrationSize&&(innerWidth!==gazeState.calibrationSize.width||innerHeight!==gazeState.calibrationSize.height))invalidViewport()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['calibration','validation'].includes(gazeState.mode))invalidViewport()});
window.addEventListener('pagehide',stopCamera);
gazeIntro();

