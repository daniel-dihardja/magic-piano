/**
 * Created by danieldihardja on 22.08.19.
 */
import * as mm from '@magenta/music';
import {Observable, fromEvent, merge, forkJoin, combineLatest} from 'rxjs';
import {tap, map} from 'rxjs/operators';

const config = {
  kw: [... Array(88).keys()],
  tempr: 0.5,
  lowestMidiNote : 21,
  genieCheckpoint : 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',
  midiMapping: {
    0: 48,
    1: 50,
    2: 52,
    3: 53,
    4: 55,
    5: 57,
    6: 59,
    7: 60
  }
};

const keyDown$ = fromEvent(window, 'keydown');
const keyUp$ = fromEvent(window, 'keyup');

const initGenie = (checkpoint, whiteKeys, tempr) => {
  return new Observable(observer => {
    const genie = new mm.PianoGenie(checkpoint);
    genie.initialize()
      .then(e => {
        genie.nextFromKeyWhitelist(0, whiteKeys, tempr);
        genie.resetState();
        console.log('genie ready');
        observer.next(genie);
      });
  });
};
const initMidi = () => {
  return new Observable(observer => {

    navigator.requestMIDIAccess()
    .then(e => {
      let mout;
      let min;

      for(let o of e.outputs.values()) {
        mout = o;
      }
      for(let i of e.inputs.values()) {
        min = i;
      }
      observer.next({
        in: min,
        out: mout,
        msg: []
      });

      console.log('midi');

      min.onmidimessage = data => {
        observer.next({
          in: min,
          out: mout,
          msg: data.data
        });
      };
    });
  })
};
const magic = e => {
  console.log(e);
};

combineLatest(
  initGenie(config.genieCheckpoint, config.kw, config.tempr),
  initMidi(),
  merge(keyDown$, keyUp$)
)
.pipe(tap(e => magic(e) ))
.subscribe();





/*
const genie = new mm.PianoGenie(genieCheckpoint);
genie.initialize()
  .then(e => {
    genie.nextFromKeyWhitelist(0, kw, temp);
    genie.resetState();
    console.log('genie ready');
  });

window.addEventListener('keydown', e => {
  const b = e.keyCode - 49;
  if(keyMap[b]) return;
  const note = genie.nextFromKeyWhitelist(b, kw, temp) + lowestMidiNote;
  mout.send([144, note, 127]);
  keyMap[b] = note;
  console.log(note);
});

window.addEventListener('keyup', e =>  {
  const b = e.keyCode - 49;
  mout.send([128, keyMap[b], 100]);
  delete keyMap[b];
});

navigator.requestMIDIAccess()
  .then(access => {
    for(let o of access.outputs.values()) {
      if (o.name === midiOutName) {
        mout = o;
        console.log(mout);
      }
    }
    access.onstatechange = e => {
      // Print information about the (dis)connected MIDI controller
      console.log(e.port.name, e.port.manufacturer, e.port.state);
    };
    console.log('midi enable');
  });
*/


