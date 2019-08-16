
import createLogger from 'logging';
const logger = createLogger('Publication-REST-Test');

const { fork } = require('child_process');

import 'mocha';
import { expect } from 'chai';
import { assert } from 'chai';
import { verify } from 'crypto';
import { TxMountPointRegistry } from 'rx-txjs';
import PublisherRESTData from './publisher-rest-data';

describe('RouteREST Publication Test', () => {

  /**
   */
  it('publication-rest.space.ts: test route-rest publication', async (done) => {
    logger.info('publication-rest.space.ts: test route-rest publication');

    let services = {a: {fork, ready: false, data: null}, b: {fork, ready: false, data: null}, c: {fork, ready: false, data: null}};
    
    services.a.fork = fork('./dist/tests/route/service-a/publisher-rest-main.js');
    services.b.fork = fork('./dist/tests/route/service-b/publisher-rest-main.js');    
    services.c.fork = fork('./dist/tests/route/service-c/publisher-rest-main.js');    

    function run() {      
      if (services.a.ready && services.b.ready && services.c.ready) {
        logger.info('[publication-rest.spec.ts:run] service.a.ready = ', services.a.ready);
        logger.info('[publication-rest.spec.ts:run] service.b.ready = ', services.b.ready);
        logger.info('[publication-rest.spec.ts:run] service.c.ready = ', services.c.ready);
        
        setTimeout(() => {
          services.a.fork.send({status: 'service-a:get', data: {}});
          services.b.fork.send({status: 'service-b:get', data: {}});
          services.c.fork.send({status: 'service-c:get', data: {}});
        }, 2000);
      }
    }

    function get() {
      if (services.a.data && services.b.data && services.c.data) {
        logger.info('[publication-rest.spec.ts:run] service.a.data = ', services.a.data);
        logger.info('[publication-rest.spec.ts:run] service.b.data = ', services.b.data);
        logger.info('[publication-rest.spec.ts:run] service.c.data = ', services.c.data);
        
        verify();
      }
    }

    services.a.fork.on('message', (msg: PublisherRESTData) => {
      logger.info('publication-rest.spec.ts: message from service-a:', msg);
  
      if (msg.status === 'service-a:up') {
        logger.info('publication-rest.spec.ts: service-a is up');      
        services.a.ready = true;
        run();        
      }

      if (msg.status === 'service-a:get') {
        logger.info('publication-rest.spec.ts: getting data form service-a:', msg);

        services.a.data = msg.data;           
        get();
      }   
    });

    services.b.fork.on('message', (msg: PublisherRESTData) => {
      logger.info('publication-rest.spec.ts: message from service-b:', msg);
  
      if (msg.status === 'service-b:up') {
        logger.info('publication-rest.spec.ts: service-b is up');
        services.b.ready = true;
        run();        
      }

      if (msg.status === 'service-b:get') {
        logger.info('publication-rest.spec.ts: getting data form service-b:', msg);

        services.b.data = msg.data;
        get();
      }   
    });

    services.c.fork.on('message', (msg: PublisherRESTData) => {
      logger.info('publication-rest.spec.ts: message from service-c:', msg);
  
      if (msg.status === 'service-c:up') {
        logger.info('publication-rest.spec.ts: service-c is up');
        services.c.ready = true;
        run();        
      }

      if (msg.status === 'service-c:get') {
        logger.info('publication-rest.spec.ts: getting data form service-c:', msg);

        services.c.data = msg.data;
        get();
      }   
    });

    const verify = () => {
      console.log("NAMES A:", JSON.stringify(services.a.data, undefined, 2));
      console.log("NAMES B:", JSON.stringify(services.b.data, undefined, 2));
      console.log("NAMES C:", JSON.stringify(services.c.data, undefined, 2));
      services.a.fork.send({status: 'service-a:exit', data: {}});
      services.b.fork.send({status: 'service-b:exit', data: {}});
      services.c.fork.send({status: 'service-c:exit', data: {}});

      done();
    }
    
  }).timeout(20000);

});
  