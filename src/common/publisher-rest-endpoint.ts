
import { TxRoutpointIndicator } from "rx-txjs";

/** 
 * TxPublisherRESTConfig configuration:
 * 
 *  host - host address of the publishcation server 
 *  port - post number of the publishcation server
 *  receiving path - the route where publication messages are coming in.
 *  publish path - the route on the where to send publish messages.
 */
export interface PublisherRESTEndPointConfig {
  name: string;
  host: string;
  port: number;
  route: string;  
}

export interface PublisherRESTTask { 
  routepoints: TxRoutpointIndicator[];
  endpoint: PublisherRESTEndPointConfig;
  isPublish: boolean;
}