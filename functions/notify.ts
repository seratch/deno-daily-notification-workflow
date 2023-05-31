import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "slack-web-api-client/mod.ts";
import { PostedMessage } from "../types/posted_message.ts";

export const def = DefineFunction({
  callback_id: "notify",
  title: "Notify in a channel",
  source_file: "functions/notify.ts",
  input_parameters: {
    properties: {
      channel_ids: { type: Schema.types.string },
      message: { type: Schema.types.string },
    },
    required: ["channel_ids"],
  },
  output_parameters: {
    properties: {
      messages: {
        type: Schema.types.array,
        items: { type: PostedMessage },
      },
    },
    required: ["messages"],
  },
});

export default SlackFunction(def, async ({ inputs, token }) => {
  const client = new SlackAPIClient(token);
  const messages = [];
  try {
    for (const channel of inputs.channel_ids.split(",")) {
      const response = await client.chat.postMessage({
        channel,
        text: inputs.message ??
          "Hi there! This is a scheduled daily message :wave:",
      });
      messages.push({ channel_id: response.channel!, ts: response.ts! });
      console.log(response);
    }
  } catch (e) {
    return { error: `Failed to notify: ${e}` };
  }
  return { outputs: { messages } };
});
