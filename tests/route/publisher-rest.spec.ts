
import createLogger from 'logging';
const logger = createLogger('Route-REST-Publication-Test');

const { fork } = require('child_process');

import 'mocha';
import { expect } from 'chai';
import { assert } from 'chai';
import { verify } from 'crypto';
import { TxMountPointRegistry } from 'rx-txjs';

describe('RouteREST Publication Test', () => {

  /**
   */
  it('tx-route-rest-publication.space.ts: test route-rest publication', async (done) => {
    logger.info('tx-route-rest-publication.space.ts: test route-rest publication');

    let services = {a: {fork, ready: false}, b: {fork, ready: false}, c: {fork, ready: false}};
    
    services.a.fork = fork('./dist/tests/route/service-a/route-publisher-main.js');
    // services.b.fork = fork('./dist/tests/route/service-b/route-publisher-main.js');
    // services.c.fork = fork('./dist/tests/route/service-c/route-publisher-main.js');

    function run() {
      //if (services.a.ready && services.b.ready && services.c.ready) {
      if (services.a.ready) {
        verify();
      }
    }

    services.a.fork.on('message', (msg: string) => {
      logger.info('message from service-a', msg);

      if (msg === 'service-a:up') {
        logger.info('tx-route-rest-publication.spec.ts: service-a is up');      

        services.a.ready = true;
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
      console.log("NAMES:", TxMountPointRegistry.instance.getNames());
      services.a.fork.send('service-a:exit');
      // services.b.fork.send('service-b:exit');
      // services.c.fork.send('service-c:exit');
      done();
    }
    
  }).timeout(2000);

});
  