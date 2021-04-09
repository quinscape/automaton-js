export function printJsDocType(type)
{
    if (!type)
    {
        return "---";
    }
    if (type.type === "NameExpression")
    {
        return type.name;
    }
    else if (type.type === "AllLiteral")
    {
        return "*";
    }
    else if (type.type === "VoidLiteral")
    {
        return "void";
    }
    else if (type.type === "NullLiteral")
    {
        return "null";
    }
    else if (type.type === "RestType")
    {
        return "... " + printJsDocType(type.expression);
    }
    else if (type.type === "FunctionType")
    {
        return "(" + type.params.map(p => printJsDocType(p)).join(", ") + ") => " + printJsDocType(type.result);
    }
    else if (type.type === "UnionType")
    {
        return type.elements.map(elem => printJsDocType(elem)).join(" | ");
    }
    else if (type.type === "TypeApplication")
    {
        return printJsDocType(type.expression) + "<" + type.applications.map(a => printJsDocType(a)).join(", ") + ">";
    }
    else if (type.type === "NullableType")
    {
        return "[" + printJsDocType(type.expression) + "]";
    }
    else if (type.type === "RecordType")
    {
        return `{${type.fields.map(f => printJsDocType(f)).join(", ")}}`;
    }
    else if (type.type === "FieldType")
    {
        return type.key + ": " + printJsDocType(type.value);
    }

    /*
    {
    "type": "TypeApplication",
    "expression": {
        "type": "NameExpression",
        "name": "Array"
    },
    "applications": [
        {
            "type": "NameExpression",
            "name": "String"
        }
    ]
}
     */
    throw new Error("Cannot print type: " + JSON.stringify(type))
}
