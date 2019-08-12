
import { PublisherREST } from '../../../src/route/publisher-rest';
import PublisherRESTApplication from '../publisher-rest-application';
import { PublisherRESTEndPoint } from '../../../src/common/publisher-rest-endpoint';
import { R1Component } from './R1Component';
import { R2Component } from './R2Component';
import { R3Component } from './R3Component';

const { PORT = 3002 } = process.env;

if ( ! PORT ) {
  console.error("<usage> missing PORT enviroment");

  process.exit(1);
}

const config: PublisherRESTEndPoint = {
  name: 'service-b',
  host: 'localhost', 
  port: +PORT,
  route: '/v1/publish',
}

PublisherREST.instance.addEndPoint({name: 'service-a', host: 'localhost', port: 3001, route: '/v1/publish'});
PublisherREST.instance.setApplication(PublisherRESTApplication.instance.app, config);
// TxPublisherREST.instance.addEndPoint({name: 'service-c', host: 'localhost', port: 3003, route: '/v1/publish'});

new R1Component();
new R2Component();
new R3Component();

PublisherRESTApplication.instance.listen('localhost', +PORT);

