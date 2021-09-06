const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

const toEmbed = require("../utility/common/toEmbed.js");
const isColour = require("../utility/common/colourCheck.js");
const { userCanCommandBot, userIsAdmin, permissionsDiffer, roleGivesUniquePermissions, roleIsSuperior, userNotAuthorised, botNotAuthorised } = require("../utility/common/authorisation.js");

async function showRole(interaction)
{
    let role = interaction.options.getRole("role");
    return interaction.reply(
        {
            embeds: 
            [
                toEmbed(role),
            ],
        }
    );
}

async function newRole(interaction)
{
    let member = interaction.member;
    if (!userCanCommandBot(member, interaction.guild.me))
    {
        return interaction.reply(userNotAuthorised);
    }

    let roleManager = interaction.guild.roles;
    let roleName = interaction.options.getString("name");
    let roleColour = interaction.options.getString("colour") ?? "#5865F2";
    if (!isColour(roleColour))
    {
        return interaction.reply(
            {
                content: `\"${roleColour}\" is not a valid colour.`,
                ephemeral: true,
            }
        )
    }
    
    await roleManager.create(
        {
            name: roleName,
            color: roleColour,
        }
    );

    return interaction.reply(`The role \"${roleName}\" has been created.`);
}

async function deleteRole(interaction)
{
    let bot = interaction.guild.me;
    let member = interaction.member;
    if (!userCanCommandBot(member, bot))
    {
        return interaction.reply(userNotAuthorised);
    }

    let role = interaction.options.getRole("role");
    if (roleIsSuperior(bot, role))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to delete that role.",
                ephemeral: true,
            }
        );
    }

    await role.delete();
    return interaction.reply(`The role \"${role.name}\" has been deleted.`);
}

async function resetRole(interaction)
{
    let user = interaction.member;
    let bot = interaction.guild.me;
    if (!userCanCommandBot(user, bot))
    {
        return interaction.reply(userNotAuthorised);
    }

    let role = interaction.options.getRole("role");
    if ((roleIsSuperior(user, role) || permissionsDiffer(user, role)) && !userIsAdmin(user))
    {
        return interaction.reply(
            {
                content: "You do not have the permission(s) required to copy that role.",
                ephemeral: true,
            }
        );
    }
    if ((roleIsSuperior(bot, role) || permissionsDiffer(bot, role)))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to copy that role.",
                ephemeral: true,
            }
        );
    }

    await role.setPermissions([]);
    for (let member of role.members.values())
    {
        await member.roles.remove(role);
    }
    return interaction.reply(`<@&${role.id}> has been reset.`);
}

async function copyRole(interaction)
{
    let user = interaction.member;
    let bot = interaction.guild.me;
    if (!userCanCommandBot(user, bot))
    {
        return interaction.reply(userNotAuthorised);
    }

    let role = interaction.options.getRole("role");
    if ((roleIsSuperior(user, role) || permissionsDiffer(user, role)) && !userIsAdmin(user))
    {
        return interaction.reply(
            {
                content: "You do not have the permission(s) required to copy that role.",
                ephemeral: true,
            }
        );
    }
    if (permissionsDiffer(bot, role))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to copy that role.",
                ephemeral: true,
            }
        );
    }
    
    let roleManager = interaction.guild.roles;
    await roleManager.create(
        {
            name: `${role.name} copy`,
            color: role.color,
            permissions: role.permissions,
        }
    );

    return interaction.reply(`The role <@&${role.id}> has been copied.`);
}

async function signupForRole(interaction)
{
    let user = interaction.member;
    let bot = interaction.guild.me;
    let role = interaction.options.getRole("role");
    if ((roleIsSuperior(user, role) || roleGivesUniquePermissions(user, role)) && !userIsAdmin(user))
    {
        return interaction.reply(
            {
                content: "You do not have the permission(s) required to sign up for that role.",
                ephemeral: true,
            }
        );
    }
    if (roleIsSuperior(bot, role))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to assign that role to you.",
                ephemeral: true,
            }
        );
    }

    let roleManager = user.roles;
    if (roleManager.cache.has(role.id))
    {
        return interaction.reply(
            {
                content: "You already have that role.",
                ephemeral: true,
            }
        );
    }

    await roleManager.add(role);
    return interaction.reply(`<@&${role.id}> has been assigned to you.`);
}

async function giveupRole(interaction)
{
    let user = interaction.member;
    let roleManager = user.roles;
    let bot = interaction.guild.me;
    let role = interaction.options.getRole("role");
    if (!roleManager.cache.has(role.id))
    {
        return interaction.reply(
            {
                content: "You do not have that role.",
                ephemeral: true,
            }
        );
    }
    if ((roleIsSuperior(user, role) || roleManager.highest == role || roleGivesUniquePermissions(user, role)) && !userIsAdmin(user))
    {
        return interaction.reply(
            {
                content: "You do not have the permission(s) required to give up that role.",
                ephemeral: true,
            }
        );
    }
    if (roleIsSuperior(bot, role))
    {
        return interaction.reply(
            {
                content: "I do not have the permission(s) required to remove that role from you.",
                ephemeral: true,
            }
        );
    }

    await roleManager.remove(role);
    return interaction.reply(`<@&${role.id}> has been removed from you.`);
}

