import createLogger from 'logging';
const logger = createLogger('Service-B-R2Component');

import { TxMountPoint, TxRoutePointRegistry, TxRouteServiceTask } from 'rx-txjs';

export class R2Component {
  private mountpoint: TxMountPoint;
  private config = {
      host: 'localhost',
      port: 3002,
      method: 'get',
      service: 'R2Component',
      route: 'save'
  };

  constructor() {
    // don't use create here, create is for client side, route create the internally express route
    this.mountpoint = TxRoutePointRegistry.instance.route('SERVICE-B::R2', this.config);

    this.mountpoint.tasks().subscribe(
    (task: TxRouteServiceTask<any>) => {
      logger.info('[R2Component::subscribe] subscribe called, task:', JSON.stringify(task.get(), undefined, 2));

      task.reply().next(new TxRouteServiceTask<any>({
        headers: {
          source: 'service-b::R2Component',
          token: '123456780ABCDEF'
        },
        response: {
          status: 200,
          type: 'json'
        }},
        {
          source: 'service-b::R2Component', 
          status: "ok",
          originData: task.getData()
        }
      ));      
    });

  }

}
