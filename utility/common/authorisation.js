const { Permissions } = require("discord.js");

function hasHigherOrEqualRole(user1, user2)
{
    return user1.roles.highest.position >= user2.roles.highest.position;
}

function userIsAdmin(member)
{
    return member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) || member.guild.ownerId === member.id;
}

module.exports = 
{
    userCanCommandBot: function (member, bot)
    {
        return hasHigherOrEqualRole(member, bot) || member.permissions.has(Permissions.FLAGS.MANAGE_ROLES, false) || userIsAdmin(member);
    },
    userIsAdmin: function (member)
    {
        return userIsAdmin(member);
    },
    permissionsDiffer: function (member, role)
    {
        return !member.permissions.has(role.permissions, true);
    },
    roleGivesUniquePermissions: function (member, role)
    {
        let rolePermissions = role.permissions.toArray();
        for (let memberRole of member.roles.cache.values())
        {
            let memberRolePermissions = memberRole.permissions.toArray();
            for (let permission of memberRolePermissions)
            {
                if (rolePermissions.includes(permission))
                {
                    let index = rolePermissions.indexOf(permission);
                    rolePermissions.splice(index, 1);
                }
            }
            if (!rolePermissions.length)
            {
                return false;
            }
        }
        return true;
    },
    roleIsSuperior: function (member, role)
    {
        return role.position >= member.roles.highest.position;
    },
    userNotAuthorised: 
    {
        content: "You do not have the permission(s) required to use that command.",
        ephemeral: true,
    },
    botNotAuthorised: 
    {
        content: "I do not have the permission(s) required to execute that command.",
        ephemeral: true,
    },
}