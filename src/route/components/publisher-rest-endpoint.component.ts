import createLogger from 'logging';
const logger = createLogger('PublisherRESTEndPoint');

import * as _ from 'lodash';
import * as util from 'util';

import { 
  TxMountPointRegistry, 
  TxRoutpointIndicator, 
  TxRoutePointRegistry, 
  TxRouteServiceConfig,
  TxTask, 
} from 'rx-txjs';

import { PublisherRESTEndPointConfig, PublisherRESTTask } from '../../common/publisher-rest-endpoint';
import { CallAxiosConfig } from '../../common/call-exios-config';
import Summary from '../redux/summary';
import { utils } from '../../utils';
import { NodeCommonCallback } from '../../common/callbacks';
import { PublisherRESTEndPointHead } from '../../common/publisher-rest-endpoint-head';
import { PublisherREST } from '../publisher-rest';

enum NotifyStatEnum {
  START,
  PROGRESS,
  DONE
};

class NotifyStat {
  private notified:  NotifyStatEnum = NotifyStatEnum.START;

  isNeeded() {
    return this.notified === NotifyStatEnum.START;
  }

  set stat(stat: NotifyStatEnum) {
    this.notified = stat;
  }

  get stat() {
    return this.notified;
  }

  get name() {
    return NotifyStatEnum[this.notified];
  }
}

export class PublisherRESTEndPointComponent {
  private pending: Map<string, TxRouteServiceConfig>; // list of routepoints needs to spublish to this.endpoint
  private sending: Map<string, TxRouteServiceConfig>; // list of routepoints that are currently on sending
  private notified = new NotifyStat();
  private url: string;

  constructor(private endpoint: PublisherRESTEndPointConfig, routepoints: Map<string, TxRouteServiceConfig>) {
    const mp = TxMountPointRegistry.instance.create(PublisherRESTEndPointComponent.getMountPointName(this.endpoint.name));
    
    mp.tasks().subscribe(
      async (task: TxTask<PublisherRESTEndPointHead>) => {
        logger.info(`${this.prefix('subscribe')} got task method: '${task.head.method}', name: '${task.data.name}'`);
        const data: TxRoutpointIndicator = task.getData();

        if (task.head.method === 'publish') {
          this.pending.set(<string>data.name, data.config);   
          setImmediate(this.runMainLoop.bind(this));
        }

        if (task.head.method === 'discover') {
          const head = {method: 'discover', source: this.endpoint.name};
          try {
            const reply = await this.doDiscover(data.name, null);

            mp.reply().next(new TxTask<PublisherRESTEndPointHead>(head, reply));
          }
          catch (e) {
            mp.reply().next(new TxTask<PublisherRESTEndPointHead>(head, {name, config: null}));
          }
        }
      });

    this.pending = _.cloneDeep(routepoints);
    this.url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`;
    setImmediate(this.mainloop.bind(this));    
  }

  // publish(name: string, config: TxRouteServiceConfig) {
  //   logger.info(`${this.prefix('publish')} add routepoint: ${name} to publish list`);

  //   this.pending.set(name, config);
  // }

  private async mainloop() {    
    logger.info(`${this.prefix('mainloop')} start mainloop iteration, this.notified: ${this.notified.name}, this.pending.size: ${this.pending.size}`);

    if (this.notified.isNeeded()) {
      logger.info(`${this.prefix('mainloop')} promisify notify`);

      util.promisify(this.notify.bind(this))()
      .then((reply: any) => {
        logger.info(`${this.prefix('mainloop')} promisify notify got reply: ${JSON.stringify(reply)}`);

        this.runMainLoop();
      })
      .catch((reply: any) => { 
        logger.error(`${this.prefix('mainloop')} ERROR - promisify notify got reply: ${JSON.stringify(reply)}`);

        this.runMainLoop();
      });
    }

    if (this.pending.size > 0) {
      logger.info(`${this.prefix('mainloop')} promisify pending routepoints`);

      util.promisify(this.publishRoutePoints.bind(this))()

      .then((reply: any) => {
        logger.info(`${this.prefix('mainloop')} promisify pending routepoints got reply: ${JSON.stringify(reply)}`);

        this.runMainLoop();      
      })
      .catch((reply: any) => { 
        logger.error(`${this.prefix('mainloop')} ERROR - pending routepoints got reply: ${JSON.stringify(reply)}`);

        this.runMainLoop();
      });
    }

    logger.info(`${this.prefix('mainloop')} end mainloop iteration, this.notified: ${this.notified.name}, this.pending.size: ${this.pending.size}`);
  }

  runMainLoop() {
    logger.info(`${this.prefix('runMainLoop')} this.notified: ${this.notified.name}, this.pending.size: ${this.pending.size}`);
    if (this.notified.isNeeded() || this.pending.size > 0) {
      setTimeout(this.mainloop.bind(this), 2000);
    }
  }

  private async notify(callback: NodeCommonCallback) {
    const options: CallAxiosConfig = {
      method: 'get',
      timeout: 2000,
      loops: 1,
      interval: 0,
      from: `${this.prefix('notify')}`,
      data: null
    }

    this.notified.stat = NotifyStatEnum.PROGRESS;
    try {
      const reply = await utils.callAxios(this.url, options, null);
      const { success, data} = reply;
      
      if ( ! success ) {
        logger.error(`${this.prefix('notify')} ERROR - get fail status on url: ${this.url}`);
        if (callback) { callback({success: false, data: null}, null); }

        return {success: false, data: null};
      }

      data.forEach((component: TxRoutpointIndicator) => {
        const { name, config} = component;

        config.mode = 'client';
        TxRoutePointRegistry.instance.create(name, config);  
        Summary.dispatch(Summary.consts.ADD_COMPONENT, name);        

        logger.info(`${this.prefix('notify')} adding routepoint name: ${name}`);
      });
      this.notified.stat = NotifyStatEnum.DONE;
      if (callback) { callback(null, {success, data}); }

      return {success: true, data};
    }
    catch (e) {
      logger.error(`${this.prefix('notify')} ERROR - get error on url: ${this.url}\n${e.stack}`);
    }
    this.notified.stat = NotifyStatEnum.START;
    if (callback) { callback({success: false, data: null}, null); }

    return {success: false, data: null};
  }  

  private async publishRoutePoints(callback: NodeCommonCallback) {
    logger.info(`${this.prefix('publishRoutePoints')} going to publish all pending routepoints to ${this.endpoint.name}`);
    
    const task: PublisherRESTTask = {routepoints: this.routePointsToArray(this.pending), endpoint: this.endpoint, isPublish: false};
    this.sending = _.cloneDeep(this.pending);
    this.pending.clear();

    try {
      const reply = await util.promisify(this.doPublish.bind(this))(task);
      logger.info(`${this.prefix('publishRoutePoints')} complete publishing all pending routepoints to ${this.endpoint.name}`);
    }
    catch(e) {
      logger.error(`${this.prefix('publishRoutePoints')} ERROR on promise.all, e: ${e.message}`);
    }
  }

  private async doPublish(task: PublisherRESTTask, callback: NodeCommonCallback) {
    const { routepoints, endpoint } = task;
        
    const url = `http://${endpoint.host}:${endpoint.port}${endpoint.route}`;
    const options: CallAxiosConfig = {
      method: 'post',
      timeout: 2000,
      loops: 1,
      interval: 0,
      from: `${this.prefix('doPublish')}`,
      data: routepoints
    }      

    const data = await utils.callAxios(url, options, null);

    if (data && data.success === true) {
      if (data.names) { 
        data.names.forEach((name: string) => { 
          this.sending.delete(name) 
          Summary.dispatch(Summary.consts.ADD_PUBLISH, {component: name, service: endpoint.name});
        });
      }
      logger.info(`${this.prefix('doPublish')} publish ${JSON.stringify(routepoints)} to [${endpoint.name}] success === true reply.data: ${JSON.stringify(data)} use url: ${url}`);
      callback(null, data);

      return;
    }
    this.pending = _.cloneDeep(this.sending);

    logger.error(`${this.prefix('doPublish')} publish ${JSON.stringify(routepoints)} to [${endpoint.name}] failed to publish, reply.data: ${JSON.stringify(data)} use url: ${url}`);
    callback({success: false, data: null}, null); 
  }

