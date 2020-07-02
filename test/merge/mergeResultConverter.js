function convertValue(value)
{
    if (value.type === "Timestamp" || value.type === "Date")
    {
        return {
            type: value.type,
            value: new Date(value.value)
        }
    }

    return value;
}


/**
 * Helper for our test app to convert JSON fields in merge results so that the types match what the server produces.
 *
 * @param data
 */
export default function mergeResultConverter(data)
{

    const { conflicts } = data;
    for (let i = 0; i < conflicts.length; i++)
    {

        const {fields} = conflicts[i];
        for (let j = 0; j < fields.length; j++)
        {
            const field = fields[j];

            field.ours = convertValue(field.ours)
            field.theirs = convertValue(field.theirs)
        }
    }

}
