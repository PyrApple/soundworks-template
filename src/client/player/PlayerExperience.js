import * as soundworks from 'soundworks/client';
import { centToLinear } from 'soundworks/utils/math';
import PlayerRenderer from './PlayerRenderer';

import AudioStream from './AudioStream';

import * as ambisonics from 'ambisonics';

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

    // services
    this.sync = this.require('sync');
    this.platform = this.require('platform', { features: ['web-audio'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      directories: { path: 'sounds', recursive: true },
    });

    this.audioStream = new AudioStream(this);
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Let's go!` };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();

    // init stream
    this.audioStream.init();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();
    
    // // Debug Ambisonic
    // // let irUrl = 'sounds/irs/room-medium-1-furnished-src-20-Set1_16b.wav';
    // let irUrl = 'sounds/irs/HOA3_filters_virtual.wav';
    // // create ambisonic decoder (common to all sources)
    // this.ambisonicOrder = 1;
    // this.decoder = new ambisonics.binDecoder(audioContext, this.ambisonicOrder);
    // this.rotator = new ambisonics.sceneRotator(audioContext, this.ambisonicOrder);
    // var loader_filters = new ambisonics.HOAloader(audioContext, this.ambisonicOrder, irUrl, (bufferIr) => { 
    //     this.decoder.updateFilters(bufferIr); 
    // });
    // loader_filters.load();
    // // connect graph
    // this.rotator.out.connect(this.decoder.in);
    // this.decoder.out.connect(audioContext.destination);
    // this.audioStream.connect(this.rotator.in);
    // setInterval( () => { 
    //     this.rotator.yaw += 4;
    //     // console.log('azim', this.rotator.yaw);
    //     this.rotator.elev = 0;
    //     this.rotator.updateRotMtx();
    // }, 100);
    
    
    // config audio stream
    this.audioStream.loop = true;
    this.audioStream.sync = true;
    // this.audioStream.url = 'Boucle_FranceInfo_Regie_Ambi_01_01-04ch.wav';
    // this.audioStream.url = '13_Misconceptions_About_Global_Warming_Cut.wav';
    this.audioStream.url = '13_Misconceptions_About_Global_Warming_Cut.mp3';
    // this.audioStream.out.connect(audioContext.destination);

    // start audio stream
    let when = 0; 
    let offset = 0;
    this.audioStream.start(when, offset);
    
    // debug: start source at same time    
    let src = audioContext.createBufferSource();
    console.log(this.audioBufferManager)
    src.buffer = this.audioBufferManager.data[0];
    src.start(audioContext.currentTime + when, offset);
    
    // src.connect(audioContext.destination)
    // this.audioStream.connect(audioContext.destination);

    // setTimeout( () => { 
    //   this.audioStream.start(when, offset);
    //   src.start(audioContext.currentTime + when, offset);
    // }, 6000);

    when = 4.5;
    setTimeout( () => { 
      this.audioStream.stop(when); 
      src.stop(audioContext.currentTime + when);
    }, 12000 );


    // DEBUG: BUFFERED LEFT / STREAMED RIGHT EAR
    var splitter = audioContext.createChannelSplitter(2);
    src.connect(splitter);
    var merger = audioContext.createChannelMerger(2);
    var gainNode = audioContext.createGain();
    gainNode.gain.value = 0.0;
    splitter.connect(gainNode, 0);
    gainNode.connect(merger, 0, 1);
    splitter.connect(merger, 1, 0);
    merger.connect(audioContext.destination);

    var splitter2 = audioContext.createChannelSplitter(2);
    this.audioStream.connect(splitter2);
    var gainNode2 = audioContext.createGain();
    gainNode2.gain.value = 0.0;
    splitter2.connect(gainNode2, 0);
    splitter2.connect(merger, 0, 1);
    gainNode2.connect(merger, 0, 0);

  }

}


