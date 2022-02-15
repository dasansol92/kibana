/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

const find = require('lodash/find');
const pRetry = require('p-retry');
const axios = require('axios');
const getConfig = require('./upgrade_testing_config');

const CLOUD_API_KEY = process.env.CLOUD_API_KEY_SECRET;

const request = axios.create({
  baseURL: 'https://staging.found.no/api/v1/',
  timeout: 10000,
  headers: { Authorization: `ApiKey ${CLOUD_API_KEY}` },
});

const createInstance = async (version) => {
  console.log('CLOUD_API_KEY', CLOUD_API_KEY);

  let response;
  try {
    response = await request.post('deployments?validate_only=false', getConfig(version));
  } catch (error) {
    console.log('error', error);
    throw error;
  }

  if (response.status === 404) {
    throw new pRetry.AbortError(response.statusText);
  }

  return response;
};

const isInstanceReady = async ({ deploymentId }) => {
  console.log('isInstanceReady');

  const clusterInfo = await request.get(`/deployments/${deploymentId}`);

  if (!clusterInfo.data?.healthy) {
    throw new Error('Instance not ready yet');
  }

  return clusterInfo.data;
};

module.exports = async function (version) {
  const instance = await createInstance(version);
  console.log('instance', instance.data);
  const deploymentId = instance.data.id;
  const credentials = find(instance.data.resources, { kind: 'elasticsearch' }).credentials;

  console.log('credentials', credentials);

  const clusterInfo = await pRetry(() => isInstanceReady({ deploymentId }), {
    retries: 10,
    minTimeout: 30 * 1000,
  });

  const resources = {
    elasticsearch: clusterInfo.resources.elasticsearch[0].info.metadata.endpoint,
    kibana: clusterInfo.resources.kibana[0].info.metadata.endpoint,
  };
  console.log(deploymentId);
  return { resources, deploymentId, credentials };
};
