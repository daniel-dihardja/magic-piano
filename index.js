/**
 * Created by danieldihardja on 22.08.19.
 */
import * as mm from '@magenta/music';
import {Observable} from 'rxjs';

const genieCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006';

const kw = [... Array(88).keys()];
const temp = 0.5;
const lowestMidiNote = 21;

const midiOutName = 'IAC Driver P1';
let mout;

let keyMap = {};


/*
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

initGenie(genieCheckpoint, kw, temp)
  .subscribe(e => console.log(e));
*/

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
