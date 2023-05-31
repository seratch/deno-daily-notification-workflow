import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

export const PostedMessage = DefineType({
  name: "PostedMessage",
  type: Schema.types.object,
  properties: {
    channel_id: { type: Schema.slack.types.channel_id },
    ts: { type: Schema.types.string },
  },
  required: ["channel_id", "ts"],
});
