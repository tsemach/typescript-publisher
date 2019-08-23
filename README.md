## Rx-TxJS Components Publication Client / Server Tools

This package inlude a suite of tools helping to build publication server and client. Rx-TxJS implement the concept of decouping objects in process and between processes (services). The main idea of Rx-TxJS is calling an object by its unique name and send him a message (without any direct API activiation) in a similar fashion as RxJS does. The receive component is subscribe and act when those message arrive. You use a Components registry to find those objects living in process. 

This suite of publication tools enable you to publish those Components over services / processes simlessly. Once Components has publish it able to call directly from one service to another in the excat same manager as they do in process. 
*the caller has no idea where the Component is locate and doesn't need to handle those details. It just send him a message same as it does when the Components is defined locally in the service.*

>RoutePoint - is a an object use as a borker between the remote Components living in two different services.

#### `Service side` - Let see an example of Rx-TxJS's routepoint. 
````javascript
import { 
  TxMountPoint,
  TxRoutePointRegistry,
  TxRouteServiceTask,
  TxRouteServiceConfig
} from 'rx-txjs';

class R1Component {
  private mountpoint: TxMountPoint;

  // a routepoint configuration object
  private config: TxRouteServiceConfig = {
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

1. `GITHUB::R1`: is the name of the component must be unique among ALL services.
2. `Headers`: this goes to the HTTP header in the reqeust.
3. `reponse`: this define how to send the response to the client.
4. `source: 'R1Component', status: "ok"`: any data object return back to client.

`client-side` - To use this routepoint internally or from another service use:
````javascript
  // first create the client side routepoint. This is done once on initialization
  const config: TxRouteServiceConfig = {
    mode = 'client',    // I am on the client side
    host: 'localhost',  // <-- this is the host of other service
    port: 3100,         // <-- this is the port of other service
    method: 'get',      // <-- the method to use is 'get'
    service: 'sanity',  // the endpoint of other service is on /sanity/save
    route: 'save'
  }
  TxRoutePointRegistry.instance.create('GITHUB::R1', config);

  // then use it in where you want to get an already define routepoint on the client side
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

>NOTE: So the task of the publication is create a routepoint on the client registry so you can use it on every point in the code without to define the above code on the client. The publication is do it for you. 
The task of the publciation is to make this two calles available:
````javascript
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

## How to Configure My Code to Use Publication 

### Direct Services Publication using RESTApi
With this topology all services are directly communciating with all others (star topology). Each service send to all other its Components configuration. Lets see how it works.

#### To Initialize the publication you have to call to two methods:

1. Define config object of your service like: 
````Javascript
const config: PublisherRESTEndPointConfig = {
  name: 'service-a',    // my service name, must be unique 
  host: 'localhost',    // host address
  port: +PORT,          // port where your service listen to
  route: '/v1/publish'  // the route name of the publication middleware
}
````
2. call to: ````TxPublisherREST.instance.setApplication(app, config);````  // where app is the express application   
> This initiate the publication routes using your express application (middleware).

3. Call to: ````xPublisherREST.instance.addEndPoint(host, port, '/v1/publisher');````  // host, port, route of the other service
> This will add an endpoint. Endpoint is the remote service you want to work with.

`TxPublisherREST` will send all you rotuepoints to others enpoints and receive from them there routepoints.

An example of a service may looks like that:

On startup each service initialize **`TxPublisherREST`** object as follow:
````Javascript
import * as express from 'express';
import { TxPublisherREST } from 'rx-txjs-publisher/route';

const app = express();

/**
 * init the RESTApi publisher under '/v1/publisher' route on my side
 * @param host  - my hostname / IP
 * @param port  - port number of my service
 * @param app   - express application 
 * @param '/v1/publisher' - the path where all services communicating 
 */
const config: PublisherRESTEndPointConfig = {
  name: 'service-a',    // my service name, must be unique 
  host: 'localhost',    // host address
  port: +PORT,          // port where your service listen to
  route: '/v1/publish'  // the route name of the publication middleware
}

// inititate the publication.
TxPublisherREST.instance.setApplication(app, config);

// add a bunch of other endpoint on other services need to publish from / to
TxPublisherREST.instance.addEndPoint(host, port, '/v1/publisher');
.
.
.
TxPublisherREST.instance.addEndPoint(host, port, '/v1/publisher');

// create new routepoint objects
new R1Componet();
new R2Componet();
new R3Componet();
````
* **`TxPublisherREST.instance.setApplication()`** - this method init the publisher middleware. Every time when a Component init its rotuepoint it send the routepoint configuration data to all other services as define in by `TxPublisherREST.instance.addEndPoint()` calls. 
  
* **`TxPublisherREST.instance.addEndPoint()`** - add end point of other service need to send the routepoint configuration paramaerts. 

After that you can call components "living" in other services.

### Discovery - find which service define a routepoint
when you call to `TxRoutePointRegistry.instance.get('some-routepoint-name')` but `TxRoutePointRegistry` can't find in it's local cache it use the help `PblisherREST` object to find which endpoint has this routepoint. `PblisherREST` send a discovery message to all its endpoints. Once it find the desire routepoint it save in the cache for later use.

### Behind the scene of PublisherREST
`PublisherREST` has two main functionalities. One is to publish all routepoints to other endpoints and second to get from other endpoints their routepoints.
During startup is contantly keep trying until it fullfill both two.




