import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ModalView, ScheduledTrigger } from "slack-web-api-client/index.ts";
import { SlackAPIClient } from "slack-web-api-client/mod.ts";

export const def = DefineFunction({
  callback_id: "configure",
  title: "Manage scheduled triggers",
  source_file: "functions/configure.ts",
  input_parameters: {
    properties: {
      interactivity_pointer: { type: Schema.types.string },
      workflow_callback_id: { type: Schema.types.string },
    },
    required: [
      "interactivity_pointer",
      "workflow_callback_id",
    ],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(def, async ({ inputs, token }) => {
  const client = new SlackAPIClient(token);
  const { interactivity_pointer, workflow_callback_id } = inputs;
  // ---------------------------
  // Open a modal for configuring the channel list
  // ---------------------------
  const triggerToUpdate = await findTriggerToUpdate(
    client,
    workflow_callback_id,
  );
  console.log(`triggerToUpdate: ${JSON.stringify(triggerToUpdate)}`);

  const initialSchedule = triggerToUpdate?.schedule.start_time;
  const channelIds = triggerToUpdate?.inputs.channel_ids != undefined
    ? triggerToUpdate.inputs.channel_ids.value.split(",")
    : [];

  // Open the modal to configure the channel list to enable this workflow
  try {
    const response = await client.views.open({
      interactivity_pointer,
      view: buildModalView(
        "Hi there! This is a scheduled message :wave:",
        initialSchedule,
        channelIds,
      ),
    });
    console.log(`views.open API response: ${response}`);
  } catch (e) {
    console.log(`views.open API error: ${e}`);
    const error =
      `Failed to open a modal in the configurator workflow. Contact the app maintainers with the following information - (error: ${e})`;
    return { error };
  }
  return {
    // Set this to continue the interaction with this user
    completed: false,
  };
})
  // ---------------------------
  // view_submission handler
  // ---------------------------
  .addViewSubmissionHandler(
    ["configure-workflow"],
    async ({ view, inputs, token }) => {
      const client = new SlackAPIClient(token);

      const { workflow_callback_id } = inputs;
      const values = view.state.values;
      const message = values.message.message.value;
      const channelIds = values.channels.channels.selected_channels;
      const initialSchedule: number =
        values.datetime.datetime.selected_date_time * 1000;

      if (initialSchedule - new Date().getTime() < 0) {
        return {
          response_action: "errors",
          errors: {
            datetime: "The initial schedule must be a future date time",
          },
        };
      }

      let modalMessage =
        "*You're all set!*\n\nThe app is now available for the channels :white_check_mark:";
      try {
        // Only when the bot is in all the specified channels,
        // we can set the channel ID list to the trigger
        const triggerToUpdate = await findTriggerToUpdate(
          client,
          workflow_callback_id,
        );
        // If the trigger already exists, we update it.
        // Otherwise, we create a new one.
        await createOrUpdateTrigger(
          client,
          workflow_callback_id,
          message,
          initialSchedule,
          channelIds,
          triggerToUpdate,
        );
      } catch (e) {
        console.log(`Failed to create/update a trigger: ${e}`);
        modalMessage = e;
      }
      // nothing to return if you want to close this modal
      return buildModalUpdateResponse(modalMessage);
    },
  )
  // ---------------------------
  // view_closed handler
  // ---------------------------
  .addViewClosedHandler(
    ["configure-workflow"],
    ({ view }) => {
      console.log(`view_closed handler called: ${JSON.stringify(view)}`);
      return {
        outputs: {},
        completed: true,
      };
    },
  );

// ---------------------------
// Internal functions
// ---------------------------

function buildModalView(
  message: string,
  initialSchedule: string | undefined,
  channelIds: string[],
): ModalView {
  const initial_date_time = initialSchedule
    ? (new Date(initialSchedule).getTime() / 1000)
    : undefined;
  return {
    "type": "modal",
    "callback_id": "configure-workflow",
    "title": {
      "type": "plain_text",
      "text": "Daily Notification",
    },
    "submit": {
      "type": "plain_text",
      "text": "Confirm",
    },
    "notify_on_close": true,
    "blocks": [
      {
        "type": "input",
        "block_id": "message",
        "label": { "type": "plain_text", "text": "Message" },
        "element": {
          "type": "plain_text_input",
          "action_id": "message",
          "multiline": true,
          "initial_value": message,
        },
      },
      {
        "type": "input",
        "block_id": "channels",
        "label": { "type": "plain_text", "text": "Channels to notify" },
        "element": {
          "type": "multi_channels_select",
          "action_id": "channels",
          "initial_channels": channelIds,
        },
      },
      {
        "type": "input",
        "block_id": "datetime",
        "label": { "type": "plain_text", "text": "Initial schedule" },
        "element": {
          "type": "datetimepicker",
          "action_id": "datetime",
          "initial_date_time": initial_date_time,
        },
      },
    ],
  };
}

function buildModalUpdateResponse(modalMessage: string) {
  return {
    response_action: "update",
    view: {
      "type": "modal",
      "callback_id": "configure-workflow",
      "notify_on_close": true,
      "title": {
        "type": "plain_text",
        "text": "Daily Notification",
      },
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": modalMessage,
          },
        },
      ],
    },
  };
}

