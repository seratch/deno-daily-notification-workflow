import { Manifest } from "deno-slack-sdk/mod.ts";
import { def as Configure } from "./functions/configure.ts";
import { def as Notify } from "./functions/notify.ts";
import Configurator from "./workflows/configurator.ts";
import Notification from "./workflows/notification.ts";
import { PostedMessage } from "./types/posted_message.ts";

export default Manifest({
  name: "daily-notification",
  description: "Daily notiication in channels",
  icon: "assets/default_new_app_icon.png",
  functions: [Configure, Notify],
  workflows: [Configurator, Notification],
  outgoingDomains: [],
  types: [PostedMessage],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "triggers:read",
    "triggers:write",
  ],
});
