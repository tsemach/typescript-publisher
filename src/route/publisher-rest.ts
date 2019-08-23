
import createLogger from 'logging';
const logger = createLogger('Publication-REST');
//import { logger } from '../utils';

import * as express from 'express';
import * as util from 'util';
import * as _ from 'lodash';

import { TxRouteServiceConfig, TxPublisher, TxRoutePointRegistry, TxMountPointRegistry, TxTask } from 'rx-txjs';
import { PublisherRESTEndPointConfig, PublisherRESTTask } from '../common/publisher-rest-endpoint';
import { utils } from '../utils';
import Summary from './redux/summary';
import { CallAxiosConfig } from '../common/call-exios-config';
import { NodeCommonCallback } from './../common/callbacks';
import { PublisherRESTService } from './publisher-rest.service';
import { PublisherRESTEndPointComponent } from './components/publisher-rest-endpoint.component';
import { TxRoutpointIndicator } from 'rx-txjs/dist/src/tx-routepint-indicator';
import { PublisherRESTTaskHead } from '../common/publisher-rest-task-head';

export class PublisherREST implements TxPublisher {
  public static _instance: PublisherREST = null;

  private routepoints = new Map<string, TxRouteServiceConfig>();
  private endpoints = new Map<string, PublisherRESTEndPointConfig>();
  private config: PublisherRESTEndPointConfig;

  constructor() {
  }

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  setApplication(app: express.Application, config: PublisherRESTEndPointConfig) {
    this.config = config;    

    TxRoutePointRegistry.instance.setApplication(app)
    TxRoutePointRegistry.instance.setPublisher(this);
    
    logger.info(`${this.prefix('setApplication')} set application of ${config.name} with route ${config.route}`);
    app.use(config.route, (new PublisherRESTService())(this.routepoints, config));

    Summary.dispatch(Summary.consts.START, config.name);    
  }   

  publish(name: string, config: TxRouteServiceConfig) {
    logger.info(`${this.prefix('publish')} add routepoint: ${name} to publish list`);

    this.routepoints.set(name, config);
    //for (let [endPointName, endpoint] of this.endpoints[Symbol.iterator]()) {
    for (let endPointName of this.endpoints.keys()) {
      const mp = TxMountPointRegistry.instance.get(endPointName);
      
      mp.tasks().next(new TxTask<PublisherRESTTaskHead>({method: 'publish', source: 'publisher-rest'}, {name, config}));
    }

    logger.info(`${this.prefix('publish')} completed send to all endpoints publish request of routepoint: ${name}`);
  }

  async discover(name: string | Symbol): Promise<TxRoutpointIndicator> {
    logger.info(`${this.prefix('discover')} going to discover routepoint '${name}'`);
        
    const sendDiscover = (endPointName: string, callback: NodeCommonCallback) => {      
      const mp = TxMountPointRegistry.instance.get(endPointName);

      mp.reply().subscribe(
        (task: TxTask<any>) => {
          const  { head, data } = task.get();

          logger.info(`${this.prefix('discover')} endpoint: ${head.source} reply with data: ${JSON.stringify(data)}`);          
          callback(null, task.getData());
        });
      mp.tasks().next(new TxTask<PublisherRESTTaskHead>({method: 'discover', source: 'publisher-rest'}, {name}));
    }

    for (let endPointName of this.endpoints.keys()) {
      try {
        const indicator = await util.promisify(sendDiscover.bind(this))(endPointName);      
        if (indicator.config) {
          logger.info(`${this.prefix('discover')} found indicator: ${indicator.name} with config: ${indicator.config}`);
          Summary.dispatch(Summary.consts.ADD_DISCOVER, {component: indicator.name, service: endPointName});
          return indicator;
        }
      }
      catch (e) {
        logger.error(`${this.prefix('discover')} ERROR while try to discover indicator: ${name}`);

        return {name, config: null};
      }
    }

    // const allPromises = [];
    // for (let i = 0; i < this.endpoints.length; i++) {            
    //   allPromises.push(util.promisify(this.doDiscover.bind(this))(name, this.endpoints[i]));
    // }
    // const indicators: TxRoutpointIndicator[] = await Promise.all(allPromises);
    
    // for (let i = 0; i < indicators.length; i++) {
    //   if (indicators[i].config) {
    //     Summary.dispatch(Summary.consts.ADD_DISCOVER, {component: indicators[i].name, service: this.endpoints[i].name});
    //     return indicators[i];
    //   }
    // }
    return {name, config: null};
  }

  // async discover(name: string | Symbol): Promise<TxRoutpointIndicator> {
  //   logger.info(`${this.prefix('discovery')} going to discover routepoint '${name}'`);
        
  //   const allPromises = [];
  //   for (let i = 0; i < this.endpoints.length; i++) {            
  //     allPromises.push(util.promisify(this.doDiscover.bind(this))(name, this.endpoints[i]));
  //   }
  //   const indicators: TxRoutpointIndicator[] = await Promise.all(allPromises);
    
  //   for (let i = 0; i < indicators.length; i++) {
  //     if (indicators[i].config) {
  //       Summary.dispatch(Summary.consts.ADD_DISCOVER, {component: indicators[i].name, service: this.endpoints[i].name});
  //       return indicators[i];
  //     }
  //   }
  //   return {name, config: null};
  // }

  addEndPoint(endpoint: PublisherRESTEndPointConfig) {
    const name = PublisherRESTEndPointComponent.getMountPointName(endpoint.name)

    if (this.endpoints.has(name)) {
      logger.warn(`${this.prefix('addEndPoint')} ${endpoint.name} is already exist in this.endpoints`);

      return {success: false};
    }

    new PublisherRESTEndPointComponent(endpoint, this.routepoints);
    this.endpoints.set(name, endpoint);
    Summary.dispatch(Summary.consts.ADD_ENDPOINT, endpoint);

    return {success: true};
  }

  getEndPoint(name: string) {
    return this.endpoints.get(name);
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

