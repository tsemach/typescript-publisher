## Rx-TxJS Components Publication Client / Server Tools

This package inlude a suite of tools helping to build publication server and client. Rx-TxJS implement the concept of decouping objects in process and between processes (services). The main idea of Rx-TxJS is calling an object by its unique name and send him a message (without any direct API activiation) in a similar fashion as RxJS does. The receive component is subscribe and act when those message arrive. You use a Components registry to find those objects living in process. This suite of publication tools enable you to publish those Components over services / processes simlessly. Once Components has publish it able to to call directly from one service to another in the excat same manager as they do in process. 
*the caller has no idea where the Component is locate and doesn't need to handle those details. It just send him a message same as it does when the Components is defined locally in the service.*

>RoutePoint - is a an object use as a borker between to remote Components in two different services.

#### Let see an example of Rx-TxJS's routepoint.
````Typescript
import { TxMountPoint } from '../../src/tx-mountpoint';
import { TxRoutePointRegistry } from '../../src/tx-routepoint-registry';
import { TxRouteServiceTask } from '../../src/tx-route-service-task';

export class R1Component {
  private mountpoint: TxMountPoint;

  // a routepoint configuration object
  private config = {
      host: 'localhost',
      port: 3100,
      method: 'get',
      service: 'sanity',
      route: 'save'
  };

  constructor() {  
    // create the routepoint, the regitry keep track of the routepoint instance by it's name
    this.mountpoint = TxRoutePointRegistry.instance.route('GITHUB::R1', this.config);

    // subscribe to upcoming calls from other services
    this.mountpoint.tasks().subscribe(
    (task: TxRouteServiceTask<any>) => {
      console.log('[R1Component::subscribe] subscribe called, task:', JSON.stringify(task.get(), undefined, 2));

      // send reply back to caller
      task.reply().next(new TxRouteServiceTask<any>({
        headers: {
          source: 'R1Component',
          token: '123456780ABCDEF'
        },
        response: {
          status: 200,
          type: 'json'
        }},
        {
          source: 'R1Component', status: "ok"
        }
      ));      
    });

  }

}

````
To use this routepoint internally or from another service use:
````Typescript
  // first create the client side routepoint. This is done once on initialization
  const config: TxRouteServiceConfig = {
    mode = 'client',    // I am on the client side
    host: 'localhost',  // <-- this is the host of other service
    port: 3100,         // <-- this is the port of other service
    method: 'get',      // <-- the method to use is 'get'
    service: 'sanity',  // the endpoint of other service is on /sanity/save
    route: 'save'
  }
  TxRoutePointRegistry.instance.create('GITHUB::R1', config)

  // get an already define routepoint on the client side
  const routepoint = TxRoutePointRegistry.instance.get('GITHUB::R1');

  // subscribe to reply from the receiver (the server)
  routepoint.subscribe(
    (task: TxTask<any>) => {
      console.log('[sendAndSubscribeServiceGet] got reply from service: ', JSON.stringify(task, undefined, 2));
    }
  );

  // make the call, send {source: 'back-client-main'}, {from: 'clientRoutePoint'} to the server
  const reply = routepoint.tasks().next(new TxRouteServiceTask<any>({source: 'back-client-main'}, {from: 'clientRoutePoint'}));

````

>NOTE: So the task of the publication is create the routepoint on the client registry so you can use it on every point in the code. 
The task of the publciation is to make this two calles:
````Typescript
  // the configration object as define on the server side
  const config: TxRouteServiceConfig = {
    ...
  }
  // the routepoint name as define on the server side
  TxRoutePointRegistry.instance.create('GITHUB::R1', config)
````

### Publications Methods
* Http Express: REST Api using standard express
* System queues: Queue system like Kafka, RabbitMQ, Bull
* Socket.IO / Web Sockets: 

There are several possible ways of deploy services publication.

### Direct Services Publication using RESTApi
With this topology all services are directly communciating with all others (star topology). Each service send to all other its Components configuration. Lets see how it works.

On startup each service initialize **`TxPublisherREST`** object as follow:
````Javascript
import { TxPublisherREST } from 'rx-txjs-publisher/route';

/**
 * init the RESTApi publisher under '/v1/publisher' route on my side
 * @param host  - my hostname / IP
 * @param port  - port number of my service
 * @param app   - express application 
 * @param '/v1/publisher' - the path where all services communicating 
 */
TxPublisherREST.instance.setApplication(host, port, app, '/v1/publisher');

// add a bunch of other endpoint on other services need to publish from / to
TxPublisherREST.instance.addEndPoint(host, port, '/v1/publisher');
.
.
.
TxPublisherREST.instance.addEndPoint(host, port, '/v1/publisher');
````
* **`TxPublisherREST.instance.setApplication()`** - this method init the publisher middleware. Every time when a Component init its rotuepoint it send the routepoint configuration data to all other services as define in by `TxPublisherREST.instance.addEndPoint()` calls. 
  
* **`TxPublisherREST.instance.addEndPoint()`** - add end point of other service need to send the routepoint configuration paramaerts. 

After that you can call components "living" in other services.



