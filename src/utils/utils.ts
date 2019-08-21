
import createLogger from 'logging';
const logger = createLogger('Utils');

import * as util from 'util';
import * as url from 'url'
import * as express from 'express';
import axios, { Method } from 'axios';

import { NodeCommonCallback } from '../common/callbacks';
import { CallAxiosConfig } from '../common/call-exios-config';

async function sleep(time: number) {
  const sleeper = util.promisify(setTimeout)
  
 await sleeper(3000)
}

function clone(object: any) {
  return Object.assign({}, object);
}

async function callAxios(url: string, config: CallAxiosConfig, callback: NodeCommonCallback) {
  const options = {
    url,     
    method: <Method>config.method,
    data: config.data,
    config: {
      timeout: config.timeout
    }
  }
  let error = '';
  let loops = 0;
  while (loops < (config.loops || 1)) {
    loops++;
    try {
      const reply = await axios(options);
      logger.info(`[util:callAxios] ${config.from} reply.data: ${JSON.stringify(reply.data)} of url: ${url}`);      
      if (callback) callback(null, reply.data);
      return reply.data;
    }
    catch (e) {
      error = e;
      logger.info(`[util:callAxios] ERROR: from ${url} e: ${e.stack}`);
      
      await sleep(config.interval || 0);
    }    
  }
  if (callback) callback(error, {success: false, data: null});
  return {success: false, data: null};
}

function fullUrl(req: express.Request) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}

export {
  sleep,
  clone,
  callAxios,
  fullUrl
}