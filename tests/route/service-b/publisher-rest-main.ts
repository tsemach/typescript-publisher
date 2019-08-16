import createLogger from 'logging';
const logger = createLogger('Publication-REST-Service-B');

import { PublisherREST,  } from '../../../src/route/publisher-rest';
import { PublisherRESTEndPoint } from '../../../src/common/publisher-rest-endpoint';
import PublisherRESTApplication from '../publisher-rest-application';
import PublisherRESTData from '../publisher-rest-data';

import { R1Component } from './R1Component';
import { R2Component } from './R2Component';
import { R3Component } from './R3Component';

const { PORT = 3002 } = process.env;

if ( ! PORT ) {
  console.error("<usage> missing PORT enviroment");

  process.exit(1);
}

function run() {
  const config: PublisherRESTEndPoint = {
    name: 'service-b',
    host: 'localhost', 
    port: +PORT,
    route: '/v1/publish',
  }

  PublisherREST.instance.addEndPoint({name: 'service-a', host: 'localhost', port: 3001, route: '/v1/publish'});
  PublisherREST.instance.addEndPoint({name: 'service-c', host: 'localhost', port: 3003, route: '/v1/publish'});
  
  const server = PublisherRESTApplication.instance.listen('localhost', +PORT);
  server.on('listening', () => {
    PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);

    new R1Component();
    new R2Component();
    new R3Component();

    if (process.send) {
      process.send({status: 'service-b:up', data: {}});
    }
  });
}

process.on('message', (msg: PublisherRESTData) => {  
  logger.info('[service-b] message from parent:', msg);

  if (msg.status === 'service-b:get') {
    process.send({status: 'service-b:get', data: PublisherREST.instance.getState()});    
  }

  if (msg.status === 'service-b:exit') {
    logger.info('[service-b:exit] service-b going to exist')

    process.exit(0);
  }
});

run();

