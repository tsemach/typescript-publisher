import * as _ from 'lodash';

import Consts from './consts';
import State from './state';
import { ActionType } from './actions';
import { utils } from '../../utils';

function startReducer(state: State, _action: ActionType) {

  const summary = {
    name: '',    
    summary: {
      components: 0,
      publishs: 0,
    },
    components: [],
    publishs: [],
    endpoints: []
  };

  return Object.assign({}, summary, {    
    name: _action.name,
  });
}

function addEndPointReducer(_state: State, _action: ActionType) {
  const state = {..._state};
  state.endpoints.push(utils.clone(_action.endpoint));

  return state;
}

function addComponentReducer(_state: State, _action: ActionType) {
  const state = {..._state};  
  state.components.push(_action.component);
  state.summary.components++;  

  return state;
}

function addPublishReducer(_state: State, _action: ActionType) {
  const state = {..._state};

  state.publishs.push(`${_action.payload.component} --> ${_action.payload.service}`);
  state.summary.publishs++;

  return state;
}

export default function reducer(state: State, action: ActionType) {
  if (action.type === Consts.START) {
    return startReducer(state, action);
  }

  if (action.type === Consts.ADD_ENDPOINT) {
    return addEndPointReducer(state, action);
  }

  if (action.type === Consts.ADD_COMPONENT) {
    return addComponentReducer(state, action);
  }
     
  if (action.type === Consts.ADD_PUBLISH) {
    return addPublishReducer(state, action);
  }

  return state;
}
