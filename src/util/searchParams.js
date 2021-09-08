export default function searchParams(location)
{
    const pos = location.indexOf("?");
    const obj = {};

    if (pos < 0)
    {
        return obj;
    }
    
    const params = new URLSearchParams(location);
    for (let [name, value] of params)
    {
        obj[name] = value;
    }
    return obj;
}
