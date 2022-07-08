/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { groupBy, sortBy } from 'lodash';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonIcon,
  EuiCode,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiCallOut,
  EuiLink,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { CommandArgs, CommandDefinition } from '../types';
import { useTestIdGenerator } from '../../../hooks/use_test_id_generator';
import { useDataTestSubj } from '../hooks/state_selectors/use_data_test_subj';
import { useConsoleStateDispatch } from '../hooks/state_selectors/use_console_state_dispatch';
import { HELP_GROUPS } from '../service/builtin_commands';

// @ts-expect-error TS2769
const StyledEuiBasicTable = styled(EuiBasicTable)`
  margin-top: ${({ theme: { eui } }) => eui.euiSizeS};
  .euiTableHeaderCell {
    .euiTableCellContent__text {
      font-size: 14px;
      padding-bottom: 10px;
      padding-left: 7px;
    }
  }
`;

const StyledEuiCallOut = styled(EuiCallOut)`
  margin-left: ${({ theme }) => theme.eui.euiSize};
  margin-right: ${({ theme }) => theme.eui.euiSizeS};
  margin-bottom: ${({ theme }) => theme.eui.euiSize};
`;

const StyledEuiFlexGroup = styled(EuiFlexGroup)`
  padding-left: ${({ theme }) => theme.eui.euiSizeS};
`;

export interface CommandListProps {
  commands: CommandDefinition[];
  display?: 'default' | 'table';
}

const COMMON_ARGS = [
  {
    name: '--comment',
    about: i18n.translate('xpack.securitySolution.console.commandList.commonArgs.comment', {
      defaultMessage: 'Add comment to any action Ex: isolate --comment your comment',
    }),
  },
  {
    name: '--help',
    about: i18n.translate('xpack.securitySolution.console.commandList.commonArgs.help', {
      defaultMessage: 'Command assistance Ex: isolate --help',
    }),
  },
];

