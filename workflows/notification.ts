import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { def as Notify } from "../functions/notify.ts";

const workflow = DefineWorkflow({
  callback_id: "notification",
  title: "Notification",
  input_parameters: {
    properties: {
      channel_ids: { type: Schema.types.string },
      message: { type: Schema.types.string },
    },
    required: ["channel_ids"],
  },
});

workflow.addStep(Notify, {
  channel_ids: workflow.inputs.channel_ids,
  message: workflow.inputs.message,
});

export default workflow;
