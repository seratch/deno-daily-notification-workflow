import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import Workflow from "../workflows/configurator.ts";

const trigger: Trigger<typeof Workflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Configure the daily notification workflow",
  workflow: `#/workflows/${Workflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
  },
};

export default trigger;
