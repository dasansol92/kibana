/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { pageObjects as xpackFunctionalPageObjects } from '../../functional/page_objects';
import { EndpointPageProvider } from './endpoint_page';
import { EndpointPageUtils } from './page_utils';
import { IngestManagerCreatePackagePolicy } from './ingest_manager_create_package_policy_page';
import { DetectionsPageObject } from '../../security_solution_ftr/page_objects/detections';
import { HostsPageObject } from '../../security_solution_ftr/page_objects/hosts';
import { EndpointResponderPageObjects } from './endpoint_responder';
import { TimelinePageObject } from '../../security_solution_ftr/page_objects/timeline';

export const pageObjects = {
  ...xpackFunctionalPageObjects,
  endpoint: EndpointPageProvider,
  endpointPageUtils: EndpointPageUtils,
  ingestManagerCreatePackagePolicy: IngestManagerCreatePackagePolicy,
  detections: DetectionsPageObject,
  timeline: TimelinePageObject,
  hosts: HostsPageObject,
  responder: EndpointResponderPageObjects,
};
