/** 
* TODO:
**/

////////////////////////////////////////////////////////
// UTILS FUNCTIONS 
////////////////////////////////////////////////////////

// load an audio buffer from server's disk (based on XMLHttpRequest)
function loadAudioBuffer( chunkName ){
  const promise = new Promise( (resolve, reject) => {
    // create request
    var request = new XMLHttpRequest();
    request.open('GET', tmpPath + chunkName, true);
    request.responseType = 'arraybuffer';
    // define request callback
    request.onload = () => {
      audioContext.decodeAudioData(request.response, (buffer) => {
        resolve(buffer);
      }, (e) => { reject(e); 
      });
    }
    // send request
    request.send();
  });
  return promise;
}

////////////////////////////////////////////////////////
// HEADER
////////////////////////////////////////////////////////

// import
import * as soundworks from 'soundworks/client';

// define constants
const audioContext = soundworks.audioContext;
const STREAM_MONITOR_INTERVAL_MS = 1000; // in ms
const NUM_CHUNK_IN_ADVANCE = 4; // S.I.
const CHUNK_DURATION = 4; // in sec
const tmpPath = __dirname + '/../../../tmp/';

////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////

export default class AudioStream {
  constructor( experience ){
    this.e = experience;

    // local attr.
    this._sync = false;
    this._loop = false;
    this._metaData = undefined;
    this._out = audioContext.createGain();

    // stream monitoring
    this._chunkRequestCallbackInterval = undefined;
    this._srcMap = new Map();
    this._reset();
    
    // bind
    this._chunkRequestCallback = this._chunkRequestCallback.bind(this);
  }

  /**
  * init / reset local attributes (at stream creation and stop() )
  **/
  _reset(){
    // remember start parameters
    this._offset = 0;
    this._duration = undefined;
    this._when = undefined;
    
    // stream monitoring
    this._ctxStartTime = -1;
    this._ctxLastBufferStartTime = -1;
    this._unsyncStartOffset = -1;

    // handle meta data
    this._awaitsMetaData = false;
    this._shouldStartUponMetaDataReception = false;
  }

  /**
  * define soundworks msg receive callbacks
  **/
  init(){
    // callbacks: receive metadata
    this.e.receive('stream:metaData', ( metaData ) => {
      console.log('received meta data:', metaData);
      // update metaData
      this._metaData = metaData;
      this._awaitsMetaData = false;
      // start if requested while awaiting for metaData
      if( this._shouldStartUponMetaDataReception ){
        this.start( this._when, this._offset, this._duration );
        this._shouldStartUponMetaDataReception = false;
      }
    });

    // callbacks: receive chunk is ready
    this.e.receive('stream:chunkReady', ( chunkName, startTime ) => {
      loadAudioBuffer(chunkName).then( (buffer) => {
        // add buffer to queue
        this._addBufferToQueue( buffer, startTime );
        // delete chunk
        this.e.send('stream:deleteChunk', chunkName);        
      });        
    });
  }

  /** 
  * define url of audio file to stream, send meta data request to server
  * concerning this file
  **/ 
  set url( fileName ){
    // clear current meta data
    this._awaitsMetaData = true;
    this._metaData = undefined;
    // ask server for file metadata
    this.e.send( 'stream:metaData', fileName );
  }

  /**
  * enable / disable synchronized mode. in non sync. mode, the stream audio
  * will start whenever the first audio buffer is downloaded. in sync. mode, 
  * the stream audio will start (again asa the audio buffer is downloaded) 
  * with an offset in the buffer, as if it started playing exactly when the 
  * start() command was issued
  **/
  set sync(val){
    this._sync = val;
  }

  /**
  * set loop mode
  **/
  set loop(val){
    this._loop = val;
  }  

  /**
  * connect audio stream to an audio node
  **/
  connect( node ){
    this._out.connect(node);
  }

  /** 
  * micmics AudioBufferSourceNode start() method (yet when is absolute from "now")
  **/
  start(when = 0, offset = 0, duration){
    // copy params for later (to re-call start whenever first buffer arrives)
    this._offset = offset;
    this._duration = duration;
    this._when = when;
    // init local time flags
    this._ctxStartTime = this.e.sync.getSyncTime() + when;
    this._ctxLastBufferStartTime = this._ctxStartTime;
    // check if we dispose of valid metaData to execute start
    if( this._metaData === undefined ){
      // request sent, awaiting server response
      if( this._awaitsMetaData ){ this._shouldStartUponMetaDataReception = true; }
      // skip if no meta data present nor requested
      else{ console.warn('start command discarded, must define valid url first'); }
      return;
    }
    // make sure offset requested is valid
    if( offset >= this._metaData.length / this._metaData.sampleRate ){
      console.warn('offset of', offset, 'sec larger than file duration of',
        this._metaData.length / this._metaData.sampleRate, 'sec');
      return;
    }
    // start stream request chunks callback
    this._chunkRequestCallbackInterval = setInterval( this._chunkRequestCallback, STREAM_MONITOR_INTERVAL_MS );
  }

