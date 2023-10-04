/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// / <reference types="cypress" />
import type { ExecaReturnValue } from 'execa';
import execa from 'execa';
import { agentRouteService } from '@kbn/fleet-plugin/common/services';
import { API_VERSIONS } from '@kbn/fleet-plugin/common/constants';
import type { GetOneAgentResponse } from '@kbn/fleet-plugin/common/types';

import { VAGRANT_CWD } from '../../../../scripts/endpoint/common/endpoint_host_services';
import { createRuntimeServices } from '../../../../scripts/endpoint/common/stack_services';

export const agentActions = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): void => {
  const stackServicesPromise = createRuntimeServices({
    kibanaUrl: config.env.KIBANA_URL,
    elasticsearchUrl: config.env.ELASTICSEARCH_URL,
    fleetServerUrl: config.env.FLEET_SERVER_URL,
    username: config.env.KIBANA_USERNAME,
    password: config.env.KIBANA_PASSWORD,
    esUsername: config.env.ELASTICSEARCH_USERNAME,
    esPassword: config.env.ELASTICSEARCH_PASSWORD,
    asSuperuser: true,
  });

  on('task', {
    uninstallAgentFromHost: async ({
      hostname,
      uninstallToken,
    }: {
      hostname: string;
      uninstallToken?: string;
    }): Promise<string> => {
      let result;
      try {
        if (process.env.CI) {
          result = await execa(
            'vagrant',
            [
              'ssh',
              '--',
              `sudo elastic-agent uninstall -f ${
                uninstallToken ? `--uninstall-token ${uninstallToken}` : ''
              }`,
            ],
            {
              env: {
                VAGRANT_CWD,
              },
            }
          );
        } else {
          result = await execa(`multipass`, [
            'exec',
            hostname,
            '--',
            'sh',
            '-c',
            `sudo elastic-agent uninstall -f ${
              uninstallToken ? `--uninstall-token ${uninstallToken}` : ''
            }`,
          ]);
        }
      } catch (err) {
        return err.stderr;
      }
      return result.stdout;
    },

    ensureAgentAndEndpointHasBeenUninstalledFromHost: async ({
      hostname,
    }: {
      hostname: string;
      uninstallToken?: string;
    }): Promise<boolean> => {
      let execaReturnValue: ExecaReturnValue<string>;
      if (process.env.CI) {
        execaReturnValue = await execa('vagrant', ['ssh', '--', `ls /opt/Elastic`], {
          env: {
            VAGRANT_CWD,
          },
        });
      } else {
        execaReturnValue = await execa(`multipass`, [
          'exec',
          hostname,
          '--',
          'sh',
          '-c',
          `ls /opt/Elastic`,
        ]);
      }

      if (execaReturnValue.stdout === '') {
        return true;
      }

      return false;
    },

    ensureAgentHasBeenUnenrolled: async ({ agentId }: { agentId: string }): Promise<boolean> => {
      const { kbnClient } = await stackServicesPromise;

      let isAgentUnenrolled = false;

      while (!isAgentUnenrolled) {
        const { data } = await kbnClient.request<GetOneAgentResponse>({
          method: 'GET',
          path: agentRouteService.getInfoPath(agentId),
          headers: {
            'elastic-api-version': API_VERSIONS.public.v1,
          },
        });
        if (data.item.status !== 'unenrolled' || data.item.active) {
          // sleep and check again
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          isAgentUnenrolled = true;
        }
      }

      return isAgentUnenrolled;
    },
  });
};