export const CommandList = memo<CommandListProps>(({ commands, display = 'default' }) => {
  const getTestId = useTestIdGenerator(useDataTestSubj());
  const dispatch = useConsoleStateDispatch();

  const footerMessage = useMemo(() => {
    return (
      <FormattedMessage
        id="xpack.securitySolution.console.commandList.footerText"
        defaultMessage="For more details on the commands above use the {helpOption} argument. Example: {cmdExample}"
        values={{
          helpOption: <EuiCode>{'--help'}</EuiCode>,
          cmdExample: <EuiCode>{'some-command --help'}</EuiCode>,
        }}
      />
    );
  }, []);

  const commandsByGroups = useMemo(() => {
    return Object.values(groupBy(commands, 'helpGroupLabel')).reduce<CommandDefinition[][]>(
      (acc, current) => {
        if (current[0].helpGroupPosition !== undefined) {
          // If it already exists just move it to the end
          if (acc[current[0].helpGroupPosition]) {
            acc[acc.length] = acc[current[0].helpGroupPosition];
          }

          acc[current[0].helpGroupPosition] = sortBy(current, 'helpCommandPosition');
        } else if (current.length) {
          acc.push(current);
        }
        return acc;
      },
      []
    );
  }, [commands]);

  const getTableItems = useCallback(
    (
      commandsByGroup: CommandDefinition[]
    ): Array<{
      [key: string]: { name: string; about: React.ElementType | string };
    }> => {
      if (commandsByGroup[0].helpGroupLabel === HELP_GROUPS.supporting.label) {
        return [...COMMON_ARGS, ...commandsByGroup].map((command) => {
          return {
            [commandsByGroup[0]?.helpGroupLabel ?? 'Other commands']: command,
          };
        });
      }
      return commandsByGroup.map((command) => {
        return {
          [commandsByGroup[0]?.helpGroupLabel ?? 'Other commands']: command,
        };
      });
    },
    []
  );

  const getCommandNameWithArgs = useCallback((command: CommandDefinition) => {
    if (!command.mustHaveArgs || !command.args) {
      return command.name;
    }

    let hasAnExclusiveOrArg = false;
    const primaryArgs = Object.entries(command.args).reduce<CommandArgs>((acc, [key, value]) => {
      if (value.required) {
        acc[key] = value;
        return acc;
      }
      if (value.exclusiveOr && !hasAnExclusiveOrArg) {
        hasAnExclusiveOrArg = true;
        acc[key] = value;
        return acc;
      }
      return acc;
    }, {});

    return `${command.name} --${Object.keys(primaryArgs).join(' --')}`;
  }, []);

  const getColumns = useCallback(
    (commandsByGroup) => {
      return [
        {
          field: commandsByGroup[0]?.helpGroupLabel ?? 'Other commands',
          name: commandsByGroup[0]?.helpGroupLabel ?? 'Other commands',
          render: (command: CommandDefinition) => {
            const commandNameWithArgs = getCommandNameWithArgs(command);
            return (
              <StyledEuiFlexGroup alignItems="center">
                <EuiFlexItem grow={1}>
                  <EuiDescriptionList
                    compressed
                    listItems={[
                      {
                        title: <EuiBadge>{commandNameWithArgs}</EuiBadge>,
                        description: <>{command.about}</>,
                      },
                    ]}
                    data-test-subj={getTestId('commandList-command')}
                  />
                </EuiFlexItem>
                {command.RenderComponent && (
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      iconType="plusInCircle"
                      aria-label={`updateTextInputCommand-${command.name}`}
                      onClick={() => {
                        dispatch({
                          type: 'updateInputTextEnteredState',
                          payload: () => {
                            return {
                              textEntered: `${commandNameWithArgs} `,
                            };
                          },
                        });
                      }}
                    />
                  </EuiFlexItem>
                )}
              </StyledEuiFlexGroup>
            );
          },
        },
      ];
    },
    [dispatch, getCommandNameWithArgs, getTestId]
  );

  if (display === 'table') {
    const callout = (
      <StyledEuiCallOut
        title={
          <FormattedMessage
            id="xpack.securitySolution.console.commandList.callout.title"
            defaultMessage="Do you know?"
          />
        }
      >
        <EuiText size="s">
          <FormattedMessage
            id="xpack.securitySolution.console.commandList.callout.multipleResponses"
            defaultMessage="1. You may enter multiple response actions at the same time."
          />
        </EuiText>
        <EuiText size="s">
          <FormattedMessage
            id="xpack.securitySolution.console.commandList.callout.leavingResponder"
            defaultMessage="2. Leaving the responder does not abort the actions."
          />
        </EuiText>
        <EuiText size="s">
          <FormattedMessage
            id="xpack.securitySolution.console.commandList.callout.visitSupportSections"
            defaultMessage="3. Visit support section to read more about manual response actions."
          />
        </EuiText>
        <EuiSpacer />
        {/* //TODO: Add link to the read more */}
        <EuiLink>
          <FormattedMessage
            id="xpack.securitySolution.console.commandList.callout.readMoreLink"
            defaultMessage="Read more"
          />
        </EuiLink>
      </StyledEuiCallOut>
    );

    return (
      <>
        {commandsByGroups.map((commandsByGroup) => (
          <StyledEuiBasicTable
            items={getTableItems(commandsByGroup)}
            columns={getColumns(commandsByGroup)}
          />
        ))}
        <EuiSpacer size="s" />
        {callout}
      </>
    );
  } else {
    return (
      <>
        <EuiSpacer />
        {commandsByGroups.map((commandsByGroup) => {
          const groupLabel = commandsByGroup[0].helpGroupLabel;
          const groupedCommands =
            groupLabel === HELP_GROUPS.supporting.label
              ? [...commandsByGroup, ...(COMMON_ARGS as CommandDefinition[])]
              : commandsByGroup;
          return (
            <EuiFlexGrid columns={3} responsive={false} gutterSize="m" key={groupLabel}>
              {groupedCommands.map((command) => {
                return (
                  <EuiFlexItem key={command.name}>
                    <EuiDescriptionList
                      compressed
                      listItems={[
                        {
                          title: <EuiBadge>{getCommandNameWithArgs(command)}</EuiBadge>,
                          description: <>{command.about}</>,
                        },
                      ]}
                      data-test-subj={getTestId('commandList-command')}
                    />
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGrid>
          );
        })}
        <EuiSpacer />
        <EuiText size="s">
          <EuiTextColor color="subdued">{footerMessage}</EuiTextColor>
        </EuiText>
      </>
    );
  }
});
CommandList.displayName = 'CommandList';
