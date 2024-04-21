import { useAddonState, useChannel } from "@storybook/manager-api";
import { AddonPanel, Form } from "@storybook/components";
import { ADDON_ID, EVENTS } from "./constants";
import { PanelContent } from "./components/PanelContent";
import type { MockedResponse } from "@apollo/client/testing";
import type { OperationDefinitionNode } from "graphql";
import { STORY_CHANGED, STORY_RENDERED } from "@storybook/core-events";
import { ApolloAddonState } from "./types";
import { Addon_RenderOptions } from "@storybook/types";
import { useEffect, useState } from "react";

const getMockName = (mockedResponse: MockedResponse): string => {
  if (mockedResponse.request.operationName) {
    return mockedResponse.request.operationName;
  }

  const operationDefinition = mockedResponse.request.query.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === "OperationDefinition",
  );

  if (operationDefinition && operationDefinition.name) {
    return operationDefinition.name.value;
  }

  return `Unnamed`;
};

export const Panel: React.FC<Partial<Addon_RenderOptions>> = ({
  active = false,
}) => {
  const [activeMockIndex, setActiveMockIndex] = useState(-1);
  const [state, setState] = useAddonState<ApolloAddonState>(ADDON_ID, {
    mocks: [],
    queries: [],
  });

  const emit = useChannel({
    [EVENTS.RESULT]: (apolloAddonState: ApolloAddonState) => {
      setState(apolloAddonState);
      setActiveMockIndex((prev) => {
        if (prev === -1) {
          return apolloAddonState.mocks.length ? 0 : -1;
        }

        return apolloAddonState.mocks[prev]
          ? prev
          : apolloAddonState.mocks.length
            ? 0
            : -1;
      });
    },
    [STORY_RENDERED]: () => {
      emit(EVENTS.REQUEST);
    },
    [STORY_CHANGED]: () => {
      emit(EVENTS.REQUEST);
    },
  });

  useEffect(() => {
    emit(EVENTS.REQUEST);
  }, []);

  const activeMock = state.mocks[activeMockIndex];
  const activeQuery = state.queries[activeMockIndex];

  return (
    <AddonPanel active={active}>
      <Form.Field label="Mock">
        <Form.Select
          size="flex"
          value={activeMockIndex}
          disabled={!state.mocks.length}
          onChange={(event) => {
            const { value } = event.currentTarget;
            setActiveMockIndex(Number(value));
          }}
        >
          <option value="">Select a mock</option>
          {state.mocks.map((mockedResponse, index) => (
            <option key={index} value={index}>
              {getMockName(mockedResponse)}
            </option>
          ))}
        </Form.Select>
      </Form.Field>
      <PanelContent mock={activeMock} query={activeQuery} />
    </AddonPanel>
  );
};
