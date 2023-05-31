# Slack Daily Notification Workflow

This sample app demonstrates how to build a daily scheduled message notification
on top of Slack's new automation platform.

You can see how it works by creating a link trigger to configure the daily
message workflow. This includes the message text, channels to notify, and the
initial date and time for the notification.

<img width="400" src="https://user-images.githubusercontent.com/19658/242213077-97d8bc50-5d3f-4da7-aa0f-bfe3e774e9a7.png">

When creating a daily scheduled trigger succeeds, you will see the following
modal:
<img width="400" src="https://user-images.githubusercontent.com/19658/242213087-f3e00fc0-9bd5-496a-9e1c-1097bc7fd398.png">

When the scheduled date and time arrives, the message you set will be
automatically posted in all the channels you selected.

<img width="400" src="https://user-images.githubusercontent.com/19658/242213092-f57f1bf0-3fc3-427e-99cb-7ed59b5e63ce.png">

If you're satisfied with a static text message, like the app's initial
implementation, you don't need to make any changes.

However, if you want to generate the message using up-to-date information for
the day, you can edit the `functions/notify.ts` file. Also, you can skip using
the `message` input parameter and remove it from the configuration UI
altogether.

## Resources

To learn more about developing automations on Slack, visit the following:

- [Automation Overview](https://api.slack.com/automation)
- [CLI Quick Reference](https://api.slack.com/automation/cli/quick-reference)
- [Samples and Templates](https://api.slack.com/automation/samples)
