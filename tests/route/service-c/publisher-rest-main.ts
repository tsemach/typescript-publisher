import createLogger from 'logging';
const logger = createLogger('Publication-REST-Service-C');

import { PublisherREST,  } from '../../../src/route/publisher-rest';
import { PublisherRESTEndPoint } from '../../../src/common/publisher-rest-endpoint';
import PublisherRESTApplication from '../publisher-rest-application';
import PublisherRESTData from '../publisher-rest-data';

import { R1Component } from './R1Component';
import { R2Component } from './R2Component';
import { R3Component } from './R3Component';

const { PORT = 3003 } = process.env;

if ( ! PORT ) {
  console.error("<usage> missing PORT enviroment");

  process.exit(1);
}

function run() {
  const config: PublisherRESTEndPoint = {
    name: 'service-c',
    host: 'localhost', 
    port: +PORT,
    route: '/v1/publish',
  }

  PublisherREST.instance.addEndPoint({name: 'service-a', host: 'localhost', port: 3001, route: '/v1/publish'});
  PublisherREST.instance.addEndPoint({name: 'service-b', host: 'localhost', port: 3002, route: '/v1/publish'});
  
  const server = PublisherRESTApplication.instance.listen('localhost', +PORT);
  server.on('listening', () => {
    PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);

    new R1Component();
    new R2Component();
    new R3Component();

    if (process.send) {
      process.send({status: 'service-c:up', data: {}});
    }
  });
}

process.on('message', (msg: PublisherRESTData) => {  
  logger.info('[service-c] message from parent:', msg);

  if (msg.status === 'service-c:get') {
    process.send({status: 'service-c:get', data: PublisherREST.instance.getState()});    
  }

  if (msg.status === 'service-c:exit') {
    logger.info('[service-c:exit] service-c going to exist')

    process.exit(0);
  }
});

run();

