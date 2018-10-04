import Protocol from './protocol';

export default class RawProtocol extends Protocol {
  /**
   * Listen for transport messages
   *
   * @return void
   */
  listen() {
    this.transport.on('message', (message) => {
      this.emit('message', message);
    });
  }
}
