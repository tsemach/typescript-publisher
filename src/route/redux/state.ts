import { PublisherRESTEndPoint } from "../../common/publisher-rest-endpoint";

export default interface State {
  name: string;
  summary: {
    components: number;
    publishs: number;
    discovers: number;
  }
  components: string[];
  publishs: string[];
  discovers: string[];
  endpoints: PublisherRESTEndPoint[]

} 

