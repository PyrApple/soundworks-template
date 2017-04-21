/** 
* TODO: 
* - Handle short audio files
* - only functional with wav input files
**/

////////////////////////////////////////////////////////
// UTILS FUNCTIONS 
////////////////////////////////////////////////////////

// // concatenate 2 Float32 array
// function Float32Concat(first, second)
// {
//   var firstLength = first.length
//   var result = new Float32Array(firstLength + second.length);
//   result.set(first);
//   result.set(second, firstLength);
//   return result;
// }

// // read file from disk, return audio buffer in promise
// function loadAudioBuffer(fileName) {
//   const promise = new Promise((resolve, reject) => {
//     fs.readFile(assetsPath + fileName, (error, buffer) => {
//       // skip if cannot find file
//       if (error) { 
//         reject(error);
//         return; 
//       }
//       // decode file data to audio buffer
//       audioContext.decodeAudioData(buffer, (audioBuffer) => { 
//         resolve(audioBuffer); },
//         (error) => { reject(error); });
//     });
//   });
//   return promise;
// }

// load buffer fileName, return buffer and extracted meta data
function loadStreamBuffer( fileName ){
  const promise = new Promise((resolve, reject) => {
    let filePath = streamPath + fileName;
  
    fs.readFile( filePath, (err, buffer) => {
      // handle read error
      if (err) { reject(err); }
      // read info from wav buffer
      let wavInfo = wavExtractor.getWavInfos( buffer );
      // extract relevant info only
      let metaBuffer = {
        fileName: fileName,
        buffer: buffer,
        dataField: { 
          start: wavInfo.descriptors.get('data').start,
          length: wavInfo.descriptors.get('data').length },
        format: wavInfo.format 
      };

      // resolve
      resolve(metaBuffer);
    });    
  });
  return promise;
}  

////////////////////////////////////////////////////////
// HEADER
////////////////////////////////////////////////////////

// require
var fs = require('fs');
const lame = require("node-lame").Lame;

// define constants
const streamPath = __dirname + '/../../public/stream/';

////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////

export default class AudioStreamer {
  constructor( experience, streamFilePaths ){
    this.e = experience;

    // locals
    this.bufferMap = new Map();

    // debug: load stream buffer
    var fileName = 'virtual-barber-shop.wav';
    loadStreamBuffer( fileName ).then( ( metaBuffer ) => { 
      this.bufferMap.set(fileName, metaBuffer);
      console.log('hehe', this.bufferMap); 
    });
  }


  /**
  * send audio file meta data to client, used upon stream request.
  */
  sendMeta( client, metaBuffer ){
    let metaData = { 
      fileName: metaBuffer.fileName,
      sampleRate: metaBuffer.format.sampleRate, 
      numberOfChannels: metaBuffer.format.numberOfChannels,
      duration: metaBuffer.dataField.length / metaBuffer.format.secToByteFactor
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
        loadStreamBuffer(fileName).then( (buffer) => {
          // save buffer to avoid reloading next time
          this.bufferMap.set( metaBuffer.fileName, metaBuffer );
          // send metadata to client
          this.sendMeta( client, metaBuffer );
        }, (err) => { console.error(err); });
      }
      // if audio file already loaded
      else{ this.sendMeta( client, metaBuffer ); }
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

  }

}



///////////

const StringDecoder = require('string_decoder').StringDecoder;

const wavExtractor = {

byteLength: 4,

decoder: new StringDecoder('utf8'),

getWavInfos( buffer ){
  console.log('input buffer length', buffer.length);
  // get header descriptors
  let descriptors = this.getWavDescriptors( buffer );
  console.log(descriptors);
  // get format specific info
  let format = this.getWavFormat( descriptors, buffer );
  return { descriptors: descriptors, format: format };
},

// format info, see http://www.topherlee.com/software/pcm-tut-wavformat.html
getWavFormat(descriptors, buffer) {
  let fmt = descriptors.get('fmt ');
  let format = { 
    type: buffer.readUIntLE( fmt.start, 2 ), 
    numberOfChannels: buffer.readUIntLE( fmt.start + 2, 2 ), 
    sampleRate: buffer.readUIntLE( fmt.start + 4, 4 ), 
    secToByteFactor: buffer.readUIntLE( fmt.start + 8, 4 ), // (Sample Rate * BitsPerSample * Channels) / 8
    weird: buffer.readUIntLE( fmt.start + 12, 2 ), // (BitsPerSample * Channels) / 8.1 - 8 bit mono2 - 8 bit stereo/16 bit mono4 - 16 bit stereo
    bitPerSample: buffer.readUIntLE( fmt.start + 14, 2 )
  };
  console.log( format );
  return format;
},

getWavDescriptors(buffer) {
  // init header read
  let index = 0;
  let descriptor = '';
  let chunkLength = 0;
  let descriptors = new Map();

  // search for buffer descriptors
  let continueReading = true
  while( continueReading ){

    // read chunk descriptor
    let bytes = buffer.slice(index, index + this.byteLength);
    descriptor = this.decoder.write(bytes);
    
    // special case for RIFF descriptor (header, fixed length)
    if( descriptor === 'RIFF' ){
    // read RIFF descriptor
    chunkLength = 3*this.byteLength;
    descriptors.set(descriptor, { start:index + this.byteLength, length: chunkLength } );
    // first subchunk will always be at byte 12
    index += chunkLength;
    }
    else{
      // account for descriptor length
      index += this.byteLength;

      // read chunk length
      chunkLength = buffer.readUIntLE(index, this.byteLength);

      // fill in descriptor map
      descriptors.set(descriptor, { start:index + this.byteLength, length: chunkLength } );

      // increment read index
      index += chunkLength + this.byteLength;
    }


    // stop loop when reached buffer end
    if( index >= buffer.length - 1 ){ return descriptors; }
  }
}

}