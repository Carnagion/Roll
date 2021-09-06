const Discord = require("discord.js");
const dotEnv = require("dotenv");

const Intents =  
[
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
];

const Bot = new Discord.Client(
    {
        intents: Intents,
    }
);

module.exports = 
{
    bot: Bot,
    login: function()
    {
        dotEnv.config();
        
        Bot.once("ready", () =>
        {
            console.log("\nLet's roll.\n");
        })
        Bot.login(process.env.TOKEN);
    },
}