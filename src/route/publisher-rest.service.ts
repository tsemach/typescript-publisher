
import createLogger from 'logging';
const logger = createLogger('Route-Publication-REST-Service');
//import { logger } from '../utils';

import * as express from 'express';

import { TxRouteServiceConfig, TxRoutePointRegistry } from 'rx-txjs';
import { Callable } from '../utils/';
import Summary from './redux/summary';

export class PublisherRESTService extends Callable {
    
  __call__(_routepoints: Map<string, TxRouteServiceConfig>) {
    let router = express.Router();

    //------------------------------------------------------------------------------------------------------------
    /**
     * this route return all my routepoints, when other service is up it initiate a get request 
     * to get all my routepoints
     */
    router.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { host, port, route } = req.query;
      logger.info("[PublisherRESTService::POST] got post request - req.query=", JSON.stringify(req.query, undefined, 2));
      
      const routepoints = [];
      for(let [key, val] of _routepoints.entries()) {
        routepoints.push({name: key, config: val});
      }
      logger.info("[PublisherRESTService::POST] going to reply routepoints.length=", routepoints.length);
      
      res.json({success: true, data: routepoints});
    });
    //------------------------------------------------------------------------------------------------------------
    /**
     * this route is to add to me other service routepoint. 
     * the body include {name, config} of the routepoint. 
     */
    router.post('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {      
      logger.info("[PublisherRESTService::POST] got post request - req.body=", JSON.stringify(req.body, undefined, 2));
      const { name, config } = req.body;

      config.mode = 'client';
      TxRoutePointRegistry.instance.create(name, config);

      res.json({success: true});
    });
    //------------------------------------------------------------------------------------------------------------
    /**
     * this route is to add to me other service routepoint. 
     * the body include {name, config} of the routepoint. 
     */
    router.get('/summary', (req: express.Request, res: express.Response, next: express.NextFunction) => {      
      logger.info("[PublisherRESTService::get/summary] got post summaryrequest");      
      
      const reply = JSON.stringify({success: true, data: Summary.getState()}, undefined, 2);
      res.send(reply);
    });
    //------------------------------------------------------------------------------------------------------------

    return router;
  }

}

