const validRuleFields = new Set([
    "src",
    "into",
    "after",
    "replace"
])


export function hasNoRule(hw)
{
    for (let name of validRuleFields)
    {
        if (name !== "src" && hw[name])
        {
            return false;
        }
    }
    return true;
}


export default function validateRule(docs, hw)
{
    if (!hw.src)
    {
        throw new Error("Need src key: " + JSON.stringify(hw));
    }

    let count = 0;
    const keys = Object.keys(hw);
    for (let i = 0; i < keys.length; i++)
    {
        const key = keys[i];
        if (!validRuleFields.has(key))
        {
            throw new Error("Invalid field '" + key + "': " + JSON.stringify(hw))
        }

        if (key !== "src")
        {
            let ref = hw[key];

            if (key === "replace")
            {
                ref = ref.replace(/\..*$/, "")
            }

            const target = docs.find(d => d.name === ref);
            if (!target)
            {
                throw new Error(
                    "Invalid reference '" + ref + "' in rule: " + JSON.stringify(hw)
                )
            }
        }

        count++;
    }

    if (count > 2)
    {
        throw new Error("Rule has more than one rule field: " + JSON.stringify(hw))
    }
}
