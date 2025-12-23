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

      const VOLUME = 0.70;
      const TYPE = "triangle";
      const BPM = 80;
      const QUARTER = 60 / BPM; // Dauer einer 1/4-Note bei 80 BPM
      const SIXTEENTH = QUARTER / 4;
      const EIGHTH = QUARTER / 2;

      // Neue Tonfolge: C3 1/16, D3 1/16, G3 1/8, Bb3 1/4 (2/4-Takt)
      const sequence = [
  // Takt 1
  { f: 392.00, d: EIGHTH }, // G4
  { f: 349.23, d: EIGHTH }, // F4
  { f: 392.00, d: EIGHTH }, // G4
  { f: 415.30, d: EIGHTH }, // Ab4

  // Takt 2
  { f: 466.16, d: EIGHTH }, // Bb4
  { f: 523.25, d: EIGHTH }, // C5
  { f: 587.33, d: EIGHTH }, // D5
  { f: 622.25, d: EIGHTH }, // Eb5

  // Takt 3
  { f: 698.46, d: EIGHTH }, // F5
  { f: 622.25, d: EIGHTH }, // Eb5
  { f: 587.33, d: EIGHTH }, // D5
  { f: 523.25, d: EIGHTH }, // C5

  // Schlusston (gebunden, langer Halt)
  { f: 622.25, d: WHOLE }  // Eb5 (Liegeton)
];

      // In Startzeiten umwandeln
      let currentTime = 0;
      const notes = sequence.map(step => {
        const note = { f: step.f, t: currentTime, d: step.d };
        currentTime += step.d;
        return note;
      });

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
