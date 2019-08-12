import createLogger from 'logging';
const logger = createLogger('R1Component');

import { TxMountPoint, TxRoutePointRegistry, TxRouteServiceTask } from 'rx-txjs';

export class R3Component {
  private mountpoint: TxMountPoint;
  private config = {
      host: 'localhost',
      port: 3001,
      method: 'get',
      service: 'sanity',
      route: 'save'
  };

  constructor() {
    // don't use create here, create is for client side, route create the internally express route
    this.mountpoint = TxRoutePointRegistry.instance.route('SERVICE-A::R3', this.config);

    this.mountpoint.tasks().subscribe(
    (task: TxRouteServiceTask<any>) => {
      console.log('[R1Component::subscribe] subscribe called, task:', JSON.stringify(task.get(), undefined, 2));

      task.reply().next(new TxRouteServiceTask<any>({
        headers: {
          source: 'service-a::R3Component',
          token: '123456780ABCDEF'
        },
        response: {
          status: 200,
          type: 'json'
        }},
        {
          source: 'service-a::R3Component', status: "ok"
        }
      ));      
    });

  }

}
