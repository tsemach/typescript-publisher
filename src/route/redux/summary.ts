
import { createStore } from "redux";

import Consts, { SummaryConstType}  from './consts';
import reducer from './reducers';
import { 
  ActionFunctionType,
  startAction,
  addEndPointAction,
  addComponentAction,
  addPublishAction,
  addDiscoverAction,
 } from './actions';

class Summary {
  private readonly actions = new Map<SummaryConstType, ActionFunctionType>()
  private readonly store = createStore(reducer);

  constructor() {    
    this.actions.set(Consts.START, startAction);
    this.actions.set(Consts.ADD_ENDPOINT, addEndPointAction);
    this.actions.set(Consts.ADD_COMPONENT, addComponentAction);
    this.actions.set(Consts.ADD_PUBLISH, addPublishAction);
    this.actions.set(Consts.ADD_DISCOVER, addDiscoverAction);    
  }

  getState() {
    return this.store.getState();
  }

  dispatch(type: SummaryConstType, payload: any) {
    const action = this.actions.get(type);  
    this.store.dispatch(action(payload));
  }

  get consts() {
    return Consts;
  }
}

export default new Summary();
