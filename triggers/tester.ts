import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import Workflow from "../workflows/notification.ts";

const trigger: Trigger<typeof Workflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Link trigger for local development",
  workflow: `#/workflows/${Workflow.definition.callback_id}`,
  inputs: {
    channel_ids: { value: TriggerContextData.Shortcut.channel_id },
    message: { value: "Hi there! This is a scheduled daily message :wave:" },
  },
};

export default trigger;
