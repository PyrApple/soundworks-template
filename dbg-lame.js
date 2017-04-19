const Lame = require("node-lame").Lame;
const fs = require("fs");
const fsp = require("fs-promise");

// var AudioContext = require('web-audio-api').AudioContext;

const AudioContext = require("web-audio-engine").StreamAudioContext;
const audioContext = new AudioContext;

var fileName = __dirname + '/public/sounds/samples/example';


var http = require('http'),
    filePath = fileName + '.mp3',
    stat = fs.statSync(filePath);

http.createServer(function(request, response) {

    response.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    // We replaced all the event handlers with a simple call to util.pump()
    fs.createReadStream(filePath).pipe(response);
})
.listen(2000);

// // PROBLEM: ADDS ZERO PADDING
// var ffmpeg = require('fluent-ffmpeg');

// for( let i = 0; i < 10; i += 2 ){
//   let command = ffmpeg(fileName+'.mp3')
//   // .inputOptions(
//   //   '-ss',  i, 
//   //   '-t',  '2.0'
//   // )
//   .outputOptions(
//     // '-acodec', 'copy'
//     '-f',  'segment',
//     '-segment_time',  '2.00',
//     '-c', 'copy', 
//     '-reset_timestamps', '1'
//     // 'out%03d.mp3'
//   )
//   // .output(fileName + '-out-' + i + '.mp3')
//   .output(fileName + '-out-%01d' + '.mp3')
//   .on('end', () => { console.log('ffmpeg copy over'); })
//   .run();
// }



// fsp.readFile(fileName + '.wav')
//   .then((inputBuffer) => {
    


//     // console.log('fps buffer \n', inputBuffer);
//     var dur = 2;
//     for( let i = 0; i < 10; i+=dur ){

//       let encoderTmp = new Lame({
//         "output": fileName + '-out-' + i + '.mp3',
//         "bitrate": 192
//       });

//       // get header
//       // var headerLength = 127*50
//       // var id3 = inputBuffer.slice(0, headerLength);

//       let n = 4*44100;
//       let s = i*n;
//       let e = s + n*dur - 1;
      
//       let slicedBuffer = inputBuffer.slice(s, e);

//       // let outputBuffer = Buffer.concat( [id3, slicedBuffer], id3.length + inputBuffer.length )

//       encoderTmp.setBuffer(slicedBuffer);
      
//       encoderTmp.encode()
//         .then(() => {
//           console.log('direct (buffer based) mp3 encoding over')
//         });
//       }
//   });


// loadAudioBuffer(fileName + '.wav').then( (audioBufferArray) => {
//   let audioBuffer = audioBufferArray[0];
//   let id3 = audioBufferArray[1];
  
//   // encode from buffer to file
//   const encoder = new Lame({
//     "output": fileName + '-split.mp3',
//     "bitrate": 128
//   })

//   // slice audio buffer
//   let numSamples = audioBuffer.sampleRate * 2.0;
//   let outputBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, numSamples, audioBuffer.sampleRate);
//   for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
//     outputBuffer.getChannelData(ch).set( audioBuffer.getChannelData(ch).slice( 0, numSamples ) );  
//   }
//   console.log('duration encoded chunk:', outputBuffer.duration);
//   let typedArray = outputBuffer.getChannelData(0);

//   // typedArray = Float32Array.from( typedArray.data );
//   // var toBuffer = require('typedarray-to-buffer')
//   // let bufferTmp = toBuffer( typedArray );
//   let bufferTmp = Buffer.from( typedArray.buffer );
//   let bufferTot = Buffer.concat( [id3, bufferTmp], id3.length + bufferTmp.length )
//   console.log( 'converted buffer: \n',  bufferTot.slice(70, 100) );

//   encoder.setBuffer(bufferTot);

//   // console.log(encoder)
//   encoder.encode()
//     .then(() => {
//       console.log('indirect (audio buffer based) mp3 encoding over')
//     })
//     .catch((err) => {
//       console.error(err);
//     });  


// }, (err) => { console.error(err); });



// // read file from disk, return audio buffer in promise
// function loadAudioBuffer(fileName) {
//   const promise = new Promise((resolve, reject) => {
//     fs.readFile(fileName, (error, buffer) => {
//       // skip if cannot find file
//       if (error) { 
//         reject(error);
//         return; 
//       }
//       // decode file data to audio buffer

//       // get id3 tag
//       var id3 = buffer.slice(0, 76);
//       console.log('orig buffer:', buffer.length, 'id3 buffer:', id3.length)
//       audioContext.decodeAudioData(buffer, (audioBuffer) => {
//         resolve([audioBuffer, id3]); },
//         (error) => { reject(error); });
//     });
//   });
//   return promise;
// }