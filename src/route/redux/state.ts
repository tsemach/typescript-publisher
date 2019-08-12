import { PublisherRESTEndPoint } from "../../common/publisher-rest-endpoint";

export default interface State {
  name: string;
  summary: {
    components: number;
    publishs: number;
  }
  components: string[];
  publishs: string[];
  endpoints: PublisherRESTEndPoint[]

} 

