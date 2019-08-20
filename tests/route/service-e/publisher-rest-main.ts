import createLogger from 'logging';
const logger = createLogger('Publication-REST-Service-E');

import * as http from 'http';
import { PublisherREST,  } from '../../../src/route/publisher-rest';
import { PublisherRESTEndPointConfig } from '../../../src/common/publisher-rest-endpoint';
import PublisherRESTApplication from '../publisher-rest-application';
import PublisherRESTData from '../publisher-rest-data';

import { R1Component } from './R1Component';
import { R2Component } from './R2Component';
import { R3Component } from './R3Component';

const { PORT = 3005 } = process.env;

if ( ! PORT ) {
  console.error("<usage> missing PORT enviroment");

  process.exit(1);
}

let server: http.Server;
function run() {
  const config: PublisherRESTEndPointConfig = {
    name: 'service-e',
    host: 'localhost', 
    port: +PORT,
    route: '/v1/publish',
  }

  // PublisherREST.instance.addEndPoint({name: 'service-b', host: 'localhost', port: 3002, route: '/v1/publish'});
  // PublisherREST.instance.addEndPoint({name: 'service-c', host: 'localhost', port: 3003, route: '/v1/publish'});    

  server = PublisherRESTApplication.instance.listen('localhost', +PORT);
  server.on('listening', async () => {
    await PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);

    new R1Component();
    new R2Component();
    new R3Component();

    if (process.send) {
      process.send({status: 'service-e:up', data: {}});
    }
  });
}

process.on('message', (msg: PublisherRESTData) => {  
  logger.info('[service-e] message from parent:', msg);

  if (msg.status === 'service-e:get') {
    process.send({status: 'service-e:get', data: PublisherREST.instance.getState()});
  }

  if (msg.status === 'service-e:exit') {
    logger.info('[service-e:exit] service-e going to exist')
    server.close();
    process.exit(0);
  }
});

run();
