/**
 * Created by danieldihardja on 22.08.19.
 */
import * as mm from '@magenta/music';
import {Observable, fromEvent, merge, forkJoin, combineLatest, of} from 'rxjs';
import {tap, map} from 'rxjs/operators';

const config = {
  kw: [... Array(88).keys()],
  tempr: 0.5,
  lowestMidiNote : 21,
  genieCheckpoint : 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',
  midiMapping: {
    48: 0,
    50: 1,
    52: 2,
    53: 3,
    55: 4,
    57: 5,
    59: 6,
    60: 7
  }
};

const keyMap = {};
const keyDown$ = fromEvent(window, 'keydown');
const keyUp$ = fromEvent(window, 'keyup');


const initGenie = (checkpoint, whiteKeys, tempr) => new Observable(observer => {
  const genie = new mm.PianoGenie(checkpoint);
  genie.initialize()
    .then(e => {
      genie.nextFromKeyWhitelist(0, whiteKeys, tempr);
      genie.resetState();
      console.log('genie ready');
      observer.next(genie);
    });
});



const initMidi = () => new Observable(observer => {
  navigator.requestMIDIAccess()
  .then(e => {

    let mout = [...e.outputs.values()][0];
    let min = [...e.inputs.values()][1];

    observer.next({
      in: min,
      out: mout,
      msg: []
    });
    
    min.onmidimessage = data => {
      observer.next({
        in: min,
        out: mout,
        msg: data.data
      });
    };
  });
});


const magic = e => {
  const cfg = e[0];
  const genie = e[1];
  const msg = e[2].msg;
  if(msg.length === 0) return;

  if (! cfg.midiMapping[msg[1]] && cfg.midiMapping[msg[1]] !== 0) return;

  const mout = e[2].out;
  if (msg[0] === 144) {
    const n = msg[1];
    const note = genie.nextFromKeyWhitelist(cfg.midiMapping[n], cfg.kw, cfg.tempr) + cfg.lowestMidiNote;
    mout.send([144, note, msg[2]]);
    keyMap[msg[1]] = note;
  } else if(msg[0] === 128) {
    mout.send([128, keyMap[msg[1]], msg[2]]);
  }
};

combineLatest(
  of(config),
  initGenie(config.genieCheckpoint, config.kw, config.tempr),
  initMidi(),
  merge(keyDown$, keyUp$),
)
.pipe(tap(e => magic(e) ))
.subscribe();
