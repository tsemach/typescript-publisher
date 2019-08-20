
import createLogger from 'logging';
const logger = createLogger('Publication-REST-Test');

const { fork } = require('child_process');

import 'mocha';
import { expect } from 'chai';
import { assert } from 'chai';

import { TxMountPointRegistry } from 'rx-txjs';
import PublisherRESTData from './publisher-rest-data';
import { PublisherRESTMainExpected as PublisherRESTServiceAExpected } from './service-d/publisher-rest-main-expected';
import { PublisherRESTMainExpected as PublisherRESTServiceBExpected } from './service-b/publisher-rest-main-expected';
import { PublisherRESTMainExpected as PublisherRESTServiceCExpected } from './service-c/publisher-rest-main-expected';
import { PublisherRESTMainExpected as PublisherRESTServiceDExpected } from './service-d/publisher-rest-main-expected';

describe('RouteREST Publication End-2-End Test', () => {

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

      // assert.deepEqual(services.a.data, PublisherRESTServiceAExpected);

      done();
    }
    
  }).timeout(20000);

  it('publication-rest.space.ts: test discovery', async (done) => {
    logger.info('publication-rest.space.ts: test discovery');

    let services = {
      a: {fork, ready: false, data: null}, 
      b: {fork, ready: false, data: null}, 
      c: {fork, ready: false, data: null},
      d: {fork, ready: false, data: null}
    };
    
    services.a.fork = fork('./dist/tests/route/service-a/publisher-rest-main.js');
    services.b.fork = fork('./dist/tests/route/service-b/publisher-rest-main.js');    
    services.c.fork = fork('./dist/tests/route/service-c/publisher-rest-main.js');    
    services.d.fork = fork('./dist/tests/route/service-d/publisher-rest-main.js');    

    function run() {      
      if (services.a.ready && services.b.ready && services.c.ready && services.d.ready) {      
        logger.info('[publication-rest.spec.ts:run] service.a.ready = ', services.a.ready);
        logger.info('[publication-rest.spec.ts:run] service.b.ready = ', services.b.ready);
        logger.info('[publication-rest.spec.ts:run] service.b.ready = ', services.c.ready);
        logger.info('[publication-rest.spec.ts:run] service.b.ready = ', services.d.ready);
        
        setTimeout(() => {
          services.a.fork.send({status: 'service-a:get', data: {}});
          services.b.fork.send({status: 'service-b:get', data: {}});
          services.c.fork.send({status: 'service-c:get', data: {}});
          services.d.fork.send({status: 'service-d:get', data: {}});
        }, 4000);
      }
    }

    function get() {
      if (services.a.data && services.b.data && services.c.data && services.d.data) {
        logger.info('[publication-rest.spec.ts:run] service.a.data = ', services.a.data);
        logger.info('[publication-rest.spec.ts:run] service.d.data = ', services.b.data);
        logger.info('[publication-rest.spec.ts:run] service.d.data = ', services.c.data);
        logger.info('[publication-rest.spec.ts:run] service.d.data = ', services.d.data);
        
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
      logger.info('publication-rest.spec.ts: message from service-d:', msg);
  
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
      logger.info('publication-rest.spec.ts: message from service-a:', msg);
  
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

    services.d.fork.on('message', (msg: PublisherRESTData) => {
      logger.info('publication-rest.spec.ts: message from service-d:', msg);
  
      if (msg.status === 'service-d:up') {
        logger.info('publication-rest.spec.ts: service-d is up');      
        services.d.ready = true;
        run();        
      }

      if (msg.status === 'service-d:get') {
        logger.info('publication-rest.spec.ts: getting data form service-d:', msg);

        services.d.data = msg.data;           
        get();
      }   
    });

    const verify = () => {
      console.log("NAMES A:", JSON.stringify(services.a.data, undefined, 2));
      console.log("NAMES B:", JSON.stringify(services.b.data, undefined, 2));
      console.log("NAMES C:", JSON.stringify(services.c.data, undefined, 2));
      console.log("NAMES D:", JSON.stringify(services.d.data, undefined, 2));
      services.a.fork.send({status: 'service-a:exit', data: {}});
      services.b.fork.send({status: 'service-b:exit', data: {}});
      services.c.fork.send({status: 'service-c:exit', data: {}});
      services.d.fork.send({status: 'service-d:exit', data: {}});

      // assert.deepEqual(services.d.data, PublisherRESTServiceDExpected);

      done();
    }
  }).timeout(15000);

});
  