  /** 
  * check if we have enought "local buffer time" for the audio stream, 
  * request new buffer chunks otherwise
  **/
  _chunkRequestCallback(){

    console.log( this._ctxLastBufferStartTime, this.e.sync.getSyncTime());
    
    // prepare while loop
    let timeThreshold = NUM_CHUNK_IN_ADVANCE * CHUNK_DURATION;
    let noLoopAndNeedToStop = false;

    // while loop: do we need to request more chunks? if so, do, increment time flag, ask again
    while( this._ctxLastBufferStartTime - this.e.sync.getSyncTime() <= timeThreshold ){

      // if we do, estimate time offset in buffer required
      let offset = this._offset + this._ctxLastBufferStartTime - this._ctxStartTime;
      
      // if no loop and reached the last chunk
      let chunkDuration = CHUNK_DURATION;
      if( !this._loop && offset >= (this._metaData.length / this._metaData.sampleRate) - CHUNK_DURATION ){
        // reduce chunk duration
        chunkDuration = this._metaData.length / this._metaData.sampleRate - offset;
        noLoopAndNeedToStop = true;
      }
      // modulo of offset time for loop scenarios
      else{ offset %= this._metaData.length / this._metaData.sampleRate; }
      console.log('require new chunk starting at', offset, 'sec in buffer, due to start at', this._ctxLastBufferStartTime);
      
      // skip request if buffer time already deprecated (e.g. if meta data took too much time to arrive)
      if( this._sync && this._ctxLastBufferStartTime <= this.e.sync.getSyncTime() ){
          console.log('skip deprecated buffer:', this._ctxLastBufferStartTime, this.e.sync.getSyncTime());
          // increment of a short time current read pointer to request a useful buffer without waiting a full CHUNK_DURATION
          this._ctxLastBufferStartTime = this.e.sync.getSyncTime() + 0.1;
      }
      // send stream request
      else{
        this.e.send('stream:requestChunk', this._metaData.fileName, offset, this._ctxLastBufferStartTime, chunkDuration);
        // increment "running time"
        this._ctxLastBufferStartTime += CHUNK_DURATION;        
      }

      // check for end of file and no loop scenario
      if( noLoopAndNeedToStop ){
        console.log('stop planned', this._ctxLastBufferStartTime);
        // end (without stopping sources) stream mechanism
        this._drop();
        // break from wihle loop
        return;
      }
    }
  }

  /**
  * add audio buffer stream play queue
  **/
  _addBufferToQueue( buffer, startTime ){
    // estimate system start time
    let relativeSystemStartTime = startTime - this.e.sync.getSyncTime();
    
    // non sync scenario: should play whole first buffer when downloaded
    if( !this._sync ){
      // first packet: keep track off init offset
      if( this._unsyncStartOffset < 0 ){
        this._unsyncStartOffset = relativeSystemStartTime;
      }
      relativeSystemStartTime -= this._unsyncStartOffset;
    }

    console.log( 'add buffer to queue starting at', startTime, 'i.e. in', relativeSystemStartTime, 'seconds' );

    // create audio source
    let src = audioContext.createBufferSource();
    src.buffer = buffer;
    // connect graph
    src.connect( this._out );
    
    // start source now (not from beginning since we're already late)
    const now = audioContext.currentTime;
    if( relativeSystemStartTime < 0 ){  src.start(now, -relativeSystemStartTime);  }
    // start source delayed (from beginning in abs(relativeSystemStartTime) seconds)
    else{ src.start(now + relativeSystemStartTime, 0); }
    // keep ref. to source
    this._srcMap.set( startTime, src);
    // source removes itself from locals when ended
    src.onended = () => { this._srcMap.delete( startTime ); };
  }

  /** 
  * micmics AudioBufferSourceNode stop() method
  **/
  stop(when = 0){
    this._drop();
    // kill sources
    this._srcMap.forEach( (src, startTime) => {
      // if source due to start after stop time
      if( startTime >= this.e.sync.getSyncTime() + when ){ src.stop(); }
      // if source will be the one playing when stop is due
      else if( startTime - this.e.sync.getSyncTime() < when && startTime >= this.e.sync.getSyncTime() ){
        src.stop(audioContext.currentTime + when);
      }      
    });
  }

  /**
  * local stop: end streaming requests, clear streaming callbacks, etc.
  * in short, stop all but stop the audio sources, to use _drop() rather 
  * than stop() in "audio file over and not loop" scenario
  **/
  _drop(){
    // reset local values
    this._reset();
    // no need to stop if not started
    if( this._chunkRequestCallbackInterval === undefined ){
      console.warn('stop discarded, must start first');
      return;
    }
    // kill callback
    clearInterval( this._chunkRequestCallbackInterval );
    this._chunkRequestCallbackInterval = undefined;    
    // notify server that stream stopped
    // this.e.send('stream:stop', client.index, fileName);
  }

}