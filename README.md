Discord bot for dao-tool integration

---

Permissions:

1. Read Messages
- This is required to access channels and read messages so that the bot can retrieve user's inputs in multi-step commands
- For example: `title`, `duration`, `threshold`, etc values are retrieved from the subsequent message after executing the `/start` command.

2. Send Messages
- This is required for the bot to send messages in the channel where a command is executed.
- For example: sending `Event has ended!` message

3. Embed Links
- This is required so that any links sent by the bot has a preview (embedded links) attached for better visibilty.
- For example: the bot sends the <ins>`app.rep3.gg`</ins> link for eligible users to claim their memberships.
