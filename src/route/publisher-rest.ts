
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
import { TxRoutpointIndicator } from 'rx-txjs/dist/src/tx-routepint-indicator';

export class PublisherREST implements TxPublisher {
  public static _instance: PublisherREST = null;

  private routepoints = new Map<string, TxRouteServiceConfig>();
  private endpoints = new Array<PublisherRESTEndPoint>();  
  private config: PublisherRESTEndPoint;

  constructor() {
  }

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  setApplication(app: express.Application, config: PublisherRESTEndPoint) {
    this.config = config;    

    TxRoutePointRegistry.instance.setApplication(app)
    TxRoutePointRegistry.instance.setPublisher(this);
    
    logger.info(`${this.prefix('setApplication')} set application of ${config.name} with route ${config.route}`);
    app.use(config.route, (new PublisherRESTService())(this.routepoints, config));

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
        from: `[${this.getName()}] [notifyAll]`,
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
        logger.error(`${this.prefix('notifyEndPoint')} ERROR - get fail status on url: ${url}`);

        return {success: false, data: null};
      }

      data.forEach((component: {name: string, config: TxRouteServiceConfig }) => {
        const { name, config} = component;

        config.mode = 'client';
        TxRoutePointRegistry.instance.create(name, config);            
        Summary.dispatch(Summary.consts.ADD_COMPONENT, name);

        logger.info(`${this.prefix('notifyEndPoint')} adding routepoint name: ${name}`);
      });
      return {sucess: true, data};
    }
    catch (e) {
      logger.error(`${this.prefix('notifyEndPoint')} ERROR - get error on url: ${url}\n${e.stack}`);
    }

    return {success: false, data: null};
  }  

  async publish(name: string, config: TxRouteServiceConfig) {
    logger.info(`${this.prefix('publish')} add routepoint: ${name} to publish list`);

    this.routepoints.set(name, config);
    const allPromises = [];

    this.endpoints.forEach(async (endpoint) => {
      const task = {routepoint: { name, config}, endpoint: endpoint, isPublish: false}      
      allPromises.push(util.promisify(this.doPublish.bind(this))(task, (err: any, data: any) => data));
    });

    try {
      await Promise.all(allPromises)
    }
    catch(e) {
      logger.error(`${this.prefix('publish')} ERROR on promise.all, e=\n${e.stack}`);
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
      Summary.dispatch(Summary.consts.ADD_PUBLISH, {component: routepoint.name, service: endpoint.name});
      logger.info(`${this.prefix('discovery')} [${endpoint.name}] reply.data: ${JSON.stringify(data)} of url: ${url}`);
      // callback(null, data); 

      return data;
    }

    logger.info(`${this.prefix('discovery')} [${endpoint.name}] reply.data: ${JSON.stringify(data)} of url: ${url}`);    
    callback(null, {success: false, data: null}); 
  }
  
  async discover(name: string | Symbol): Promise<TxRoutpointIndicator> {
    logger.info(`${this.prefix('discovery')} going to discover routepoint '${name}'`);
        
    const allPromises = [];
    for (let i = 0; i < this.endpoints.length; i++) {      
      allPromises.push(this.doDiscover.bind(this)(name, this.endpoints[i]));
      //const indicator = await this.doSiscover(name, this.endpoints[i]);    
    }
    const indicators: TxRoutpointIndicator[] = await Promise.all(allPromises);
    for (let i = 0; i < indicators.length; i++) {
      if (indicators[i].config) {
        return indicators[i]
      }
    }
    return {name, config: null};    
  }

  async doDiscover(name: string | Symbol, endpoint: PublisherRESTEndPoint): Promise<TxRoutpointIndicator> {    
    logger.info(`${this.prefix('doDiscovery')} going to discover routepoint '${name}'`);
    
    const { host, port, route } = endpoint;     
        
    const url = `http://${host}:${port}${route}/discover?name=${name}`;
    const options: CallAxiosConfig = {
      method: 'get',
      timeout: 2000,
      loops: 3,
      interval: 2000,
      from: '/v1/publish',      
    }      

    const data = await utils.callAxios(url, options, null);         
    if (data && data.success === true) {
      logger.info(`${this.prefix('discovery')} [${endpoint.name}] find routepoint of name: ${name}`);
            
      return {name, config: data} as TxRoutpointIndicator;
    }

    return {name, config: null} as TxRoutpointIndicator     
  }    

  addEndPoint(endpoint: PublisherRESTEndPoint) {
    this.endpoints.push(endpoint);
  }

  getState() {
    return Summary.getState();
  }

  getName() {
    return this.config.name;
  }

  prefix(from: string) {
    return `[PublisherREST::${from}] [${this.getName()}]`
  }
}

