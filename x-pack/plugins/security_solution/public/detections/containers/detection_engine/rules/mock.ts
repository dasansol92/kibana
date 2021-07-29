/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FetchRulesResponse, Rule } from './types';

export const savedRuleMock: Rule = {
  author: [],
  actions: [],
  created_at: 'mm/dd/yyyyTHH:MM:sssz',
  created_by: 'mockUser',
  description: 'some desc',
  enabled: true,
  false_positives: [],
  filters: [],
  from: 'now-360s',
  id: '12345678987654321',
  index: [
    'apm-*-transaction*',
    'traces-apm*',
    'auditbeat-*',
    'endgame-*',
    'filebeat-*',
    'packetbeat-*',
    'winlogbeat-*',
  ],
  interval: '5m',
  immutable: false,
  rule_id: 'bbd3106e-b4b5-4d7c-a1a2-47531d6a2baf',
  language: 'kuery',
  risk_score: 75,
  risk_score_mapping: [],
  name: 'Test rule',
  max_signals: 100,
  query: "user.email: 'root@elastic.co'",
  references: [],
  severity: 'high',
  severity_mapping: [],
  tags: ['APM'],
  to: 'now',
  type: 'query',
  threat: [],
  throttle: null,
  updated_at: 'mm/dd/yyyyTHH:MM:sssz',
  updated_by: 'mockUser',
};

export const rulesMock: FetchRulesResponse = {
  page: 1,
  perPage: 2,
  total: 2,
  data: [
    {
      actions: [],
      author: [],
      created_at: '2020-02-14T19:49:28.178Z',
      updated_at: '2020-02-14T19:49:28.320Z',
      created_by: 'elastic',
      description:
        'Elastic Endpoint detected Credential Dumping. Click the Elastic Endpoint icon in the event.module column or the link in the rule.reference column in the External Alerts tab of the SIEM Detections page for additional information.',
      enabled: false,
      false_positives: [],
      from: 'now-660s',
      id: '80c59768-8e1f-400e-908e-7b25c4ce29c3',
      immutable: true,
      index: ['endgame-*'],
      interval: '10m',
      rule_id: '571afc56-5ed9-465d-a2a9-045f099f6e7e',
      language: 'kuery',
      output_index: '.siem-signals-default',
      max_signals: 100,
      risk_score: 73,
      risk_score_mapping: [],
      name: 'Credential Dumping - Detected - Elastic Endpoint',
      query:
        'event.kind:alert and event.module:endgame and event.action:cred_theft_event and endgame.metadata.type:detection',
      filters: [],
      references: [],
      severity: 'high',
      severity_mapping: [],
      updated_by: 'elastic',
      tags: ['Elastic', 'Endpoint'],
      to: 'now',
      type: 'query',
      threat: [],
      throttle: null,
      version: 1,
    },
    {
      actions: [],
      author: [],
      created_at: '2020-02-14T19:49:28.189Z',
      updated_at: '2020-02-14T19:49:28.326Z',
      created_by: 'elastic',
      description:
        'Elastic Endpoint detected an Adversary Behavior. Click the Elastic Endpoint icon in the event.module column or the link in the rule.reference column in the External Alerts tab of the SIEM Detections page for additional information.',
      enabled: false,
      false_positives: [],
      from: 'now-660s',
      id: '2e846086-bd64-4dbc-9c56-42b46b5b2c8c',
      immutable: true,
      index: ['endgame-*'],
      interval: '10m',
      rule_id: '77a3c3df-8ec4-4da4-b758-878f551dee69',
      language: 'kuery',
      output_index: '.siem-signals-default',
      max_signals: 100,
      risk_score: 47,
      risk_score_mapping: [],
      name: 'Adversary Behavior - Detected - Elastic Endpoint',
      query: 'event.kind:alert and event.module:endgame and event.action:rules_engine_event',
      filters: [],
      references: [],
      severity: 'medium',
      severity_mapping: [],
      updated_by: 'elastic',
      tags: ['Elastic', 'Endpoint'],
      to: 'now',
      type: 'query',
      threat: [],
      throttle: null,
      version: 1,
    },
  ],
};
