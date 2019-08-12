
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

    let services = {a: {fork, ready: false, data: {}}, b: {fork, ready: false, data: {}}, c: {fork, ready: false, data: {}}};
    
    services.a.fork = fork('./dist/tests/route/service-a/publisher-rest-main.js');
    // services.b.fork = fork('./dist/tests/route/service-b/route-publisher-main.js');
    // services.c.fork = fork('./dist/tests/route/service-c/route-publisher-main.js');

    function run() {
      //if (services.a.ready && services.b.ready && services.c.ready) {
      logger.info('[publication-rest.spec.ts:run] service.a.ready = ', services.a.ready);
      if (services.a.ready) {
        verify();
      }
    }

    services.a.fork.on('message', (msg: PublisherRESTData) => {
      logger.info('publication-rest.spec.ts: message from service-a:', msg);
  
      if (msg.status === 'service-a:up') {
        logger.info('publication-rest.spec.ts: service-a is up');      

        services.a.fork.send({status: 'service-a:get', data: {}});     
      }

      if (msg.status === 'service-a:get') {
        logger.info('publication-rest.spec.ts: getting data form service-a:', msg);

        services.a.ready = true;
        services.a.data = msg.data;
        run();
      }   
    });

    // services.b.fork.on('message', (msg: string) => {
    //   logger.info('message from service-b', msg);

    //   if (msg === 'service-b:up') {
    //     logger.info('tx-route-rest-publication.spec.ts: service-b is up');      

    //     services.b.ready = true;
    //     run();
    //   }      
    // });

    // services.c.fork.on('message', (msg: string) => {
    //   logger.info('message from service-c', msg);

    //   if (msg === 'service-c:up') {
    //     logger.info('tx-route-rest-publication.spec.ts: service-c is up');

    //     services.c.ready = true;
    //     run();
    //   }      
    // });

    const verify = () => {
      console.log("NAMES:", services.a.data);
      services.a.fork.send({status: 'service-a:exit', data: {}});
      // services.b.fork.send('service-b:exit');
      // services.c.fork.send('service-c:exit');
      done();
    }
    
  }).timeout(20000);

});
  