
import Consts, { SummaryConstType } from './consts';
import { PublisherRESTEndPoint } from '../../common/publisher-rest-endpoint';

export interface ActionType {
  type: SummaryConstType,
  [payload: string]: any;
}

export interface ActionFunctionType {
  (payload: any): {type: SummaryConstType, [payload: string]: any};
}

export function startAction(name: string) {
  return {type: Consts.START, name};
};

export function addEndPointAction(endpoint: PublisherRESTEndPoint) {
  return {type: Consts.ADD_ENDPOINT, endpoint};
};

export function addComponentAction(component: string) {
  return {type: Consts.ADD_COMPONENT, component};
};

export function addPublishAction(component: string) {
  return {type: Consts.ADD_PUBLISH, component};
};

