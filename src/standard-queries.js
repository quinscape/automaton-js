// language=GraphQL
import GraphQLQuery from "./GraphQLQuery";
import config from "./config";
import { findNamed } from "./util/lookupType";
import unwrapAll from "./util/unwrapAll";


// language=GraphQL
const DeleteQuery = new GraphQLQuery(`
    mutation deleteDomainObject($type: String!, $id: String!){
        deleteDomainObject( type: $type, id: $id)
    }`
);

// language=GraphQL
const StoreQuery = new GraphQLQuery(`
    mutation storeDomainObject($domainObject: DomainObject!){
        storeDomainObject(domainObject: $domainObject)
    }`
);

// language=GraphQL
const UpdateAssociationsQuery = new GraphQLQuery(`
    mutation updateAssociations(
        $type: String!,
        $sourceFieldName: String!,
        $targetFieldName: String!,
        $sourceId:  GenericScalar!,
        $connected:  [GenericScalar]!
    ){
        updateAssociations(
            type: $type,
            sourceFieldName: $sourceFieldName,
            targetFieldName: $targetFieldName,
            sourceId: $sourceId,
            connected: $connected
        )
    }`
);

/**
 * Deletes the given domain object with the given id.
 *
 * @param {String} type     domain type name
 * @param {String} id       id field
 *
 * @return {Promise<Boolean, Array>} resolves to a boolean that is true when exactly one row was deleted from the table.
 *                                   Rejects if the domain object couldn't be deleted -- either because it is still referenced
 *                                   or because the table has no id field.
 */
export function deleteDomainObject(type, id)
{
    return DeleteQuery.execute({
        type,
        id
    });
}

export function storeDomainObject(domainObject)
{
    return StoreQuery.execute({
        domainObject
    });
}


function getScalarType(typeDef, fieldName)
{
    const fields = typeDef.fields || typeDef.inputFields;

    const fieldDef = findNamed(fields, fieldName);
    if (!fieldDef)
    {
        throw new Error("Could not find field definition for " + typeDef.name + "." + fieldName);
    }

    const unwrapped = unwrapAll(fieldDef.type);
    if (unwrapped.kind !== "SCALAR")
    {
        throw new Error("Invalid field type " + typeDef.name + "." + fieldName + ": " + JSON.stringify(unwrapped));
    }
    return unwrapped.name;
}


/**
 * Updates the associative domain objects from one of the associated types. The associative domain objects express
 * a many to many relationship between two associated domain types. 
 *
 * @param {String} type                 name of the associative domain type
 * @param {String} sourceFieldName      the field name for "our" side, the source side from our point of view
 * @param {String} targetFieldName      the field name for other side, the target side from our point of view
 * @param {*} sourceId                  the id value for the source side
 * @param {Array<*>} connected          the id values for the target side
 * 
 * @returns {Promise<*, *>} promise resolving to true if the mutation succeeded
 */
export function updateAssociations(
    type,
    sourceFieldName,
    targetFieldName,
    sourceId,
    connected
)
{

    console.log("updateAssociations", {type, sourceFieldName, targetFieldName, sourceId, connected});

    const typeDef = config.inputSchema.getType(type);
    if (!typeDef)
    {
        throw new Error("Could not find definition for type '" + type + "'");
    }

    const scalarType = getScalarType(typeDef, "id");

    // ensure source and target fields are valid
    getScalarType(typeDef, sourceFieldName);
    getScalarType(typeDef, targetFieldName);
    
    return UpdateAssociationsQuery.execute({
        type,
        sourceFieldName,
        targetFieldName,
        sourceId: {
            type: scalarType,
            value: sourceId
        },
        connected:
            connected.map(
                value => ({
                    type: scalarType,
                    value
                })
            )
    })
}
