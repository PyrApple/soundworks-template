import * as soundworks from 'soundworks/client';

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <div class="foreground">
    <div class="section-top flex-middle">
      <p class="big">Tunneling test</p>
    </div>
    <div class="section-center flex-center">
      <button class="btn" id="send-msg">Send websocket message</button>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

export default class PlayerExperience extends soundworks.Experience {
  constructor() {
    super();

    this._sendMessage = this._sendMessage.bind(this);
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewCtor = soundworks.SegmentedView;
    this.viewEvents = { 'click #send-msg': this._sendMessage };
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    this.receive('load:message', (data) => {
      console.log('RECEIVED "load:message" with data:', data)
    });
  }

  _sendMessage() {
    const data = [Math.random(), Math.random()];
    this.send('btn:message', data);
    console.log('SENT "btn:message" with data:', data);
  }
}
