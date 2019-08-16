
import createLogger from 'logging';
const logger = createLogger('Route-Publication-REST-Service');

import * as express from 'express';

import { TxRouteServiceConfig, TxRoutePointRegistry, TxRoutePoint } from 'rx-txjs';
import { Callable } from '../utils/';
import Summary from './redux/summary';
import { PublisherRESTEndPoint } from '../common/publisher-rest-endpoint';

export class PublisherRESTService extends Callable {
  
  __call__(_routepoints: Map<string, TxRouteServiceConfig>, _config: PublisherRESTEndPoint) {    
    let router = express.Router();

    //------------------------------------------------------------------------------------------------------------
    /**
     * this route return all my routepoints, when other service is up it initiate a get request 
     * to get all my routepoints
     */
    router.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { host, port, route } = req.query;
      logger.info(`[${_config.name}] [PublisherRESTService::GET:/] got get routepoints request - req.query= ${JSON.stringify(req.query, undefined, 2)}`);
      
      const routepoints = [];
      for(let [key, val] of _routepoints.entries()) {
        routepoints.push({name: key, config: val});
      }
      logger.info(`[${_config.name}] [PublisherRESTService::GET:/] going to reply routepoints.length=${routepoints.length}`);
      
      res.json({success: true, data: routepoints});
    });
    //------------------------------------------------------------------------------------------------------------
    /**
     * this route is to add to me other service routepoint. 
     * the body include {name, config} of the routepoint. 
     */
    router.post('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {      
      logger.info(`[${_config.name}] [PublisherRESTService::POST:/] got post request - req.body = ${JSON.stringify(req.body, undefined, 2)}`);
      const { name, config } = req.body;

      config.mode = 'client';
      TxRoutePointRegistry.instance.create(name, config);

      res.json({success: true});
    });
    //------------------------------------------------------------------------------------------------------------
    /**
     * This route is to check if a routepoint of name is exist in my routepoint registry.
     * If so return it's config
     */
    router.get('/discovery', async (req: express.Request, res: express.Response, next: express.NextFunction) => {      
      logger.info(`[${_config.name}] [PublisherRESTService::GET:/discovery] going to discover if routepoint of '${req.query.name} exist on my registry`);      
      
      if (TxRoutePointRegistry.instance.has(req.query.name)) {
        logger.info(`[${_config.name}] [PublisherRESTService::GET:/discovery] found routename of name: '${req.query.name}`);
        const rp = <TxRoutePoint>(await TxRoutePointRegistry.instance.get(req.query.name));

        res.json({success: true, config: rp.getConfig()});

        return;
      }
      res.json({success: false});
    });
    //------------------------------------------------------------------------------------------------------------
    /**
     * this route is to add to me other service routepoint. 
     * the body include {name, config} of the routepoint. 
     */
    router.get('/summary', (req: express.Request, res: express.Response, next: express.NextFunction) => {      
      logger.info(`[${_config.name}] [PublisherRESTService::GET:/summary] got post summary request`);
      
      const reply = JSON.stringify({success: true, data: Summary.getState()}, undefined, 2);
      res.send(reply);
    });
    //------------------------------------------------------------------------------------------------------------
  
    return router;
  }  

}

