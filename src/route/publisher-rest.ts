
import createLogger from 'logging';
const logger = createLogger('Route-Publication-REST');
//import { logger } from '../utils';

import * as express from 'express';
import * as util from 'util';
import axios from 'axios';

import { TxRouteServiceConfig, TxPublisher, TxRoutePointRegistry, TxJobRegistry } from 'rx-txjs';
import { PublisherRESTEndPoint, PublisherRESTTask } from '../common/publisher-rest-endpoint';
import { utils } from '../utils';
import Summary from './redux/summary';
import { CallAxiosConfig } from '../common/call-exios-config';
import { NodeCommonCallback } from './../common/callbacks';
import { PublisherRESTService } from './publisher-rest.service';

export class PublisherREST implements TxPublisher {    
  public static _instance: PublisherREST = null;

  private routepoints = new Map<string, TxRouteServiceConfig>();
  private endpoints = new Array<PublisherRESTEndPoint>();  

  constructor() {
  }

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  setApplication(app: express.Application, config: PublisherRESTEndPoint) {
    TxRoutePointRegistry.instance.setApplication(app)
    TxRoutePointRegistry.instance.setPublisher(this);

    logger.info(`[PublisherREST::setApplication] set application of ${config.name} with route ${config.route}`);        
    app.use(config.route, (new PublisherRESTService())(this.routepoints));

    Summary.dispatch(Summary.consts.START, config.name);
    this.endpoints.forEach(ep => Summary.dispatch(Summary.consts.ADD_ENDPOINT, ep));

    this.notifyAll();
  }   

  async notifyAll() {
    const allPromises = [];
    this.endpoints.forEach(async (endpoint) => {

      const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`
      const options: CallAxiosConfig = {
        method: 'get',
        timeout: 2000,
        loops: 3,
        interval: 2000,
        from: 'notifyAll',
        data: null
      }

      const promise = new Promise(async (resolve, reject) => {
        const reply = await this.notifyEndPoint(url, options);

        resolve(reply);        
      })

      allPromises.push(promise);
    });
    await Promise.all(allPromises);
  }

  async notifyEndPoint(url: string, options: CallAxiosConfig) {
    try {
      const reply = await utils.callAxios(url, options, null);
      const { success, data} = reply;
      
      if ( ! success ) {
        logger.error(`ERROR - [PublisherREST:notifyEndPoint] get fail status on url: ${url}`);  

        return {success: false, data: null};
      }

      data.forEach((component: {name: string, config: TxRouteServiceConfig }) => {
        const { name, config} = component;

        config.mode = 'client';
        TxRoutePointRegistry.instance.create(name, config);            
        Summary.dispatch(Summary.consts.ADD_COMPONENT, name);

        logger.info("[PublisherREST:notifyEndPoint] adding routepoint name:", name);
      });
      return {sucess: true, data};
    }
    catch (e) {
      logger.error(`ERROR - [PublisherREST:notifyAll] get error on url: ${url}\n${e.stack}`);
    }

    return {success: false, data: null};
  }  

  async publish(name: string, config: TxRouteServiceConfig) {
    logger.info(`[PublisherREST::publish] add routepoint: ${name} to publish list`);

    this.routepoints.set(name, config);
    const allPromises = [];

    this.endpoints.forEach(async (endpoint) => {
      const task = {routepoint: { name, config}, endpoint: endpoint, isPublish: false}
      logger.info("[PublisherREST:publish] in forEach:", endpoint.name);
      
      //allPromises.push(util.promisify(setImmediate)(this.toPublish(task)));      
      allPromises.push(util.promisify(this.doPublish)(task,  (err, data) => data));
    });

    try {
      await Promise.all(allPromises)
    }
    catch(e) {
      logger.error(`[PublisherREST:publish] ERROR on promise.all, e=\n${e.stack}`);
    }
  }

  private async doPublish(task: PublisherRESTTask, callback: NodeCommonCallback) {
    const { routepoint, endpoint } = task;     
        
    const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`;
    const options: CallAxiosConfig = {
      method: 'post',
      timeout: 2000,
      loops: 3,
      interval: 2000,
      from: 'publish',
      data: routepoint
    }      

    const data = await utils.callAxios(url, options, null); 
    
    if (data && data.success === true) {
      Summary.dispatch(Summary.consts.ADD_PUBLISH, routepoint.name);
      logger.info(`[PublisherREST:doPublish] [${endpoint.name}] reply.data: ${JSON.stringify(data)} of url: ${url}`);    
      // callback(null, data); 

      return data;
    }

    logger.info(`[PublisherREST:doPublish] [${endpoint.name}] reply.data: ${JSON.stringify(data)} of url: ${url}`);    
    callback(null, {success: false, data: null}); 
  }

  private doPublishOK_WITH_PROMISE(task: PublisherRESTTask) {
    return new Promise(async (resolve, rejact) => {      
      const { routepoint, endpoint } = task;     
          
      const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`;
      const options: CallAxiosConfig = {
        method: 'post',
        timeout: 2000,
        loops: 3,
        interval: 2000,
        from: 'publish',
        data: routepoint
      }      

      const data = await utils.callAxios(url, options, null);
      logger.info(`[PublisherREST:doPublish] [${endpoint.name}] reply.data: ${JSON.stringify(data)} of url: ${url}`);
    });    
  }

  private doPublishOLD(task: PublisherRESTTask) {
    return new Promise(async (resolve, rejact) => {      
      const { routepoint, endpoint } = task;
      const { name, config } = routepoint
          
      const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`
      const options = {
        timeout: 2000
      }

      logger.info("[PublisherREST:doPublish] on service:", endpoint.name);
      let isTring = true;
      let loops = 0;
      while (isTring && loops < 30000) {
        loops++;
        try {
          const reply = await axios.post(url, {name, config}, options);
          logger.info(`[PublisherREST:doPublish] reply.data: ${JSON.stringify(reply.data)} of url: ${url}`);
          isTring = false;
        }
        catch (e) {
          // logger.error(`[PublisherREST:doPublish] ERROR: while trying to publish: ${task.endpoint.name}\n${e.stack}`);
          logger.error(`[PublisherREST:doPublish] ERROR: while trying to publish to: ${task.endpoint.name} for routepoint: ${routepoint.name}`);
          await utils.sleep(2000);
        }
      }

    });

    // return await task.endpoint.name;
  }

  addEndPoint(endpoint: PublisherRESTEndPoint) {
    this.endpoints.push(endpoint);
  }

  getState() {
    Summary.getState();
  }
}

