export interface CallAxiosConfig {
  method: string;
  timeout: number;
  loops: number;
  interval: number;
  from: string;
  data?: any;
}