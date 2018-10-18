
const secret = Symbol("AuthSecret");

function mapRoles(roles)
{
    const rolesMap = {};
    for (let i = 0; i < roles.length; i++)
    {
        rolesMap[roles[i]] = true;
    }
    return rolesMap;
}

export default class Authentication
{
    constructor(data)
    {
        this[secret] = {
            ... data,
            roles: mapRoles(data.roles)
        };
    }

    get login()
    {
        return this[secret].login;
    }

    get id()
    {
        return this[secret].id;
    }

    /**
     * Returns true if the user has any of the given roles.
     *
     * @param {... String} roles    roles
     * @return {boolean}
     */
    hasRole(... roles)
    {
        for (let i = 0; i < roles.length; i++)
        {
            if (this[secret].roles.hasOwnProperty(roles[i]))
            {
                return true;
            }
        }
        return false;
    }
}

