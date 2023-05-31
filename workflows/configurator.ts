import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { def as Configure } from "../functions/configure.ts";
import Notification from "./notification.ts";

const workflow = DefineWorkflow({
  callback_id: "configurator",
  title: "Configure the daily notification workflow",
  input_parameters: {
    properties: { interactivity: { type: Schema.slack.types.interactivity } },
    required: ["interactivity"],
  },
});

workflow.addStep(Configure, {
  interactivity_pointer: workflow.inputs.interactivity.interactivity_pointer,
  workflow_callback_id: Notification.definition.callback_id,
});

export default workflow;
