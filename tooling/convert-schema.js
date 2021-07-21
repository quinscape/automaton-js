const clipboardy = require("clipboardy")


function typeMetaDefaults(types)
{
    const typeMeta = {};

    types.filter(t => t.kind === "OBJECT").forEach(t => {
        typeMeta[t.name] = {};
    });
    return typeMeta;
}


function convertSchema(old)
{
    const schema = {
        types: old.types
    };

    const meta = {
        types: typeMetaDefaults(old.types),
        relations: old.relations,
        genericTypes: old.genericTypes
    };

    const { nameFields } = old;

    if (nameFields)
    {
        for (let typeName in nameFields)
        {
            if (nameFields.hasOwnProperty(typeName))
            {
                let typeMeta = meta.types[typeName].meta
                if (!typeMeta)
                {
                    typeMeta = {};
                    meta.types[typeName].meta = typeMeta;
                }

                typeMeta["nameFields"] = nameFields[typeName];
            }
        }
    }

    return {
        schema,
        meta
    }
}

clipboardy.read()
    .then( text => {

        const newSchema = convertSchema(JSON.parse(text))
        clipboardy.write(JSON.stringify(newSchema, null, 4)).then(() => console.log("done"))
    })
    .catch(
        e => console.error("Error in schema conversion", e)
    )

