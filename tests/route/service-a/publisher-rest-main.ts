
import { PublisherREST,  } from '../../../src/route/publisher-rest';
import { PublisherRESTEndPoint } from '../../../src/common/publisher-rest-endpoint';
import PublisherRESTApplication from '../publisher-rest-application';
import { R1Component } from './R1Component';
import { R2Component } from './R2Component';
import { R3Component } from './R3Component';

const { PORT = 3001 } = process.env;

if ( ! PORT ) {
  console.error("<usage> missing PORT enviroment");

  process.exit(1);
}

function run() {
  const config: PublisherRESTEndPoint = {
    name: 'service-a',
    host: 'localhost', 
    port: +PORT,
    route: '/v1/publish',
  }

  PublisherREST.instance.addEndPoint({name: 'service-b', host: 'localhost', port: 3002, route: '/v1/publish'});
  // TxPublisherREST.instance.addEndPoint({name: 'service-a', host: 'localhost', port: 3003, route: '/v1/publish'});

  const server = PublisherRESTApplication.instance.listen('localhost', +PORT);

  server.on('listening', () => {
    PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);

    new R1Component();
    new R2Component();
    new R3Component();
  });
}

process.on('message', (msg) => {  
  console.log('[service-a:init] message from parent:', msg);

  if (msg === 'service-a:run') {
    run();
  }
  if (msg === 'service-a:exit') {
    console.log('[service-a:exit] service-a going to exist')

    process.exit(0);
  }
});
console.log('[service-a:init] init completed');

if (process.send) {
  process.send('service-a:up')
}
else {
  run();
}