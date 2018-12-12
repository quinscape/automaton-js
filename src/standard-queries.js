// language=GraphQL
import GraphQLQuery from "./GraphQLQuery";


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