export async function findTriggerToUpdate(
  client: SlackAPIClient,
  workflowCallbackId: string,
): Promise<ScheduledTrigger | undefined> {
  // Check the existing triggers for this workflow
  const allTriggers = await client.workflows.triggers.list({ is_owner: true });
  let triggerToUpdate = undefined;

  // find the trigger to update
  if (allTriggers.triggers) {
    for (const trigger of allTriggers.triggers) {
      if (
        trigger.workflow.callback_id === workflowCallbackId &&
        trigger.type === "scheduled"
      ) {
        triggerToUpdate = trigger;
      }
    }
  }
  console.log(`The trigger to update: ${JSON.stringify(triggerToUpdate)}`);
  return triggerToUpdate;
}

export async function createOrUpdateTrigger(
  client: SlackAPIClient,
  workflowCallbackId: string,
  message: string,
  initialSchedule: number,
  channelIds: string[],
  triggerToUpdate?: ScheduledTrigger,
) {
  if (triggerToUpdate === undefined) {
    // Create a new trigger
    const creation = await client.workflows.triggers.create({
      type: "scheduled",
      name: "Scheduled trigger for notification",
      workflow: `#/workflows/${workflowCallbackId}`,
      schedule: {
        start_time: new Date(initialSchedule).toISOString(),
        end_time: "2040-05-01T14:00:00Z",
        frequency: { type: "daily" },
      },
      inputs: {
        channel_ids: { value: channelIds.join(",") },
        message: { value: message },
      },
    });
    if (creation.error) {
      throw new Error(
        `Failed to create a trigger! (response: ${JSON.stringify(creation)})`,
      );
    }
    console.log(`A new trigger created: ${JSON.stringify(creation)}`);
  } else {
    // Update the existing trigger
    const update = await client.workflows.triggers.update({
      trigger_id: triggerToUpdate.id,
      type: "scheduled",
      name: "Scheduled trigger for notification",
      workflow: `#/workflows/${workflowCallbackId}`,
      schedule: {
        start_time: new Date(initialSchedule).toISOString(),
        end_time: "2040-05-01T14:00:00Z",
        frequency: { type: "daily" },
      },
      inputs: {
        channel_ids: { value: channelIds.join(",") },
        message: { value: message },
      },
    });
    if (update.error) {
      throw new Error(
        `Failed to update a trigger! (response: ${JSON.stringify(update)})`,
      );
    }
    console.log(`The trigger updated: ${JSON.stringify(update)}`);
  }
}
