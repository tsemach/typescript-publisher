
import createLogger from 'logging';
const logger = createLogger('Publication-REST-EndPoint-Test');

const { fork } = require('child_process');

import 'mocha';
import { expect } from 'chai';
import { assert } from 'chai';
import * as http from 'http';
import axios from 'axios';

import { PublisherREST } from './../../src/route/publisher-rest';
import { PublisherRESTEndPoint } from '../../src/common/publisher-rest-endpoint';
import PublisherRESTApplication from './publisher-rest-application';
import PublisherRESTData from './publisher-rest-data';
import { TxMountPoint, TxRoutePointRegistry } from 'rx-txjs';

const { PORT = 3010 } = process.env;

class R1Component {
  private mountpoint: TxMountPoint;
  private config = {
      host: 'localhost',
      port: +PORT,
      method: 'get',
      service: 'sanity',
      route: 'save'
  };

  constructor() {
    // don't use create here, create is for client side, route create the internally express route
    this.mountpoint = TxRoutePointRegistry.instance.route('PUBLICHSER-REST-ENDPOINT-TEST::R1', this.config);
  }
}

let services = {
  a: {fork, ready: false, data: null}, 
  b: {fork, ready: false, data: null}, 
  c: {fork, ready: false, data: null},
  d: {fork, ready: false, data: null},
  e: {fork, ready: false, data: null},
};

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

describe('RouteREST Publication Test', () => {
  beforeEach(async () => {
    services.e.fork = fork('./dist/tests/route/service-e/publisher-rest-main.js');

    services.e.fork.on('message', (msg: PublisherRESTData) => {
      logger.info('publication-rest-endpoint.spec.ts: message from service-e:', msg);
  
      if (msg.status === 'service-e:up') {
        logger.info('publication-rest-endpoint.spec.ts: service-e is up');
        services.e.ready = true;
      }
    });
    await sleep(500);
  });

  afterEach(async () => {    
    services.e.fork.send({status: 'service-e:exit', data: {}});
    await sleep(1000);
  });

  /**
   */  
  it('publication-rest-endpoint.ts: test add endpoint API', (done) => {
    logger.info('publication-rest.space.ts: test add endpoint API');
              
    let server: http.Server;
    const config: PublisherRESTEndPoint = {
      name: 'publication-rest-endpoint-test',
      host: 'localhost', 
      port: +PORT,
      route: '/v1/publish',
    }
    
    server = PublisherRESTApplication.instance.listen('localhost', +PORT);
    server.on('listening', async () => {

      await PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);
      new R1Component();

      let retries = 0
      while ( retries < 10) {
        retries++;
        if ( ! services.e.ready ) {
          await sleep(500);
          continue;
        }

        await PublisherREST.instance.addEndPoint({name: 'service-e', host: 'localhost', port: 3005, route: '/v1/publish'}, true);
        await sleep(2000);
        
        console.log(PublisherREST.instance.getState());
        server.close();
        done();    
      }
    });

  }).timeout(20000);

  it('publication-rest-endpoint.ts: test add endpoint with rest call', (done) => {
    logger.info('publication-rest-endpoint.space.ts: test add endpoint with rest call');
              
    let server: http.Server;
    const config: PublisherRESTEndPoint = {
      name: 'publication-rest-endpoint-test',
      host: 'localhost', 
      port: +PORT,
      route: '/v1/publish',
    }
    
    server = PublisherRESTApplication.instance.listen('localhost', +PORT);
    server.on('listening', async () => {

      await PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);
      new R1Component();

      let retries = 0
      while ( retries < 10) {
        retries++;
        if ( ! services.e.ready ) {
          await sleep(500);
          continue;
        }
      
        const reply = await axios.post('http://localhost:3010/v1/publish/endpoint', {name: 'service-e', host: 'localhost', port: 3005, route: '/v1/publish'});
        logger.info('publication-rest-endpoint - got reply from service-e:', reply.data)        
        logger.info('publication-rest-endpoint - state = ', JSON.stringify(PublisherREST.instance.getState(), undefined, 2));

        server.close();
        done();
      }
    });

  }).timeout(10000);
});
