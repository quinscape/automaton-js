import config from "../config"


const LIST_PREFIX = "List:";


function defineTypeProperty(target, typeName)
{
    Object.defineProperty(target, "_type", {
        enumerable: true,
        configurable: false,
        writable: true,
        value: typeName
    });
}


/**
 * Decorator factory to annotate DomainQL types for Scope observables. Currently not actually doing anything, for now just an
 * annotation of types.
 *
 * @param typeName      GraphQL input type name
 *
 * @return {*}
 */
export default function type(typeName) {

    //console.log("@TYPE", typeName);

    const {inputSchema} = config;

    if (inputSchema == null)
    {
        throw new Error("InputSchema not set in config");
    }

    let unwrapped;
    if (typeName.indexOf(LIST_PREFIX) === 0)
    {
        typeName = "List";
        unwrapped = typeName.substr(LIST_PREFIX.length);
    }
    else
    {
        unwrapped = typeName;
    }

    const typeDef = inputSchema.getType(unwrapped);
    if (!typeDef)
    {
        throw new Error("Could not find input schema definition for type '" + unwrapped + "'");
    }

    if (typeName === "List")
    {
        //console.log("list decorator", typeDef);

        return function type(target, name, descriptor) {
            if (!Array.isArray(target))
            {
                throw new Error("@type says it's a '" + typeName + "', but the target is no array: " + target);
            }

            for (let i = 0; i < target.length; i++)
            {
                defineTypeProperty(target[i], unwrapped);
            }
            return descriptor;
        };
    }
    else if (typeDef.kind === "OBJECT")
    {
        //console.log("object decorator", typeDef);
        return function type(target, name, descriptor) {

            defineTypeProperty(target, typeName);
            return descriptor;
        };
    }
    else
    {
        //console.log("object decorator", typeDef);
        return function type(target, name, descriptor) {

            return descriptor;
        };
    }
}
