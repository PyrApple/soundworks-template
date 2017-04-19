import { Experience } from 'soundworks/server';
import AudioStreamer from './AudioStreamer';

const Lame = require("node-lame").Lame;

// DEBUG: ttest mp3 conversion
var AudioContext = require('web-audio-api').AudioContext;
const audioContext = new AudioContext;

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    // services
    this.sync = this.require('sync');
    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.audioBufferManager = this.require('audio-buffer-manager');

    // locals
    this.audioStreamer = new AudioStreamer(this);
  }

  // if anything needs to append when the experience starts
  start() {
    // DEBUG: test mp3 conversion ------------------------------------------------------
    
        
    // // let buffer = audioContext.createBuffer(2, 44100 * 2, 44100);

    // // let fileName = __dirname + '/../../public/sounds/13_Misconceptions_About_Global_Warming_Cut.mp3'
    // let fileName = __dirname + '/../../public/sounds/wave-a.mp3'

    // let buffer = loadAudioBuffer(fileName).then( (buffer) => {
      
    //   // var fs = require('fs');
    //   // var toWav = require('audiobuffer-to-wav');

    //   // console.log()
    //   // let outputData = toWav( buffer );
    //   // let outputData2 = this.audioStreamer.toMp3( buffer );
      
    //   // console.log(outputData)
    //   // for( let i = 0; i < 10; i++){
    //   //   console.log(outputData[i])
    //   // }

    //   // for( let i = 0; i < outputData2[0].length; i++){
    //   //   console.log(outputData2[0][i])
    //   // }

    //   // outputData2 = outputData2[0].buffer;
    //   // console.log(outputData2);

    //   // fs.writeFile('test.wav', Buffer(outputData), () => {
    //   //   console.log('saved wav audio file to disk');
    //   // });
      
    //   // fs.writeFile('test.mp3', Buffer(outputData2), () => {
    //   //   console.log('saved mp3 audio file to disk');
    //   // });


    //   }, (err) => { console.error(err); });


    // // const filename = __dirname + '/../../public/sounds/wave-a.mp3';
    // const fileName = __dirname + '/../../public/sounds/samples/example';

    // const encoder = new Lame({
    //   "output": "buffer",
    //   // "output": fileName + '.mp3',
    //   "bitrate": 128
    // }).setFile(fileName + '.wav');


    // encoder.encode().then( () => {
    //   console.log('### encoding complete');
    //   const buffer = encoder.getBuffer();
    // }).catch((error) => {
    //   console.log('error in encode:', error)
    // });

    // DEBUG: test mp3 conversion (end) --------------------------------------------------

  }
  
  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);
    this.audioStreamer.enter(client);
  }

  exit(client) {
    super.exit(client);
    this.audioStreamer.exit(client);
  }

}

// read file from disk, return audio buffer in promise
function loadAudioBuffer(fileName) {
  const promise = new Promise((resolve, reject) => {
    fs.readFile(fileName, (error, buffer) => {
      // skip if cannot find file
      if (error) { 
        reject(error);
        return; 
      }
      // decode file data to audio buffer
      audioContext.decodeAudioData(buffer, (audioBuffer) => { 
        resolve(audioBuffer); },
        (error) => { reject(error); });
    });
  });
  return promise;
}