import { Experience } from 'soundworks/server';
import AudioStreamer from './AudioStreamer';

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
    // this.wav2mp3();   
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