  private async doDiscover(name: string | Symbol, callback: NodeCommonCallback) {    
    logger.info(` [${this.endpoint.name}] ${this.prefix('doDiscover')} asking ${this.endpoint.name} if has routepoint '${name}'`);
    const { host, port, route } = this.endpoint;    
        
    const url = `http://${host}:${port}${route}/discover?name=${name}`;
    const options: CallAxiosConfig = {
      method: 'get',
      timeout: 2000,
      loops: 30,
      interval: 2000,
      from: `${this.getName()}`,
    }      

    const data = await utils.callAxios(url, options, null);
    if (data && data.success === true) {
      logger.info(`${this.prefix('doDiscover')} find routepoint of name: ${name} on ${url} with config ${JSON.stringify(data.config)}`);
      if (callback) callback(null, {name, config: data.config} as TxRoutpointIndicator);

      return {name, config: data.config};
    }    
    if (callback) callback({name, config: null} as TxRoutpointIndicator, null);
    return {name, config: null} as TxRoutpointIndicator, null;
  }    

  private routePointsToArray(routepoints: Map<string, TxRouteServiceConfig>) {
    let routespoints = new Array<TxRoutpointIndicator>();
    for (let [name, config] of routepoints[Symbol.iterator]()) {
      routespoints.push({name, config});
    }

    return routespoints;
  }

  static getMountPointName(name: string) {
    return `PUBLISHER::ENDPOINT::${name.toLocaleUpperCase()}`;    
  }
  
  getName() {
    return PublisherREST.instance.getName();
  }

  prefix(from: string) {
    const name = this.endpoint ? `[${this.getName()}]` : '';

    return `${name} [PublisherRESTEndPoint::${from}]`
  }
}
