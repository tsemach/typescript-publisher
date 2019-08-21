
// import createLogger from 'logging';
// const logger = createLogger('Publication-REST');
// //import { logger } from '../utils';

// import * as express from 'express';
// import * as util from 'util';
// import * as _ from 'lodash';

// import { TxRouteServiceConfig, TxPublisher, TxRoutePointRegistry, TxMountPointRegistry, TxTask } from 'rx-txjs';
// import { PublisherRESTEndPointConfig, PublisherRESTTask } from '../common/publisher-rest-endpoint';
// import { utils } from '../../utils';
// import Summary from '../redux/summary';
// import { CallAxiosConfig } from '../../common/call-exios-config';
// import { NodeCommonCallback } from './../common/callbacks';
// import { PublisherRESTService } from './publisher-rest.service';
// import { PublisherRESTEndPoint } from './components/publisher-rest-endpoint.component';
// import { TxRoutpointIndicator } from 'rx-txjs/dist/src/tx-routepint-indicator';

// export class PublisherRESTDicoveryComponent {  

//   constructor() {
//   }

//   async discover(name: string | Symbol): Promise<TxRoutpointIndicator> {
//     logger.info(`${this.prefix('discovery')} going to discover routepoint '${name}'`);
        
//     const allPromises = [];
//     for (let i = 0; i < this.endpoints.length; i++) {            
//       allPromises.push(util.promisify(this.doDiscover.bind(this))(name, this.endpoints[i]));
//     }
//     const indicators: TxRoutpointIndicator[] = await Promise.all(allPromises);
    
//     for (let i = 0; i < indicators.length; i++) {
//       if (indicators[i].config) {
//         Summary.dispatch(Summary.consts.ADD_DISCOVER, {component: indicators[i].name, service: this.endpoints[i].name});
//         return indicators[i];
//       }
//     }
//     return {name, config: null};
//   }

//   private async doDiscover(name: string | Symbol, endpoint: PublisherRESTEndPointConfig, callback: NodeCommonCallback) {    
//     logger.info(` [${endpoint.name}] ${this.prefix('doDiscover')} ${endpoint.name} need to discover routepoint '${name}'`);
//     const { host, port, route } = endpoint;    
        
//     const url = `http://${host}:${port}${route}/discover?name=${name}`;
//     const options: CallAxiosConfig = {
//       method: 'get',
//       timeout: 2000,
//       loops: 3,
//       interval: 2000,
//       from: '/v1/publish',      
//     }      

//     const data = await utils.callAxios(url, options, null);         
//     if (data && data.success === true) {
//       logger.info(`[${endpoint.name}] ${this.prefix('doDiscover')} find routepoint of name: ${name} on ${url} with config ${JSON.stringify(data.config)}`);
//       callback(null, {name, config: data.config} as TxRoutpointIndicator);

//       return;
//     }    
//     callback({name, config: null} as TxRoutpointIndicator, null);
//   }    

//   async addEndPoint(config: PublisherRESTEndPointConfig, isNotifyAll = false) {
//     const name = PublisherRESTEndPoint.getMountPointName(config.name)

//     if (this.endpoints.has(name)) {
//       logger.warn(`${this.prefix('addEndPoint')} ${config.name} is already exist in this.endpoints`);

//       return;
//     }

//     new PublisherRESTEndPoint(config, this.routepoints);
//     this.endpoints.add(name)
//   }

//   private routePointsToArray() {
//     let routespoints = new Array<TxRoutpointIndicator>();
//     for (let [name, config]  of this.routepoints[Symbol.iterator]()) {
//       routespoints.push({name, config});
//     }

//     return routespoints;
//   }

//   getEndPoint(name: string) {
//     return _.find(this.endpoints, {name});
//   }

//   getState() {
//     return Summary.getState();
//   } 
  
//   getName() {
//     return this.config ? this.config.name : '';
//   }

//   prefix(from: string) {
//     const name = this.config ? `[${this.getName()}]` : '';

//     return `${name} [PublisherREST::${from}]`
//   }
// }

