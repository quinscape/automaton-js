export default function undefinedsToNull(obj)
{
    if (obj === undefined)
    {
        return null;
    }

    if (Array.isArray(obj))
    {
        if (!obj.length)
        {
            return [];
        }

        const newArray = new Array(obj.length);
        for (let i = 0; i < obj.length; i++)
        {
            const elem = obj[i];
            newArray[i] = undefinedsToNull(elem);
        }
        return newArray;
    }
    else if (obj && typeof obj === "object")
    {
        let newObj = {};
        for (let name in obj)
        {
            if (obj.hasOwnProperty(name))
            {
                newObj[name] = undefinedsToNull(obj[name]);
            }
        }
        return newObj;
    }
    return obj;
}