async function muteRole(interaction)
{
    let user = interaction.member;
    if (!userCanCommandBot(user, interaction.guild.me) || !user.permissions.has(Permissions.FLAGS.MUTE_MEMBERS, true))
    {
        return interaction.reply(userNotAuthorised);
    }

    let role = interaction.options.getRole("role");
    let channel = interaction.options.getChannel("channel");
    if (!channel.isVoice())
    {
        return interaction.reply(
            {
                content: `<#${channel.id}> isn't a voice channel.`,
                ephemeral: true,
            }
        );
    }

    let cache = channel.members;
    if (!cache.size)
    {
        return interaction.reply(
            {
                content: `There are no members in <#${channel.id}>.`,
                ephemeral: true,
            }
        );
    }
    let reason = interaction.options.getString("reason") ?? "Unspecified.";
    let members = cache.values();
    for (let member of members)
    {
        if (member.roles.cache.has(role.id))
        {
            member.voice.setMute(true, reason);
        }
    }

    return interaction.reply(`Muted ${cache.size} members in <#${channel.id}>.`);
}

async function deafenRole(interaction)
{
    let user = interaction.member;
    if (!userCanCommandBot(user, interaction.guild.me) || !user.permissions.has(Permissions.FLAGS.DEAFEN_MEMBERS, true))
    {
        return interaction.reply(userNotAuthorised);
    }

    let role = interaction.options.getRole("role");
    let channel = interaction.options.getChannel("channel");
    if (!channel.isVoice())
    {
        return interaction.reply(
            {
                content: `<#${channel.id}> isn't a voice channel.`,
                ephemeral: true,
            }
        );
    }

    let cache = channel.members;
    if (!cache.size)
    {
        return interaction.reply(
            {
                content: `There are no members in <#${channel.id}>.`,
                ephemeral: true,
            }
        );
    }
    let reason = interaction.options.getString("reason") ?? "Unspecified.";
    let members = cache.values();
    for (let member of members)
    {
        if (member.roles.cache.has(role.id))
        {
            member.voice.setDeaf(true, reason);
        }
    }

    return interaction.reply(`Deafened ${cache.size} members in <#${channel.id}>.`);
}

module.exports = 
{
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription("Perform actions on a role.")
        .addSubcommand(subcommand => 
            subcommand
            .setName("info")
            .setDescription("See information about a role.")
            .addRoleOption(option => option.setName("role").setDescription("The role to show information about.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("new")
            .setDescription("Create a new role.")
            .addStringOption(option => option.setName("name").setDescription("The name given to the new role.").setRequired(true))
            .addStringOption(option => option.setName("colour").setDescription("The colour given to the new role").setRequired(false))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("delete")
            .setDescription("Delete a role.")
            .addRoleOption(option => option.setName("role").setDescription("The role to be deleted.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("reset")
            .setDescription("Reset all the permissions of a role, and set its member count to zero.")
            .addRoleOption(option => option.setName("role").setDescription("The role to be reset.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("copy")
            .setDescription("Create a copy of an existing role.")
            .addRoleOption(option => option.setName("role").setDescription("The role to be copied.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("signup")
            .setDescription("Assign yourself a role.")
            .addRoleOption(option => option.setName("role").setDescription("The role to sign up for.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("giveup")
            .setDescription("Remove yourself from a role.")
            .addRoleOption(option => option.setName("role").setDescription("The role to give up.").setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("mute")
            .setDescription("Mute all members with a role in a voice channel.")
            .addRoleOption(option => option.setName("role").setDescription("The role whose members are to be muted.").setRequired(true))
            .addChannelOption(option => option.setName("channel").setDescription("The voice channel in which to mute the members.").setRequired(true))
            .addStringOption(option => option.setName("reason").setDescription("The reason for muting the members.").setRequired(false))
        )
        .addSubcommand(subcommand => 
            subcommand
            .setName("deafen")
            .setDescription("Deafen all members with a role in a voice channel.")
            .addRoleOption(option => option.setName("role").setDescription("The role whose members are to be deafened.").setRequired(true))
            .addChannelOption(option => option.setName("channel").setDescription("The voice channel in which to deafen the members.").setRequired(true))
            .addStringOption(option => option.setName("reason").setDescription("The reason for deafening the members.").setRequired(false))
        ),
    execute: async function (interaction)
    {
        let subcommand = interaction.options.getSubcommand();
        switch (subcommand)
        {
            case "info":
                await showRole(interaction);
                break;

            case "new":
                await newRole(interaction);
                break;

            case "delete":
                await deleteRole(interaction);
                break;

            case "reset":
                await resetRole(interaction);
                break;

            case "copy":
                await copyRole(interaction);
                break;

            case "signup":
                await signupForRole(interaction);
                break;

            case "giveup":
                await giveupRole(interaction);
                break;

            case "mute":
                await muteRole(interaction);
                break;

            case "deafen":
                await deafenRole(interaction);
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