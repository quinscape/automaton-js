import { ENUM, OBJECT, INPUT_OBJECT, NON_NULL, LIST } from "domainql-form/lib/kind";


const PREAMBLES = {
    OBJECT : "type",
    INPUT_OBJECT : "input",
    SCALAR : "scalar",
    ENUM : "enum"
};


function printDescription(description, newLine, indent = "")
{
    return indent + "# " + description.replace(/(\r?\n)/g, newLine + indent + "# ") + newLine;
}

const INDENT = "    ";

const NEGATIVE_LIST = {
    "Boolean": true,
    "Int": true,
    "String": true,

    "__Directive" : true,
    "__EnumValue" : true,
    "__Field" : true,
    "__InputValue" : true,
    "__Schema" : true,
    "__Type" : true,
    "__DirectiveLocation" : true,
    "__TypeKind" : true
}

function renderTypeRef(typeRef)
{
    const { kind } = typeRef;

    if (kind === NON_NULL)
    {
        return renderTypeRef(typeRef.ofType) + "!";
    }
    else if (kind === LIST)
    {
        return "[" + renderTypeRef(typeRef.ofType) + "]";
    }
    else
    {
        return typeRef.name;
    }
}


function printFields(fields, newLine)
{
    let out = "";

    const sortedFields = fields.slice();
    sortedFields.sort((a,b) => {
        const { name : nameA } = a;
        const { name : nameB } = b;
        return nameA.localeCompare(nameB);
    })

    for (let i = 0; i < sortedFields.length; i++)
    {
        const { name, description, type } = sortedFields[i];

        if (description)
        {
            out += printDescription(description, newLine, INDENT);
        }

        out += INDENT + name + " : " + renderTypeRef(type) + newLine;

    }
    return out;
}


function renderType(type, newLine)
{
    let out = "";

    const { description, kind, name } = type;

    if (description)
    {
        out += printDescription(description, newLine);
    }

    out += PREAMBLES[kind] + " " + name + newLine;

    if (kind === ENUM)
    {
        out += "{" + newLine;

        const { enumValues} = type;

        const sortedEnumValues = enumValues.slice();
        sortedEnumValues.sort((a,b) => {
            const { name : nameA } = a;
            const { name : nameB } = b;
            return nameA.localeCompare(nameB);
        })

        for (let i = 0; i < sortedEnumValues.length; i++)
        {
            const { name, description} = sortedEnumValues[i];

            if (description)
            {
                out += printDescription(description, newLine, INDENT);
            }
            out += INDENT + name + newLine;
        }
        out += "}" + newLine;
    }
    else if (kind === OBJECT)
    {
        out += "{" + newLine;

        out += printFields(type.fields, newLine);

        out += "}" + newLine;
    }
    else if (kind === INPUT_OBJECT)
    {
        out += "{" + newLine;

        out += printFields(type.inputFields, newLine);
        
        out += "}" + newLine;
    }

    out += "\n";
    
    return out;
}

const PRIO = {
    OBJECT : 0,
    ENUM : 1,
    INPUT_OBJECT : 2,
    SCALAR : 3
};


function sortTypes(types)
{
    const sortedTypes = types.slice();

    sortedTypes.sort((a,b) => {

        const { kind : kindA } = a;
        const { kind : kindB } = b;

        if (kindA === kindB)
        {
            const { name : nameA } = a;
            const { name : nameB } = b;
            return nameA.localeCompare(nameB);
        }
        else
        {
            return PRIO[kindA] - PRIO[kindB];
        }
    })

    return sortedTypes;
}


/**
 * Renders a human-readable GraphQL schema from a JSON schema introspection including the automaton-specific additions.
 *
 * @category helper
 *
 * @param {Object} schema   (automaton) schema data
 * @param {String}newLine   newLine to use
 */
export default function printSchema(schema, newLine = "\n")
{
    const { types, relations, nameFields, genericTypes } = schema;

    let out = "schema" + newLine +
        "{" + newLine +
          "    query: QueryType" + newLine +
          "    mutation: MutationType" + newLine +
          "}" + newLine + newLine;
    const sortedTypes = sortTypes(types);
    for (let i = 0; i < sortedTypes.length; i++)
    {
        const type = sortedTypes[i];

        if (!NEGATIVE_LIST[type.name])
        {
            out += renderType(type, newLine);
        }
    }

    return out;
}









