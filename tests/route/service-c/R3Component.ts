import createLogger from 'logging';
const logger = createLogger('R3Component');

import { TxMountPoint, TxRoutePointRegistry, TxRouteServiceTask } from 'rx-txjs';

export class R3Component {
  private mountpoint: TxMountPoint;
  private config = {
      host: 'localhost',
      port: 3003,
      method: 'get',
      service: 'sanity',
      route: 'save'
  };

  constructor() {
    // don't use create here, create is for client side, route create the internally express route
    this.mountpoint = TxRoutePointRegistry.instance.route('SERVICE-C::R3', this.config);

    this.mountpoint.tasks().subscribe(
    (task: TxRouteServiceTask<any>) => {
      console.log('[R3Component::subscribe] subscribe called, task:', JSON.stringify(task.get(), undefined, 2));

      task.reply().next(new TxRouteServiceTask<any>({
        headers: {
          source: 'service-c::R3Component',
          token: '123456780ABCDEF'
        },
        response: {
          status: 200,
          type: 'json'
        }},
        {
          source: 'service-c::R3Component', status: "ok"
        }
      ));      
    });

  }

}
