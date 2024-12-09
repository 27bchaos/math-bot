const { Client, GatewayIntentBits } = require("discord.js");
const { spawn } = require("child_process");
require("dotenv").config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const token = process.env.TOKEN; // Replace with your bot token
const ownerId = process.env.OWNER_ID; // Replace with your Discord user ID

let botStartTime = Date.now(); // Track the bot's startup time
let isInMaintenance = false; // Maintenance flag (set to true to enable maintenance mode)

client.once("ready", () => {
  console.log("Bot is ready! s");
  console.log("Logged in as:", client.user.tag);
});

// Maintenance mode message
function sendMaintenanceMessage(message) {
  message.reply(
    "The bot is currently under maintenance and cannot respond to commands at the moment. Please try again later."
  );
}

// Handle incoming messages
client.on("messageCreate", (message) => {
  if (message.author.bot) return; // Ignore messages from other bots

  // Allow the bot owner to toggle maintenance mode without restriction
  if (
    message.content.toLowerCase().startsWith("!maintenance") &&
    message.author.id === ownerId
  ) {
    const args = message.content.split(" ");
    const action = args[1]; // 'on' or 'off'

    if (action === "on") {
      if (isInMaintenance) {
        message.reply("Maintenance mode is already enabled.");
      } else {
        isInMaintenance = true;
        message.reply("Maintenance mode has been enabled.");
      }
    } else if (action === "off") {
      if (!isInMaintenance) {
        message.reply("Maintenance mode is already disabled.");
      } else {
        isInMaintenance = false;
        message.reply("Maintenance mode has been disabled.");
      }
    } else {
      message.reply(
        "Please use `!maintenance on` to enable or `!maintenance off` to disable maintenance mode."
      );
    }
    return; // Skip the maintenance check for other commands
  }

  // If the bot is in maintenance mode, prevent further command execution
  if (isInMaintenance) {
    sendMaintenanceMessage(message);
    return;
  }

  // Command to change the bot's status
  if (message.content.toLowerCase().startsWith("!status")) {
    if (message.author.id !== ownerId) {
      message.reply("You do not have permission to change the bot's status.");
      return;
    }

    const args = message.content.split(" ");
    const status = args[1]; // 'online', 'dnd', 'idle', 'invisible'

    if (!status) {
      return message.reply(
        "Please provide a status: `online`, `dnd`, `idle`, or `invisible`."
      );
    }

    switch (status.toLowerCase()) {
      case "online":
        client.user.setPresence({ status: "online" });
        message.reply("Bot status set to Online.");
        break;
      case "dnd":
        client.user.setPresence({ status: "dnd" });
        message.reply("Bot status set to Do Not Disturb (DND).");
        break;
      case "idle":
        client.user.setPresence({ status: "idle" });
        message.reply("Bot status set to Idle.");
        break;
      case "invisible":
        client.user.setPresence({ status: "invisible" });
        message.reply("Bot status set to Invisible.");
        break;
      default:
        message.reply(
          "Invalid status. Please use `online`, `dnd`, `idle`, or `invisible`."
        );
        break;
    }
    return;
  }

  // Example Commands:
  // Command: !ping
  if (message.content.toLowerCase() === "!ping") {
    message.reply("Pong!");
  }

  // Command: !hello
  if (message.content.toLowerCase() === "!hello") {
    message.reply("Hello there!");
  }

  // Command: !help
  if (message.content.toLowerCase() === "!help") {
    const helpMessage = `
        **Bot Commands:**
        - \`!ping\`: Responds with "Pong!"
        - \`!hello\`: Greets you with "Hello there!"
        - \`!userinfo\`: Displays information about the user.
        - \`!serverinfo\`: Displays server (guild) information.
        - \`!uptime\`: Shows the bot's uptime.
        - \`!avatar [user]\`: Shows the avatar of the mentioned user or yourself.
        - \`!kick @user\`: Kicks a user from the server (admin only).
        - \`!ban @user\`: Bans a user from the server (admin only).
        - \`!shutdown\`: Shuts down the bot (owner only).
        - \`!restart\`: Restarts the bot (owner only).
        - \`!maintenance on/off\`: Toggles maintenance mode (owner only).
        - \`!status [online|dnd|idle|invisible]\`: Changes the bot's status (owner only).
        `;
    message.reply(helpMessage);
  }

  // Command: !userinfo
  if (message.content.toLowerCase() === "!userinfo") {
    const user = message.author;
    const userInfo = `
        **User Info:**
        - Username: ${user.username}
        - ID: ${user.id}
        - Tag: ${user.tag}
        - Created At: ${user.createdAt}
        `;
    message.reply(userInfo);
  }

  // Command: !serverinfo
  if (message.content.toLowerCase() === "!serverinfo") {
    const guild = message.guild;
    const serverInfo = `
        **Server Info:**
        - Name: ${guild.name}
        - ID: ${guild.id}
        - Created At: ${guild.createdAt}
        - Member Count: ${guild.memberCount}
        `;
    message.reply(serverInfo);
  }

  // Command: !uptime
  if (message.content.toLowerCase() === "!uptime") {
    const uptime = Math.floor((Date.now() - botStartTime) / 1000); // Convert to seconds
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    message.reply(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
  }

  // Command: !avatar
  if (message.content.toLowerCase().startsWith("!avatar")) {
    let user = message.mentions.users.first() || message.author;
    message.reply(`${user.username}'s Avatar: ${user.displayAvatarURL()}`);
  }

  // Command: !kick (requires admin permissions)
  if (message.content.toLowerCase().startsWith("!kick")) {
    if (!message.member.permissions.has("KICK_MEMBERS")) {
      message.reply("You don't have permission to kick members.");
      return;
    }
    const memberToKick = message.mentions.members.first();
    if (!memberToKick) {
      message.reply("Please mention a user to kick.");
      return;
    }
    memberToKick
      .kick()
      .then(() => message.reply(`${memberToKick.user.tag} has been kicked.`))
      .catch((err) => message.reply("Failed to kick the user."));
  }

  // Command: !ban (requires admin permissions)
  if (message.content.toLowerCase().startsWith("!ban")) {
    if (!message.member.permissions.has("BAN_MEMBERS")) {
      message.reply("You don't have permission to ban members.");
      return;
    }
    const memberToBan = message.mentions.members.first();
    if (!memberToBan) {
      message.reply("Please mention a user to ban.");
      return;
    }
    memberToBan
      .ban()
      .then(() => message.reply(`${memberToBan.user.tag} has been banned.`))
      .catch((err) => message.reply("Failed to ban the user."));
  }

  // Command: !shutdown (only for bot owner)
  if (message.content.toLowerCase() === "!shutdown") {
    if (message.author.id !== ownerId) {
      message.reply("You do not have permission to shut down the bot.");
      return;
    }
    message.reply("Shutting down the bot...");
    console.log("Shutting down the bot...");
    client.destroy(); // Log the bot out
  }

  // Command: !restart (only for bot owner)
  if (message.content.toLowerCase() === "!restart") {
    if (message.author.id !== ownerId) {
      message.reply("You do not have permission to restart the bot.");
      return;
    }
    message
      .reply("Restarting the bot...")
      .then(() => {
        console.log("Restarting the bot...");
        setTimeout(() => {
          spawn(process.argv[0], process.argv.slice(1), {
            detached: true,
            stdio: "inherit",
          });
          process.exit(0); // Exit the process
        }, 1000); // Wait 1 second before exiting to ensure the reply is sent
      })
      .catch(console.error);
  }
});

// Log in to Discord
client
  .login(token)
  .then(() => console.log("Bot logged in successfully!"))
  .catch((err) => {
    console.error("Failed to login:", err);
    process.exit(1);
  });
