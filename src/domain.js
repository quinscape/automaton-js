import { WireFormat } from "domainql-form"
import config from "./config"
import matchPath from "./matchPath";
import { INPUT_OBJECT, OBJECT, LIST, SCALAR } from "domainql-form/lib/kind";


let domainClasses = {};

const earlyConverters = [];

let wireFormat = {

    // allow for startup init function registration of converters before the actual wireformat is created.
    registerConverter: function (type, fromWire, toWire)
    {
        earlyConverters.push([type,fromWire,toWire]);
    }
};


/**
 * Registers a domain observable implementation for all domain types that where generated for the given generic type.
 *
 * @param {String} genericType      fully qualified java class name of a generic type
 * @param {function} DomainClass    class definition with observables
 */
export function registerGenericType(genericType, DomainClass)
{
    const { genericTypes } = config.inputSchema.schema;

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
    const { genericTypes } = config.inputSchema.schema;

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


function createTypeRef(type)
{
    if (type[0] === "[")
    {
        return {
            kind: LIST,
            ofType: {
                kind: SCALAR,
                name: type.substr(1, type.length - 2)
            }
        }
    }
    return {
        kind: SCALAR,
        name: type
    };
}


export function createGenericScalarFromWire(wireFormat)
{

    return value => {

        if (value === null)
        {
            return null;
        }

        return {
            type: value.type,
            value: wireFormat.convert(
                createTypeRef(value.type),
                value.value,
                true
            )
        };
    }
}


export function createGenericScalarToWire(wireFormat)
{
    return value => {

        if (value === null)
        {
            return null;
        }

        return {
            type: value.type,
            value: wireFormat.convert(
                createTypeRef(value.type),
                value.value,
                false
            )
        };
    }

}


function createDomainObjectFromWire(wireFormat)
{
    return value => {
        return wireFormat.convert(
            {
                kind: INPUT_OBJECT,
                name: value._type
            },
            value,
            true
        )
    }
}


function createDomainObjectToWire(wireFormat)
{
    return value => {
        const obj = wireFormat.convert(
            {
                kind: OBJECT,
                name: value._type
            },
            value,
            false
        );

        // we need the _type for DomainObject scalars
        obj._type = value._type;

        return obj
    }
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

    wireFormat.registerConverter(
        "GenericScalar",
        createGenericScalarFromWire(wireFormat),
        createGenericScalarToWire(wireFormat)
    );

    wireFormat.registerConverter(
        "DomainObject",
        createDomainObjectFromWire(wireFormat),
        createDomainObjectToWire(wireFormat)
    );

    for (let i = 0; i < earlyConverters.length; i++)
    {
        const entry = earlyConverters[i];
        wireFormat.registerConverter( ... entry);
    }

}

export function __setWireFormatForTest(wf)
{
    wireFormat = wf;
}

export function getWireFormat()
{
    return wireFormat;
}
