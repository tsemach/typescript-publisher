import createLogger from 'logging';
const logger = createLogger('Publication-REST-Service-D');

import { PublisherREST,  } from '../../../src/route/publisher-rest';
import { PublisherRESTEndPoint } from '../../../src/common/publisher-rest-endpoint';
import PublisherRESTApplication from '../publisher-rest-application';
import PublisherRESTData from '../publisher-rest-data';

import { R1Component } from './R1Component';
import { R2Component } from './R2Component';
import { R3Component } from './R3Component';

import { TxRoutePointRegistry, TxRouteServiceTask } from 'rx-txjs';

const { PORT = 3004 } = process.env;

if ( ! PORT ) {
  console.error("<usage> missing PORT enviroment");

  process.exit(1);
}

function run() {
  const config: PublisherRESTEndPoint = {
    name: 'service-d',
    host: 'localhost', 
    port: +PORT,
    route: '/v1/publish',
  }

  PublisherREST.instance.addEndPoint({name: 'service-a', host: 'localhost', port: 3001, route: '/v1/publish'});
  PublisherREST.instance.addEndPoint({name: 'service-c', host: 'localhost', port: 3003, route: '/v1/publish'});
  
  const server = PublisherRESTApplication.instance.listen('localhost', +PORT);
  server.on('listening', () => {
    PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);

    // new R1Component();
    // new R2Component();
    // new R3Component();

    if (process.send) {
      process.send({status: 'service-d:up', data: {}});
    }

    setTimeout(async () => {
      console.log('DISCOVERY: going to check discovery');
      TxRoutePointRegistry.instance.del('SERVICE-A::R2');
      const rp = await TxRoutePointRegistry.instance.get('SERVICE-A::R2');
      console.log('DISCOVERY: rp.name=', rp.name);

      const reply = await rp.tasks().next(new TxRouteServiceTask<any>({source: 'publisher-rest-main-d'}, {from: 'clientRoutePoint'}));

      console.log('[publisher-rest-main-d] reply: ', reply.data);
    }, 2000);
    
  });
}

process.on('message', (msg: PublisherRESTData) => {  
  logger.info('[service-d] message from parent:', msg);

  if (msg.status === 'service-d:get') {
    process.send({status: 'service-d:get', data: PublisherREST.instance.getState()});    
  }

  if (msg.status === 'service-d:exit') {
    logger.info('[service-d:exit] service-d going to exist')

    process.exit(0);
  }
});

run();
