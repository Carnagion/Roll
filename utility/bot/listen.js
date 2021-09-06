const FileSystem = require("fs");
const { Collection } = require("discord.js");

const { bot } = require("./login.js");

module.exports = function listen()
{
    bot.commands = new Collection();
    const commandFiles = FileSystem.readdirSync("./commands").filter(filePath => filePath.endsWith(".js"));
    for (let filePath of commandFiles)
    {
        let command = require(`../../commands/${filePath}`);
        bot.commands.set(command.data.name, command);
    }
    
    bot.on("interactionCreate", async (interaction) =>
    {
        if (interaction.member.user.bot)
        {
            return;
        }
        if (!interaction.isCommand())
        {
            return;
        }

        try
        {
            let command = bot.commands.get(interaction.commandName);
            if (command == null)
            {
                return;
            }
            await command.execute(interaction);
        }
        catch (error)
        {
            console.error(error);
            await interaction.reply(
                {
                    content: "Something went wrong while executing that command.",
                    ephemeral: true,
                }
            );
        }
    });
}