import * as soundworks from 'soundworks/client';
import { centToLinear } from 'soundworks/utils/math';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;

// var wav = require('wav');
// const assetsPath = __dirname + '/../../public/sounds/'
// var lamejs = require('lamejs');

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      directories: { path: 'sounds', recursive: true },
    });
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Let's go!` };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    
    // var wavFile = assetsPath + 'wave-a.wav';
    // var request = new XMLHttpRequest();
    // request.open("GET", wavFile, true);
    // request.responseType = "arraybuffer";
    // // Our asynchronous callback
    // request.onload = () => {
    //     var audioData = request.response;
    //     var wav = lamejs.WavHeader.readHeader(new DataView(audioData));
    //     console.log('wav:', wav);
    //     var samples = new Int16Array(audioData, wav.dataOffset, wav.dataLen / 2);
    //     this.encodeMono(wav.channels, wav.sampleRate, samples);
    // };
    // request.send();


  }

// encodeMono(channels, sampleRate, samples) {
//       var buffer = [];
//       var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
//       var remaining = samples.length;
//       var maxSamples = 1152;
//       for (var i = 0; remaining >= maxSamples; i += maxSamples) {
//           var mono = samples.subarray(i, i + maxSamples);
//           var mp3buf = mp3enc.encodeBuffer(mono);
//           if (mp3buf.length > 0) {
//               buffer.push(new Int8Array(mp3buf));
//           }
//           remaining -= maxSamples;
//       }
//       var d = mp3enc.flush();
//       if(d.length > 0){
//           buffer.push(new Int8Array(d));
//       }
//       console.log('done encoding, size=', buffer.length);
//       var blob = new Blob(buffer, {type: 'audio/mp3'});
//       var bUrl = window.URL.createObjectURL(blob);
//       console.log('Blob created, URL:', bUrl);
//       // window.myAudioPlayer = document.createElement('audio');
//       // window.myAudioPlayer.src = bUrl;
//       // window.myAudioPlayer.setAttribute('controls', '');
//       // window.myAudioPlayer.play();
//   }

}
