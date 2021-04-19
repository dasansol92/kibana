/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EventFilterForm } from '.';
import { RenderResult, act, render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { stubIndexPatternWithFields } from 'src/plugins/data/common/index_patterns/index_pattern.stub';
import { getInitialExceptionFromEvent } from '../../../store/utils';
import { Provider } from 'react-redux';
import { useFetchIndex } from '../../../../../../common/containers/source';
import { ThemeProvider } from 'styled-components';
import { createGlobalNoMiddlewareStore, event } from '../../../test_utils';
import { getMockTheme } from '../../../../../../common/lib/kibana/kibana_react.mock';
import { NAME_ERROR, NAME_PLACEHOLDER } from './translations';
import { useCurrentUser, useKibana } from '../../../../../../common/lib/kibana';

jest.mock('../../../../../../common/lib/kibana');
jest.mock('../../../../../../common/containers/source');

const mockTheme = getMockTheme({
  eui: {
    paddingSizes: { m: '2' },
  },
});

describe('Event filter form', () => {
  let component: RenderResult;
  let store: ReturnType<typeof createGlobalNoMiddlewareStore>;

  const renderForm = () => {
    const Wrapper: React.FC = ({ children }) => (
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
      </Provider>
    );

    return render(<EventFilterForm />, { wrapper: Wrapper });
  };

  const renderComponentWithdata = () => {
    const entry = getInitialExceptionFromEvent(event);
    act(() => {
      store.dispatch({
        type: 'eventFilterInitForm',
        payload: { entry },
      });
    });
    return renderForm();
  };

  beforeEach(() => {
    (useFetchIndex as jest.Mock).mockImplementation(() => [
      false,
      {
        indexPatterns: stubIndexPatternWithFields,
      },
    ]);
    (useCurrentUser as jest.Mock).mockReturnValue({ username: 'test-username' });
    (useKibana as jest.Mock).mockReturnValue({
      services: {
        http: {},
        data: {},
        notifications: {},
      },
    });
    store = createGlobalNoMiddlewareStore();
  });
  it('should renders correctly without data', () => {
    component = renderForm();
    component.getByTestId('loading-spinner');
  });

  it('should renders correctly with data', () => {
    component = renderComponentWithdata();

    component.getByText(event.process!.executable![0]);
    component.getByText(NAME_ERROR);
  });

  it('should change name', async () => {
    component = renderComponentWithdata();

    const nameInput = component.getByPlaceholderText(NAME_PLACEHOLDER);

    act(() => {
      fireEvent.change(nameInput, {
        target: {
          value: 'Exception name',
        },
      });
    });

    expect(store.getState()!.management!.eventFilter!.form!.entry!.name).toBe('Exception name');
    expect(store.getState()!.management!.eventFilter!.form!.hasNameError).toBeFalsy();
  });

  it('should change comments', async () => {
    component = renderComponentWithdata();

    const commentInput = component.getByPlaceholderText('Add a new comment...');

    act(() => {
      fireEvent.change(commentInput, {
        target: {
          value: 'Exception comment',
        },
      });
    });

    expect(store.getState()!.management!.eventFilter!.form!.entry!.comments![0].comment).toBe(
      'Exception comment'
    );
  });
});
