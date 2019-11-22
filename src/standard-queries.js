// language=GraphQL
import GraphQLQuery from "./GraphQLQuery";
import config from "./config";
import { SCALAR } from "domainql-form/lib/kind";
import { getFirstValue } from "./model/InteractiveQuery";

// language=GraphQL
const DeleteQuery = new GraphQLQuery(`
    mutation deleteDomainObject($type: String!, $id: GenericScalar!, $cascade: [String]){
        deleteDomainObject( type: $type, id: $id, cascade: $cascade)
    }`
);

// language=GraphQL
const StoreQuery = new GraphQLQuery(`
    mutation storeDomainObject($domainObject: DomainObject!){
        storeDomainObject(domainObject: $domainObject)
    }`
);

// language=GraphQL
const BatchStoreQuery = new GraphQLQuery(`
    mutation storeDomainObjects($domainObjects: [DomainObject]!){
        storeDomainObjects(domainObjects: $domainObjects)
    }`
);

// language=GraphQL
const GenerateIdQuery = new GraphQLQuery(`
    mutation generateDomainObjectId($domainType: String!){
        generateDomainObjectId(domainType: $domainType)
    }`
);

// language=GraphQL
const UpdateAssociationsQuery = new GraphQLQuery(`
    mutation updateAssociations(
        $domainType: String!, 
        $leftSideRelation: String!, 
        $sourceIds: [GenericScalar]!,
        $domainObjects: [DomainObject]! 
    ){
        updateAssociations(
            domainType: $domainType, 
            leftSideRelation: $leftSideRelation, 
            sourceIds: $sourceIds,
            domainObjects: $domainObjects 
        )
    }`
);

/**
 * Deletes the given domain object with the given id.
 *
 * @param {String} type                 domain type name
 * @param {*} id                        id field as string or number or generic scalar object. is converted into a generic scalar object
 *                                      if it is not one already
 * @param {Array<String>} [cascade]     optional array of relation names to follow when deleting the domain object
 *
 * @return {Promise<Boolean, Array>} resolves to a boolean that is true when exactly one row was deleted from the table.
 *                                   Rejects if the domain object couldn't be deleted -- either because it is still referenced
 *                                   or because the table has no id field.
 */
export function deleteDomainObject(type, id, cascade = null)
{
    return DeleteQuery.execute({
        type,
        id: wrapAsGenericScalar(id),
        cascade
    });
}


/**
 * Unwraps the payload value of a GenericScalar instance.
 *
 * @param genericScalar
 * @returns {*}
 */
function mapGenericScalarToValue(genericScalar)
{
    if (__DEV)
    {
        let typeDef;
        if (
            !genericScalar.type ||
            genericScalar.value === undefined ||
            !(typeDef = config.inputSchema.getType(genericScalar.type)) ||
            typeDef.kind !== SCALAR
        )
        {
            throw new Error("Invalid generic scalar value: " + JSON.stringify(genericScalar))
        }
    }
    return genericScalar.value;
}


/**
 * Stores a single domain object and resolves to the id of the stored object. You can use special id values (e.g. "" for UUIDGenerator an or 0 for SequenceIdGenerator)
 * for them to be replaced with a new UUID or autoincrement id.
 *
 * @param {object} domainObject     domain object
 *
 * @returns {Promise<*>} resolves to the id of the stored object.
 */
export function storeDomainObject(domainObject)
{
    return StoreQuery.execute({
        domainObject
    }).then(
        result => mapGenericScalarToValue(getFirstValue(result))
    );
}


/**
 * Stores a heterogeneous list of domain objects. You can use special id values (e.g. "" for UUIDGenerator an or 0 for SequenceIdGenerator)
 * for them to be replaced with a new UUID or autoincrement id.
 *
 * @param {Array<object>} domainObjects     list of domain objects
 *
 * @returns {Promise<*>} resolves to an array of id values
 */
export function storeDomainObjects(domainObjects)
{
    return BatchStoreQuery.execute({
        domainObjects
    }).then(
        result => getFirstValue(result).map(mapGenericScalarToValue)
    );
}

/**
 * Generates a new unique id for the given domain type using the application specific id generator
 * (a server-side Spring bean implementing de.quinscape.automaton.runtime.domain.IdGenerator)
 *
 * @param {String} domainType   domain type name
 *
 * @returns {Promise<*>} resolves to a new unique id value
 */
export function generateDomainObjectId(domainType)
{
    return GenerateIdQuery.execute({
        domainType
    }).then(
        result => mapGenericScalarToValue(getFirstValue(result))
    );
}




function findRelationById(id)
{
    const relations = config.inputSchema.schema.relations.filter(r => r.id === id);
    if (!relations.length)
    {
        throw new Error("Could not find relation with id '" + id + "'");
    }
    return relations[0];
}

function findRelationByTargetType(sourceType, type)
{
    const relations = config.inputSchema.schema.relations.filter(r => r.sourceType === sourceType && r.targetType === type);
    if (!relations.length)
    {
        throw new Error("Could not find relation with target type '" + type + "' and source type '" + sourceType + "'");
    }
    if (relations.length > 1)
    {
        throw new Error("There's more than one relatio rarget type '" + type + "': " + JSON.stringify(relations));
    }
    return relations[0];
}


/**
 * Updates a many-to-many / associative entity from one of the associated objects. Ids may be placeholder id values.
 *
 * @param {Object} opts                         options
 * @param {String} opts.domainType              Name of the associative entity ( e.g. "BazLink" )
 * @param {Array<object|*>} opts.sourceIds      Array of id values for the source object. Each will be automatically wrapped as generic scalar unless it already is an object in which case it is used as-is.
 * @param {String} [opts.leftSideType]          Type determining the side from which we update associated values. One of leftSideType or leftSideRelation must be given,
 * @param {String} [opts.leftSideRelation]      Relation id defining from which side we update associated values. One of leftSideType or leftSideRelation must be given,
 *
 * @param {Array<object>} opts.domainObjects    Array containing all associative entities for the source object
 *
 * @returns {Promise<*>} Array of id values
 */
export function updateAssociations(opts
)
{
    const {
        domainType,
        sourceIds,
        domainObjects,
        leftSideType
    } = opts;

    let {
        leftSideRelation,
    } = opts;

    if (!leftSideRelation)
    {
        if (!leftSideType)
        {
            throw new Error("Need either leftSideRelation or leftSideType option");
        }

        leftSideRelation = findRelationByTargetType(domainType, leftSideType).id;
    }

    return UpdateAssociationsQuery.execute({
        domainType,
        leftSideRelation,
        sourceIds: sourceIds.map( v => wrapAsGenericScalar(v)),
        domainObjects: domainObjects.map( obj => {
            if (obj._type === domainType)
            {
                return obj;
            }
            else
            {
                return {
                    ... obj,
                    _type: domainType
                };
            }
        })
    }).then(
        result => getFirstValue(result).map(mapGenericScalarToValue)
    );
}


/**
 * Wraps the given value in a GenericScalar object. If the given value already is an object, the value is returns as-is.
 *
 * @param value
 * @returns {{type: (string), value: *}|*}
 */
export function wrapAsGenericScalar(value)
{
    if (value && typeof value === "object")
    {
        return value;
    }
    return {
        type: typeof value === "number" ? "Long" : "String",
        value
    }
}
