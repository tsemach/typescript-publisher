import * as express from 'express';

import { TxPublisher } from './tx-publisher';
import { TxRouteServiceConfig } from './tx-route-service-config';

/**
 * This is publisher client side using REST.
 * 
 * Needed configuration:
 *  host - host address of the publishcation server 
 *  port - post number of the publishcation server
 *  receiving path - the route where publication messages are coming in.
 *  publish path - the route on the where to send publish messages.
 */
export interface TxPublisherRESTConfig {
  host: string;
  port: string;
  route: string;  
  publish: string;
}

export class TxPublisherREST implements TxPublisher {  
  constructor(app: express.Application, config: TxPublisherRESTConfig) {
    let router = express.Router();

    router.post(config.route, (req, res, next) => {
            
    });

    app.use(config.route, router);
  }

  publish(name: string, config: TxRouteServiceConfig): void {
    throw new Error("Method not implemented.");
  }

}

