const { Permissions } = require("discord.js");

module.exports = function stringIsPermission(string)
{
    for (let permission in Permissions.FLAGS)
    {
        if (permission.toString().toLowerCase() === string.toLowerCase())
        {
            return true;
        }
    }
    return false;
}