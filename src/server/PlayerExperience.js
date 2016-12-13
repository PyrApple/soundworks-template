import { Experience } from 'soundworks/server';

export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);
  }

  enter(client) {
    super.enter(client);

    const data = [Math.random(), Math.random()];
    this.send(client, 'load:message', data);
    console.log('SENT "load:message" with data:', data)

    this.receive(client, 'btn:message', (data) => {
      console.log('RECEIVED "btn:message" with data:', data);
    });
  }

  exit(client) {
    super.exit(client);
  }
}
