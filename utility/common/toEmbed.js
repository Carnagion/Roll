const { MessageEmbed } = require("discord.js");

module.exports = function toEmbed(role)
{
    return new MessageEmbed()
        .setColor(role.hexColor)
        .setTitle(role.name)
        .setDescription(`ID: ${role.id}`)
        .addFields(
            {
                name: "Created on",
                value: role.createdAt.toString(),
                inline: false,
            },
            {
                name: "Member count",
                value: role.members.values().length ?? "0",
                inline: true,
            },
            {
                name: "Position",
                value: role.position.toString(),
                inline: true,
            },
        )
        .setTimestamp();
}