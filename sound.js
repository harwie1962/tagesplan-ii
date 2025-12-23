// assets/sound.js
// Polyphoner WebAudio-Player (mehrstimmig, 4 Stimmen möglich)
// Eingabeformat: pro Stimme eine Folge von Steps mit Notennamen + Beat-Dauer.
// Beat = Viertelnote (Quarter). Tempo: QUARTER = 60/BPM.

window.Sound = (function () {
  let enabled = true;

  // AudioContext wiederverwenden (nicht bei jedem Play neu erzeugen)
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setEnabled(v) { enabled = !!v; }
  function isEnabled() { return enabled; }

  // ---------- Musik-Parameter ----------
  const TYPE = "triangle";

  // Contrapunctus I: im Bild steht ♪ = 54
  const BPM = 54;
  const QUARTER = 60 / BPM;
  const EIGHTH = QUARTER / 2;
  const SIXTEENTH = QUARTER / 4;
  const HALF = QUARTER * 2;
  const WHOLE = QUARTER * 4;

  // ---------- Hilfen: Note -> Frequenz ----------
  // Notennamen: "C4", "Bb3", "F#5" etc. (b = flat, # = sharp)
  function noteToFreq(note) {
    if (note == null) return 0;

    // Unterstützt auch Akkorde: ["C4","E4","G4"]
    if (Array.isArray(note)) return note.map(noteToFreq);

    const m = /^([A-G])([b#]?)(-?\d+)$/.exec(note.trim());
    if (!m) throw new Error("Ungültige Note: " + note);

    const letter = m[1];
    const accidental = m[2] || "";
    const octave = parseInt(m[3], 10);

    const semitoneMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let n = semitoneMap[letter];
    if (accidental === "#") n += 1;
    if (accidental === "b") n -= 1;

    // MIDI: C4 = 60, A4 = 69
    const midi = (octave + 1) * 12 + n;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---------- Builder: steps -> Events mit Startzeiten ----------
  // steps: [{ p:"F4", b:4 }, { p:null, b:1 }, { p:["C4","E4"], b:2 }, ...]
  // p = pitch (string | array | null), b = beats (Viertel-Schläge)
  function buildVoice(steps) {
    let tBeats = 0;
    const events = [];
    for (const s of steps) {
      const beats = s.b ?? 1;
      const pitch = s.p ?? null;

      if (pitch !== null) {
        events.push({
          f: noteToFreq(pitch),
          t: tBeats * QUARTER,
          d: beats * QUARTER
        });
      }
      tBeats += beats;
    }
    return events;
  }

  // ---------- Synth: eine Note/Akkord schedulen ----------
  function scheduleEvent(ctx, ev, opts) {
    const start = ctx.currentTime + ev.t;
    const dur = ev.d;

    // ev.f kann Zahl (Mononote) oder Array (Akkord) sein
    const freqs = Array.isArray(ev.f) ? ev.f : [ev.f];

    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // optional panning
      let nodeOut = gain;
      if (opts.panner) {
        gain.connect(opts.panner);
        nodeOut = opts.panner;
      }
      nodeOut.connect(ctx.destination);

      osc.type = opts.type;
      osc.frequency.value = freq;

      osc.connect(gain);

      // Hüllkurve: kurzer Attack, dann Decay
      const A = 0.005;                 // Attack
      const R = Math.min(0.06, dur*0.25); // Release (kurz)
      const peak = opts.volume;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + A);

      // leichtes Halten, dann Release
      const holdEnd = Math.max(start + A, start + dur - R);
      gain.gain.setValueAtTime(peak, holdEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
  }

  // ---------- Stimmen (Platzhalter!) ----------
  // Du wolltest "mehrstimmig" + "gesamten Soundcode".
  // Diese Score-Daten sind bewusst als EDITIERBARE Vorlage angelegt.
  // Trage hier pro Stimme die Noten aus deiner Partitur ein.

  // Stimme 1 (Sopran) – Beispiel (erste Takte grob als Platzhalter)
  const SOPRANO_STEPS = [
    // Takt 1–2: (hier ersetzen durch echte Noten aus deinem Bild)
    { p: "F4", b: 4 },   // ganze Note
    { p: "A4", b: 4 },   // ganze Note
    // ...
  ];

  // Stimme 2 (Alt)
  const ALTO_STEPS = [
    { p: "C4", b: 4 },
    { p: "F4", b: 4 },
    // ...
  ];

  // Stimme 3 (Tenor)
  const TENOR_STEPS = [
    { p: "A3", b: 4 },
    { p: "C4", b: 4 },
    // ...
  ];

  // Stimme 4 (Bass)
  const BASS_STEPS = [
    { p: "F3", b: 4 },
    { p: "F3", b: 4 },
    // ...
  ];

  // Panning/Level pro Stimme (frei anpassbar)
  const VOICE_SETTINGS = [
    { name: "Soprano", volume: 0.26, pan: -0.35 },
    { name: "Alto",    volume: 0.22, pan: -0.10 },
    { name: "Tenor",   volume: 0.22, pan:  0.10 },
    { name: "Bass",    volume: 0.28, pan:  0.35 }
  ];

  function play() {
    if (!enabled) return;

    try {
      const audioContext = getCtx();

      // Stimmen bauen
      const voices = [
        buildVoice(SOPRANO_STEPS),
        buildVoice(ALTO_STEPS),
        buildVoice(TENOR_STEPS),
        buildVoice(BASS_STEPS)
      ];

      // pro Stimme optional Panner erzeugen
      const pannners = VOICE_SETTINGS.map(vs => {
        const p = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;
        if (p) p.pan.value = vs.pan;
        return p;
      });

      // alle Events schedulen
      for (let i = 0; i < voices.length; i++) {
        const evs = voices[i];
        const vs = VOICE_SETTINGS[i];
        const panner = pannners[i];

        for (const ev of evs) {
          scheduleEvent(audioContext, ev, {
            type: TYPE,
            volume: vs.volume,
            panner
          });
        }
      }
    } catch (e) {
      console.error("Sound-Fehler:", e);
    }
  }

  return { play, setEnabled, isEnabled };
})();
