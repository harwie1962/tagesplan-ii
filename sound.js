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

const BPM = 94;
const QUARTER = 60 / BPM;
const SIXTEENTH = QUARTER / 4;
const EIGHTH = QUARTER / 2;
const WHOLE = QUARTER * 4;

const sequence = [
  { f: 392.00, d: EIGHTH },
  { f: 349.23, d: EIGHTH },
  { f: 392.00, d: EIGHTH },
  { f: 415.30, d: EIGHTH },

  { f: 466.16, d: EIGHTH },
  { f: 523.25, d: EIGHTH },
  { f: 587.33, d: EIGHTH },
  { f: 622.25, d: EIGHTH },

  { f: 698.46, d: EIGHTH },
  { f: 622.25, d: EIGHTH },
  { f: 587.33, d: EIGHTH },
  { f: 523.25, d: EIGHTH },

  { f: 622.25, d: WHOLE }
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
