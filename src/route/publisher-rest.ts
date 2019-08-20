
import createLogger from 'logging';
const logger = createLogger('Publication-REST');
//import { logger } from '../utils';

import * as express from 'express';
import * as util from 'util';
import * as _ from 'lodash';

import { TxRouteServiceConfig, TxPublisher, TxRoutePointRegistry } from 'rx-txjs';
import { PublisherRESTEndPointConfig, PublisherRESTTask } from '../common/publisher-rest-endpoint';
import { utils } from '../utils';
import Summary from './redux/summary';
import { CallAxiosConfig } from '../common/call-exios-config';
import { NodeCommonCallback } from './../common/callbacks';
import { PublisherRESTService } from './publisher-rest.service';
import { TxRoutpointIndicator } from 'rx-txjs/dist/src/tx-routepint-indicator';

export class PublisherREST implements TxPublisher {
  public static _instance: PublisherREST = null;

  private routepoints = new Map<string, TxRouteServiceConfig>();
  private endpoints = new Array<PublisherRESTEndPointConfig>();  
  private config: PublisherRESTEndPointConfig;

  constructor() {
  }

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  async setApplication(app: express.Application, config: PublisherRESTEndPointConfig) {
    this.config = config;    

    TxRoutePointRegistry.instance.setApplication(app)
    TxRoutePointRegistry.instance.setPublisher(this);
    
    logger.info(`${this.prefix('setApplication')} set application of ${config.name} with route ${config.route}`);
    app.use(config.route, (new PublisherRESTService())(this.routepoints, config));

    Summary.dispatch(Summary.consts.START, config.name);
    this.endpoints.forEach(ep => Summary.dispatch(Summary.consts.ADD_ENDPOINT, ep));

    await this.notifyAll();
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

        if (reply.success !== true) {
          reject(reply);

          return;
        }
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
      return {success: true, data};
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
      const task: PublisherRESTTask = {routepoints: [ { name, config} ], endpoint: endpoint, isPublish: false}      
      allPromises.push(util.promisify(this.doPublish.bind(this))(task));
    });

    try {
      await Promise.all(allPromises)
    }
    catch(e) {
      logger.error(`${this.prefix('publish')} ERROR on promise.all, e=\n${e.stack}`);
    }
    logger.info(`${this.prefix('publish')} complete publishing routepoint: ${name}`);
  }

  private async doPublish(task: PublisherRESTTask, callback: NodeCommonCallback) {
    const { routepoints, endpoint } = task;     
        
    const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`;
    const options: CallAxiosConfig = {
      method: 'post',
      timeout: 2000,
      loops: 3,
      interval: 2000,
      from: 'publish',
      data: routepoints
    }      

    const data = await utils.callAxios(url, options, null);     
    if (data && data.success === true) {
      routepoints.forEach(routepoint => Summary.dispatch(Summary.consts.ADD_PUBLISH, {component: routepoint.name, service: endpoint.name}));
      logger.info(`${this.prefix('doPublish')} publish ${JSON.stringify(routepoints)} to [${endpoint.name}] success === true reply.data: ${JSON.stringify(data)} use url: ${url}`);
      callback(null, data); 

      return;
    }

    logger.error(`${this.prefix('doPublish')} publish ${JSON.stringify(routepoints)} to [${endpoint.name}] failed to publish, reply.data: ${JSON.stringify(data)} use url: ${url}`);
    callback({success: false, data: null}, null); 
  }
  
  async discover(name: string | Symbol): Promise<TxRoutpointIndicator> {
    logger.info(`${this.prefix('discovery')} going to discover routepoint '${name}'`);
        
    const allPromises = [];
    for (let i = 0; i < this.endpoints.length; i++) {            
      allPromises.push(util.promisify(this.doDiscover.bind(this))(name, this.endpoints[i]));
    }
    const indicators: TxRoutpointIndicator[] = await Promise.all(allPromises);
    
    for (let i = 0; i < indicators.length; i++) {
      if (indicators[i].config) {
        Summary.dispatch(Summary.consts.ADD_DISCOVER, {component: indicators[i].name, service: this.endpoints[i].name});
        return indicators[i];
      }
    }
    return {name, config: null};
  }

  private async doDiscover(name: string | Symbol, endpoint: PublisherRESTEndPointConfig, callback: NodeCommonCallback) {    
    logger.info(` [${endpoint.name}] ${this.prefix('doDiscover')} ${endpoint.name} need to discover routepoint '${name}'`);
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
      logger.info(`[${endpoint.name}] ${this.prefix('doDiscover')} find routepoint of name: ${name} on ${url} with config ${JSON.stringify(data.config)}`);
      callback(null, {name, config: data.config} as TxRoutpointIndicator);

      return;
    }    
    callback({name, config: null} as TxRoutpointIndicator, null);
  }    

  async addEndPoint(endpoint: PublisherRESTEndPointConfig, isNotifyAll = false) {
    if (_.find(this.endpoints, endpoint)) {
      logger.warn(`${this.prefix('addEndPoint')} is already exist in this.endpoints`);
      
      return;
    }    
    this.endpoints.push(endpoint);

    if ( ! isNotifyAll ) {
      return;
    }

    const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`;
    const options: CallAxiosConfig = {
      method: 'get',
      timeout: 2000,
      loops: 3,
      interval: 2000,
      from: `[${this.getName()}] [addEndPoint]`,
      data: null
    }
    
    const reply = await this.notifyEndPoint(url, options);        
    logger.info(`${this.prefix('addEndPoint')} got reply on notify endpoint success: ${reply.success}`);
    
    const task: PublisherRESTTask =  {routepoints: this.routePointsToArray(), endpoint, isPublish: false};
    try {
      logger.info(`${this.prefix('addEndPoint')} going to publish ${endpoint.name} with my routepoints, ${task.routepoints.length}`);
      const reply = await util.promisify(this.doPublish.bind(this))(task);

      return {success: reply.success};
    }
    catch (e) {
      logger.error(`${this.prefix('addEndPoint')} failed publish ${endpoint.name} with my routepoints, ${task.routepoints.length}`);

      return {success: false};
    }
  }

  private routePointsToArray() {
    let routespoints = new Array<TxRoutpointIndicator>();
    for (let [name, config]  of this.routepoints[Symbol.iterator]()) {
      routespoints.push({name, config});
    }

    return routespoints;
  }

  getEndPoint(name: string) {
    return _.find(this.endpoints, {name});
  }

  getState() {
    return Summary.getState();
  } 

  getName() {
    return this.config ? this.config.name : '';
  }

  prefix(from: string) {
    const name = this.config ? `[${this.getName()}]` : '';

    return `${name} [PublisherREST::${from}]`
  }
}

