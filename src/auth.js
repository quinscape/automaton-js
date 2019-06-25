const secret = Symbol("AuthSecret");


function mapRoles(roles)
{
    const rolesMap = {};
    for (let i = 0; i < roles.length; i++)
    {
        rolesMap[roles[i]] = true;
    }
    return Object.freeze(rolesMap);
}


export default class Authentication {
    constructor(data)
    {
        this[secret] = {
            ...data,
            roles: data.roles,
            rolesMap: mapRoles(data.roles)
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

    get roles()
    {
        return this[secret].roles;
    }



    /**
     * Returns true if the user has any of the given roles.
     *
     * @param {...String} roles    roles
     * @return {boolean}
     */
    hasRole(...roles)
    {
        const { rolesMap } = this[secret];
        for (let i = 0; i < roles.length; i++)
        {
            if (rolesMap.hasOwnProperty(roles[i]))
            {
                return true;
            }
        }
        return false;
    }
}

