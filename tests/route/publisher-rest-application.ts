import createLogger from 'logging';
const logger = createLogger('RoutePublisherApplication');

import * as expres from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

class PublisherRESTApplication {  
  private static _instance: PublisherRESTApplication = null;
  public _app: expres.Application;
  
  private constructor() { 
    this._app = expres();
    this.middleware();    
  }

  get app() {
    return this._app;
  }
  
  public static get instance() {                                          
    return this._instance || (this._instance = new this());
  }                                                                          

  // configure express middleware.
  private middleware(): void {
    this._app.use(cors());
    this._app.use(bodyParser.json());
    this._app.use(bodyParser.urlencoded({extended: false}));
  }

  listen(host: string, port: number, callback = () => {
      // default callback
      logger.info(`[RoutePublisherApplication::listen] Listening at http://${host}:${port}/`);
    })
  {    
    return this._app.listen(port, callback);
  }
}

export default PublisherRESTApplication;

