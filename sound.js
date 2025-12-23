diff --git a/sound.js b/sound.js
index eb37dee284ab9dbd059410d577e35c081bc1c785..42bc26ef7606a239fdec21f10947a03e8b080487 100644
--- a/sound.js
+++ b/sound.js
@@ -1,46 +1,50 @@
 // assets/sound.js
 window.Sound = (function () {
   let enabled = true;
 
   function setEnabled(v) { enabled = !!v; }
   function isEnabled() { return enabled; }
 
   function play() {
     if (!enabled) return;
 
     try {
       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
       if (audioContext.state === "suspended") audioContext.resume();
 
       const VOLUME = 0.30;
       const TYPE = "triangle";
+      const BPM = 80;
+      const QUARTER_DURATION = 60 / BPM; // 1/4 Note in Sekunden bei 2/4-Takt
 
       const notes = [
-        { f: 880, t: 0.00, d: 0.12 },
-        { f: 988, t: 0.14, d: 0.12 },
-        { f: 784, t: 0.28, d: 0.16 }
+        // C3 1/16, D3 1/16, G3 1/8, Bb3 1/4 bei Tempo 80 im 2/4-Takt
+        { f: 130.81, t: 0.00, d: QUARTER_DURATION / 4 },
+        { f: 146.83, t: QUARTER_DURATION / 4, d: QUARTER_DURATION / 4 },
+        { f: 196.00, t: QUARTER_DURATION / 2, d: QUARTER_DURATION / 2 },
+        { f: 233.08, t: QUARTER_DURATION, d: QUARTER_DURATION }
       ];
 
       notes.forEach(n => {
         const osc = audioContext.createOscillator();
         const gain = audioContext.createGain();
         osc.type = TYPE;
         osc.frequency.value = n.f;
 
         osc.connect(gain);
         gain.connect(audioContext.destination);
 
         const start = audioContext.currentTime + n.t;
         gain.gain.setValueAtTime(VOLUME, start);
         gain.gain.exponentialRampToValueAtTime(0.01, start + n.d);
 
         osc.start(start);
         osc.stop(start + n.d);
       });
     } catch (e) {
       console.error("Sound-Fehler:", e);
     }
   }
 
   return { play, setEnabled, isEnabled };
 })();
