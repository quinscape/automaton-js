export function filterByCategory(name = null)
{
    return doc => {
        return doc.category === name;
    };
}
