import { WireFormat } from "domainql-form"
import config from "./config"
import matchPath from "./matchPath";

let domainClasses = {};

let wireFormat;


/**
 * Registers a domain observable implementation for all domain types that where generated for the given generic type.
 *
 * @param {String} genericType      fully qualified java class name of a generic type
 * @param {function} DomainClass    class definition with observables
 */
export function registerGenericType(genericType, DomainClass)
{
    const { genericTypes } = config;

    const typesForGenericType = genericTypes.filter(ref => ref.genericType === genericType);

    //console.log("registerGenericType", genericType, typesForGenericType);

    typesForGenericType.forEach( ref => registerType(ref.type, DomainClass));
}


/**
 * Registers a domain class implementation containing observables for a given domain type name
 *
 * @param {String} name             GraphQL type name
 * @param {function} DomainClass    domain class containing observables
 */
export function registerType(name, DomainClass)
{
    const existing = domainClasses[name];
    if (existing)
    {
        throw new Error("Domain Type '" + name + "' already has a registered class: " + existing);
    }

    //console.log("DOMAIN-CLASS", name , " is ", DomainClass);

    domainClasses[name] = DomainClass;
}

export const INTERACTIVE_QUERY = "de.quinscape.automaton.model.data.InteractiveQuery";


/**
 * Looks up the generic type the type with the given name is based on.
 *
 * @param {String} typeName     type name
 * @return {String|null} full qualified generic type name or null
 */
export function getGenericType(typeName)
{
    const { genericTypes } = config;

    for (let i = 0; i < genericTypes.length; i++)
    {
        const entry = genericTypes[i];
        if (entry.type === typeName)
        {
            return entry.genericType;
        }
    }
    return null;
}

export function loadDomainDefinitions(ctx)
{
    const keys = ctx.keys();

    //console.log("Modules: ", keys);
    
    for (let i = 0; i < keys.length; i++)
    {
        const moduleName = keys[i];

        const { isDomain, shortName } = matchPath(moduleName);
        if (isDomain)
        {
            registerType(shortName, ctx(moduleName).default);
        }
    }

    wireFormat = new WireFormat(
        config.inputSchema,
        domainClasses,
        {
            wrapAsObservable: true
        }
    );
}

export function getWireFormat()
{
    return wireFormat;
}
