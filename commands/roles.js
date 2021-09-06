const { SlashCommandBuilder } = require("@discordjs/builders");

const isColour = require("../utility/common/colourCheck.js");
const toEmbed = require("../utility/common/toEmbed.js");
const stringIsPermission = require("../utility/common/permissionCheck.js");
const { userCanCommandBot, userIsAdmin, permissionsDiffer, roleGivesUniquePermissions, roleIsSuperior, userNotAuthorised, botNotAuthorised } = require("../utility/common/authorisation.js");

async function showRoles(interaction)
{
    let cache = interaction.guild.roles.cache;
    let roles = cache.values();
    for (let role of roles)
    {
        await interaction.channel.send(
            {
                embeds: 
                [
                    toEmbed(role),
                ],
            }
        );
    }

    return interaction.reply(`${cache.size} roles shown.`);
}

async function mergeRoles(interaction)
{
    let user = interaction.member;
    let bot = interaction.guild.me;
    if (!userCanCommandBot(user, bot))
    {
        return interaction.reply(userNotAuthorised);
    }

    let mainRole = interaction.options.getRole("main");
    let otherRole = interaction.options.getRole("other");
    if ((roleIsSuperior(user, mainRole) || roleIsSuperior(user, otherRole) || permissionsDiffer(user, mainRole) || permissionsDiffer(user, otherRole)) && !userIsAdmin(user))
    {
        return interaction.reply(
            {
                content: "You do not have the permission(s) required to merge those roles.",
                ephemeral: true,
            }
        );
    }
    if (roleIsSuperior(bot, mainRole) || roleIsSuperior(bot, otherRole) || permissionsDiffer(bot, mainRole) || permissionsDiffer(bot, otherRole))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to merge those roles.",
                ephemeral: true,
            }
        );
    }

    let permissions = [];
    for (let permission of mainRole.permissions.toArray())
    {
        permissions.push(permission);
    }
    for (let permission of otherRole.permissions.toArray())
    {
        if (!permissions.includes(permission))
        {
            permissions.push(permission);
        }
    }

    mainRole.color = otherRole.color;
    await mainRole.setPermissions(permissions);
    for (let member of otherRole.members.values())
    {
        await member.roles.add(mainRole);
    }
    await otherRole.delete();
    return interaction.reply("The roles have been merged.");
}

async function syncRoles(interaction)
{
    let user = interaction.member;
    let bot = interaction.guild.me;
    if (!userCanCommandBot(user, bot))
    {
        return interaction.reply(userNotAuthorised);
    }

    let firstRole = interaction.options.getRole("first");
    let secondRole = interaction.options.getRole("second");
    if ((roleIsSuperior(user, firstRole) || roleIsSuperior(user, secondRole) || permissionsDiffer(user, firstRole) || permissionsDiffer(user, secondRole)) && !userIsAdmin(user))
    {
        return interaction.reply(
            {
                content: "You do not have the permission(s) required to synchronise those roles.",
                ephemeral: true,
            }
        );
    }
    if (roleIsSuperior(bot, firstRole) || roleIsSuperior(bot, secondRole) || permissionsDiffer(bot, firstRole) || permissionsDiffer(bot, secondRole))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to synchronise those roles.",
                ephemeral: true,
            }
        );
    }

    let permissions = [];
    for (let permission of firstRole.permissions.toArray())
    {
        permissions.push(permission);
    }
    for (let permission of secondRole.permissions.toArray())
    {
        if (!permissions.includes(permission))
        {
            permissions.push(permission);
        }
    }
    await firstRole.setPermissions(permissions);
    await secondRole.setPermissions(permissions);

    for (let member of firstRole.members.values())
    {
        await member.roles.add(secondRole);
    }
    for (let member of secondRole.members.values())
    {
        await member.roles.add(firstRole);
    }

    return interaction.reply("The roles have been synchronised.");   
}

async function findRoles(interaction)
{
    let name = interaction.options.getString("name");
    let permission = interaction.options.getString("permission")?.toUpperCase();
    if (permission != null && !stringIsPermission(permission))
    {
        return interaction.reply(
            {
                content: `\"${permission}\" is not a valid permission.`,
                ephemeral: true,
            }
        )
    }
    let colour = interaction.options.getString("colour");
    if (colour != null && !isColour(colour))
    {
        return interaction.reply(
            {
                content: `\"${colour}\" is not a valid colour.`,
                ephemeral: true,
            }
        )
    }
    let mentionable = interaction.options.getBoolean("mentionable");

    let results = [];

    let roles = interaction.guild.roles.cache.values();
    for (let role of roles)
    {
        if (name != null && role.name != name)
        {
            continue;
        }
        if (permission != null && !role.permissions.has(permission))
        {
            continue;
        }
        if (colour != null && role.hexColor != colour)
        {
            continue;
        }
        if (mentionable != null && role.mentionable != mentionable)
        {
            continue;
        }
        results.push(role);
    }

    for (let result of results)
    {
        await interaction.channel.send(
            {
                embeds: 
                [
                    toEmbed(result),
                ],
            }
        );
    }
    return interaction.reply(`${results.length} roles found matching the search criteria.`);
}

module.exports = 
{
    data: new SlashCommandBuilder()
        .setName("roles")
        .setDescription("Perform actions that require more than one role.")
        .addSubcommand(subcommand => 
            subcommand
            .setName("info")
            .setDescription("See information about all roles in the server.")
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("merge")
            .setDescription("Merge a role's permissions and members into another role and delete it.")
            .addRoleOption(option => option.setName("main").setDescription("The role that remains after merging.").setRequired(true))
            .addRoleOption(option => option.setName("other").setDescription("The role that is deleted after merging.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("sync")
            .setDescription("Give two roles the same permissions and members while deleting neither.")
            .addRoleOption(option => option.setName("first").setDescription("The first role.").setRequired(true))
            .addRoleOption(option => option.setName("second").setDescription("The second role.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("find")
            .setDescription("Find all roles that match specific criteria.")
            .addStringOption(option => option.setName("name").setDescription("Include a name in the search criteria.").setRequired(false))
            .addStringOption(option => option.setName("permission").setDescription("Include a permission in the search criteria.").setRequired(false))
            .addStringOption(option => option.setName("colour").setDescription("Include a colour in the search criteria.").setRequired(false))
            .addBooleanOption(option => option.setName("mentionable").setDescription("Include whether the role can be mentioned in the search criteria.").setRequired(false))
        ),
    execute: async function (interaction)
    {
        let subcommand = interaction.options.getSubcommand();
        switch (subcommand)
        {
            case "info":
                await showRoles(interaction);
                break;

            case "merge":
                await mergeRoles(interaction);
                break;

            case "sync":
                await syncRoles(interaction);
                break;

            case "find":
                await findRoles(interaction);
                break;

            default:
                await interaction.reply(
                    {
                        content: "I don't recognise that command.",
                        ephemeral: true,
                    }
                );
        }
    },
}