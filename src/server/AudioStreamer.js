/** 
* TODO: 
* - Handle short audio files
**/

////////////////////////////////////////////////////////
// UTILS FUNCTIONS 
////////////////////////////////////////////////////////

// concatenate 2 Float32 array
function Float32Concat(first, second)
{
  var firstLength = first.length
  var result = new Float32Array(firstLength + second.length);
  result.set(first);
  result.set(second, firstLength);
  return result;
}

// read file from disk, return audio buffer in promise
function loadAudioBuffer(fileName) {
  const promise = new Promise((resolve, reject) => {
    fs.readFile(assetsPath + fileName, (error, buffer) => {
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

////////////////////////////////////////////////////////
// HEADER
////////////////////////////////////////////////////////

// require
var fs = require('fs');
var lame = require('lame');
var toWav = require('audiobuffer-to-wav');
var AudioContext = require('web-audio-api').AudioContext
var lamejs = require('lamejs'); // warning: apply use-strict on all future modules required / imported from this point

// define constants
const audioContext = new AudioContext;
const assetsPath = __dirname + '/../../public/stream/'
const tmpPath = assetsPath + '../tmp/';

////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////

export default class AudioStreamer {
  constructor( experience ){
    this.e = experience;
    this.bufferMap = new Map();
  }

  /**
  * send audio file meta data to client, used upon stream request.
  */
  sendMeta( client, fileName, buffer ){
    let metaData = { 
      fileName: fileName,
      sampleRate: buffer.sampleRate, 
      numberOfChannels: buffer.numberOfChannels,
      length: buffer.length 
    };
    console.log( metaData );
    this.e.send(client, 'stream:metaData', metaData);
  }

  enter(client) {

    // callback: runs when client request file meta-data: preload file and send metadata
    this.e.receive( client, 'stream:metaData', ( fileName ) => {
      // get associated audio buffer
      let buffer = this.bufferMap.get(fileName);
      // create it if need be (audio file never requested by any client yet)
      if( buffer === undefined ){
        loadAudioBuffer(fileName).then( (buffer) => {
          // save buffer to avoid reloading next time
          this.bufferMap.set( fileName, buffer );
          // send metadata to client
          this.sendMeta( client, fileName, buffer );
        }, (err) => { console.error(err); });
      }
      // if audio file already loaded
      else{ this.sendMeta( client, fileName, buffer ); }
    });

    // callback: runs when client requests a chunk of audio data
    this.e.receive( client, 'stream:requestChunk', ( fileName, offset, startTime, chunkDuration ) => {
      // create unique chunk name to write on disk
      let chunkName = client.index + '.' + Math.round(offset*10) + '.' + fileName;
      console.log('request:', chunkName);
      // write chunk to disk
      this.writeAudioToDisk( fileName, chunkName, offset, chunkDuration, () => {
        console.log('notify client', chunkName, 'is ready');
        // notify client chunk is ready for download
        this.e.send(client, 'stream:chunkReady', chunkName, startTime);
      });
    });

    // callback: delete used chunk upon client's notification
    this.e.receive( client, 'stream:deleteChunk', ( chunkName ) => {
      fs.unlink(tmpPath + chunkName, () => { console.log('delete', chunkName); });
    });    

  }

  exit(client){
    this.clearTmpFiles( client.index );
  }

  /** 
  * clear all files generated during streaming with a specific client
  **/
  clearTmpFiles(clientId){
    // for all files in tmp streaming directory
    fs.readdir(tmpPath, (err, files) => {
      for( let file of files ){
        // get client id for whom the chunk was created
        let id = file.split(".")[0];
        console.log('clear tmp', id, file, clientId);
        // delete chunk if ids match
        if( clientId === Number(id) && id ){ // last condition is to check for empty string, e.g. if file is .DS_Store 
          fs.unlink(tmpPath + file); 
        }
      }
    });
  }

  /** 
  * write audio data to disk
  **/
  writeAudioToDisk( fileName, chunkName, offset, chunkDuration, callback ){
    // get buffer chunk
    let buffer = this.bufferMap.get(fileName);
    let chunk = this.getChunk(buffer, offset, chunkDuration);
    // get file type (only supports .wav and .mp3 for now)
    let extension = fileName.split('.').pop();
    if( extension === 'wav' ){
      // convert audio buffer to wav
      var outputData = toWav(chunk);
    }
    // else if( extension === 'mp3' ){
    //   // convert audio buffer to mp3
    //   var outputData = toMp3(chunk);
    // }
    else{ 
      console.error( 'format not supported yet:', extension, 'discard writing to disk' );
      return;
    }
    // get output file name / path
    let chunkPath = tmpPath + chunkName;
    // write (async) wav file to disk
    fs.writeFile( chunkPath, Buffer( outputData ), () => {
      console.log('saved audio file to disk: \n', chunkName);
      callback();
    });
  
  } 

  /** 
  * get chunk out of audio file (extract part of an audio buffer), 
  * starting at offset sec, of duration chunkDuration sec. Handles loop
  * (i.e. if offset >= buffer duration)
  **/
  getChunk(buffer, offset, chunkDuration){
    // get start index
    let startIndex = Math.floor( buffer.sampleRate * offset );
    // get end index
    let numSamples = Math.ceil( buffer.sampleRate * chunkDuration );
    let endIndex = startIndex + numSamples;
    // create empty output buffer
    let outputBuffer = audioContext.createBuffer(buffer.numberOfChannels, numSamples, buffer.sampleRate);
    // default scenario (no need for loop)
    if( endIndex <= buffer.length ){
      // loop over audio channels
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        // copy channel to output
        outputBuffer.getChannelData(ch).set( buffer.getChannelData(ch).slice( startIndex, endIndex ) );
      }
    }
    // loop scenario
    else{
      // loop over audio channels
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        // copy channel to output, concatenating: output = [input_end, input_begin]
        outputBuffer.getChannelData(ch).set( Float32Concat( 
          buffer.getChannelData(ch).slice( startIndex, buffer.length ),
          buffer.getChannelData(ch).slice( 0, endIndex - buffer.length )
        ));
      }
    }
    return outputBuffer;
  }

  toMp3(buffer){
    console.log('jkflds')
    const Lame = require("node-lame").Lame;


    // const filename = __dirname + '/../../public/sounds/wave-a.mp3';
    const filename = __dirname + '/../../public/sounds/samples/VMH1 Minimal Beats 05.wav';

    this.encoder = new Lame({
      "output": "buffer",
      "bitrate": 192
    }).setFile(filename);

    this.encoder.encode().then( () => {
      // Encoding finished
      console.log('HKJFDSHJK')
      const buffer = this.encoder.getBuffer();
    }).catch((error) => {
      console.log('error', error)
        // Something went wrong
    });



    // console.log('jkflds1')
    // const encoder = new Lame({ "output": "test.mp3", "bitrate": 192 })
    // console.log('jkflds10')
    // console.log(buffer);
    // encoder.setBuffer(buffer);
    // console.log('jkflds11')

    // encoder.encode()
    //   .then(() => {
    //     // Encoding finished
    //     console.log('encoding finished')
    //   })
    //   .catch((error) => {
    //     // Something went wrong
    //     console.log('encoding wronged', error)
    //   });

    //   console.log('jkflds3')
    //   return undefined;




      // // init
      // var mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128); //mono 44.1khz encode to 128kbps
      // var samples = new Int16Array( buffer.length ); //one second of silence replace that with your own samples

      // let sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

      // var mp3Data = [];
      // for (var i = 0; i < samples.length; i += sampleBlockSize) {
      //   let sampleChunk = samples.subarray(i, i + sampleBlockSize);
      //   var mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      //   if (mp3buf.length > 0) {
      //       mp3Data.push(mp3buf);
      //   }
      // }
      // var mp3buf = mp3encoder.flush();   //finish writing mp3

      // if (mp3buf.length > 0) {
      //     mp3Data.push(new Int8Array(mp3buf));
      // }

      // // var samplesFloat = buffer.getChannelData(0);
      
      
      // // for(let i = 0; i < samplesInt.length; i++){
      // //   samplesInt[i] = Math.round( samplesFloat[i] * 1000 );
      // //   // if( samples[i] >=  100 ){ console.log(samples[i])}
      // // }      
      // // // console.log('samples', samples)
      // // var mp3Tmp = mp3encoder.encodeBuffer(samplesInt); //encode mp3

      // // //Push encode buffer to mp3Data variable
      // // mp3Data.push(mp3Tmp);

      // // // Get end part of mp3
      // // mp3Tmp = mp3encoder.flush();

      // // // Write last data to the output data, too
      // // // mp3Data contains now the complete mp3Data
      // // mp3Data.push(mp3Tmp);
      
      // // console.log(mp3Data)

      // return mp3Data;
  }

}

// 

// // TODO : encode local wav to mp3 and save to disk

// var wav = require('wav');
// var lame = require('lame');

// wav2mp3(){
//   // get file name
//   let fileNameIn = assetsPath + 'wave-a.wav';
//   let fileNameOut = fileNameIn.substr(0, fileNameIn.lastIndexOf(".")) + ".mp3";

//   console.log('-->file in:\n', fileNameIn);
//   console.log('<--file out:\n', fileNameOut);
  
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

//     // encoding the wave file into an MP3 is as simple as calling pipe()
//     let encoder = new lame.Encoder(format);
//     reader.pipe(encoder).pipe(output);      
//   });

//   // and start transferring the data
//   input.pipe(reader);
// }