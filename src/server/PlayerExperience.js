import { Experience } from 'soundworks/server';

var fs = require('fs');
var wav = require('wav');
const assetsPath = __dirname + '/../../public/sounds/'

var lame = require('lame');

var lamejs = require('lamejs');
var XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.audioBufferManager = this.require('audio-buffer-manager');
  }

  // if anything needs to append when the experience starts
  start() {

    // get file name
    let fileNameIn = assetsPath + 'wave-a.wav';
    let fileNameOut = fileNameIn.substr(0, fileNameIn.lastIndexOf(".")) + ".mp3";

    console.log('-->file in:\n', fileNameIn);
    console.log('<--file out:\n', fileNameOut);

    // LAME --------------------------------------------------------------------
    // create fs streams
    let input = fs.createReadStream(fileNameIn);
    let output = fs.createWriteStream(fileNameOut);

    // start reading the WAV file from the input
    let reader = new wav.Reader();

    // we have to wait for the "format" event before we can start encoding
    reader.on('format', (format) => {

      // display format
      console.log('WAV format:');
      for (var name in format) {
        if (format.hasOwnProperty(name)) {
          console.log('\t', name, format[name]);
        }
      }      

      // encoding the wave file into an MP3 is as simple as calling pipe()
      let encoder = new lame.Encoder(format);
      reader.pipe(encoder).pipe(output);      
    });

    // and start transferring the data
    input.pipe(reader);

    // -------------------------------------------------------------------------

  //   // LAMEJS ------------------------------------------------------------------

  //   // create fs streams
  //   let input = fs.createReadStream(fileNameIn);
  //   let output = fs.createWriteStream(fileNameOut);

  //   // start reading the WAV file from the input
  //   let reader = new wav.Reader();

  //   // we have to wait for the "format" event before we can start encoding
  //   reader.on('format', (format) => {

  //     // display format
  //     console.log('WAV format:');
  //     for (var name in format) {
  //       if (format.hasOwnProperty(name)) {
  //         console.log('\t', name, format[name]);
  //       }
  //     }

  //   });

  //   // we have to wait for the "format" event before we can start encoding
  //   reader.once('readable', ()  => {

  //     // console.log(reader)
  //     let samples = new Int16Array(3000);
  //     console.log(reader.channels, reader.sampleRate, samples.length);
  //     this.encodeMono(reader.channels, reader.sampleRate, samples);

  //   });

  //   // and start transferring the data
  //   input.pipe(reader);  

  // }

  // encodeMono(channels, sampleRate, samples) {
  //     var buffer = [];
  //     var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  //     var remaining = samples.length;
  //     var maxSamples = 1152;
  //     for (var i = 0; remaining >= maxSamples; i += maxSamples) {
  //         var mono = samples.subarray(i, i + maxSamples);
  //         var mp3buf = mp3enc.encodeBuffer(mono);
  //         if (mp3buf.length > 0) {
  //             buffer.push(new Int8Array(mp3buf));
  //         }
  //         remaining -= maxSamples;
  //     }
  //     var d = mp3enc.flush();
  //     if(d.length > 0){
  //         buffer.push(new Int8Array(d));
  //     }
  //     for (var i = 0; i < 2; i ++) {
  //       console.log('done encoding, channel', i, 'size', buffer[i].length);
  //     }
  // // -------------------------------------------------------------------------
    
  }
  
  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);
    // send a 'hello' message to all the other clients of the same type
    this.broadcast(client.type, client, 'hello');
  }

  exit(client) {
    super.exit(client);
    // send a 'goodbye' message to all the other clients of the same type
    this.broadcast(client.type, client, 'goodbye');
  }
}
