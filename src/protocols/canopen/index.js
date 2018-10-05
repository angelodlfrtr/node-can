import Protocol from '../protocol';
import * as dic from './dic';
import Network from './network';

export default class CanOpenProtocol extends Protocol {
  /**
   * @constructor
   */
  constructor(transport) {
    super(transport);

    this.dic = dic;
    this.network = null;
  }

  /**
   * Listen for transport messages
   *
   * @return void
   */
  listen() {
    this.network = new Network(this.transport);
    this.network.start();
  }
}
