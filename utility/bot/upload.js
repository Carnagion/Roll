const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const FileSystem = require("fs");
const dotEnv = require("dotenv");

module.exports = function upload()
{
    dotEnv.config();
    
    let commands = [];
    let commandFilePaths = FileSystem.readdirSync("./commands").filter(filePath => filePath.endsWith(".js"));
    for (let filePath of commandFilePaths)
    {
        let command =  require(`../../commands/${filePath}`);
        commands.push(command.data.toJSON());
    };
    
    let rest = new REST(
        {
            version: "9",
        }
    ).setToken(process.env.TOKEN);
    (async () => 
    {
        try
        {
            console.log("\nUploading commands...");
            await rest.put(
                Routes.applicationCommands(process.env.APPID),
                {
                    body: commands,
                });
            console.log("Successfully uploaded commands.");
        }
        catch (error)
        {
            console.log("Failed to upload commands.");
            console.error(error);
        }
    })();
}