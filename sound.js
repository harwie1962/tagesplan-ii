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

      const notes = [
       // C3 1/16, D3 1/16, G3 1/8, Bb3 1/4 bei Tempo 80 im 2/4-Takt
        { f: 130.81, t: 0.00,   d: 0.1875 },
        { f: 146.83, t: 0.1875, d: 0.1875 },
        { f: 196.00, t: 0.3750, d: 0.3750 },
        { f: 233.08, t: 0.7500, d: 0.7500 }
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
