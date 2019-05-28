
export default function unwrapAll(type)
{
    if (type.kind === "NON_NULL" || type.kind === "LIST")
    {
        return unwrapAll(type.ofType);
    }
    return type;
}
