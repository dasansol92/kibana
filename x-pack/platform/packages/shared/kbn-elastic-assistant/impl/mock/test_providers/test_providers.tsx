/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
/* eslint-disable no-console */
import { httpServiceMock } from '@kbn/core-http-browser-mocks';
import { I18nProvider } from '@kbn/i18n-react';
import { actionTypeRegistryMock } from '@kbn/triggers-actions-ui-plugin/public/application/action_type_registry.mock';
import React from 'react';

import { EuiThemeProvider as ThemeProvider } from '@elastic/eui';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfileService } from '@kbn/core/public';
import { AssistantProvider, AssistantProviderProps } from '../../assistant_context';
import { AssistantAvailability } from '../../assistant_context/types';

interface Props {
  assistantAvailability?: AssistantAvailability;
  children: React.ReactNode;
  providerContext?: Partial<AssistantProviderProps>;
}

window.scrollTo = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

export const mockAssistantAvailability: AssistantAvailability = {
  hasAssistantPrivilege: false,
  hasConnectorsAllPrivilege: true,
  hasConnectorsReadPrivilege: true,
  hasUpdateAIAssistantAnonymization: true,
  hasManageGlobalKnowledgeBase: true,
  isAssistantEnabled: true,
};

/** A utility for wrapping children in the providers required to run tests */
export const TestProvidersComponent: React.FC<Props> = ({
  assistantAvailability = mockAssistantAvailability,
  children,
  providerContext,
}) => {
  const actionTypeRegistry = actionTypeRegistryMock.create();
  actionTypeRegistry.get = jest.fn().mockReturnValue({
    id: '12345',
    actionTypeId: '.gen-ai',
    actionTypeTitle: 'OpenAI',
    iconClass: 'logoGenAI',
  });
  const mockGetComments = jest.fn(() => []);
  const mockHttp = httpServiceMock.createStartContract({ basePath: '/test' });
  const mockNavigateToApp = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });

  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AssistantProvider
            actionTypeRegistry={actionTypeRegistry}
            assistantAvailability={assistantAvailability}
            augmentMessageCodeBlocks={jest.fn().mockReturnValue([])}
            basePath={'https://localhost:5601/kbn'}
            docLinks={{
              ELASTIC_WEBSITE_URL: 'https://www.elastic.co/',
              DOC_LINK_VERSION: 'current',
            }}
            getComments={mockGetComments}
            http={mockHttp}
            baseConversations={{}}
            navigateToApp={mockNavigateToApp}
            {...providerContext}
            currentAppId={'test'}
            userProfileService={jest.fn() as unknown as UserProfileService}
          >
            {children}
          </AssistantProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};

TestProvidersComponent.displayName = 'TestProvidersComponent';

export const TestProviders = React.memo(TestProvidersComponent);
