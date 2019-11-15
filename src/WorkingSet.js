import { action, computed, observable } from "mobx"
import { getInputTypeName, lookupType } from "./util/type-utils";
import GraphQLQuery from "./GraphQLQuery";
import extractTypeData from "./extractTypeData";
import { computedFn, createTransformer } from "mobx-utils";

// language=GraphQL
const PersistWorkingSetQuery = new GraphQLQuery(`
    mutation persistWorkingSet($domainObjects: [DomainObject]!, $deletions: [WorkingSetDeletionInput]!)
    {
        persistWorkingSet(
            domainObjects: $domainObjects,
            deletions: $deletions
        )
    }`
);

const secret = Symbol("WorkingSetSecret");

function changeKey(type, id)
{
    return type + ":" + id;
}

export const WorkingSetStatus = {
    NEW: "NEW",
    MODIFIED: "MODIFIED",
    DELETED: "DELETED"
};

Object.freeze(WorkingSetStatus);

/**
 * Entry for a deleted domain object
 *
 * @typedef WorkingSetDeletion
 * @type {object}
 * @property {String} type                      type name
 * @property {{type: String, value: *}} id      id value as generic scalar
 */

function mapEntryToDomainObject(entry)
{
    return entry.domainObject;
}


/**
 * Extracts input data from all domain object changes
 *
 * @param {Array<Object>} changes   array of changes
 *
 * @returns {Array<Object>} array of extracted data
 */
function extractTypeDataFromObjects(changes)
{
    return changes.map(
        obj => extractTypeData(
            getInputTypeName(obj._type),
            obj
        )
    )
}
/**
 * Returns the current new objects, optionally filtered by type
 *
 * @param {Map} changes
 * @param {String} [type]   optional type
 */
const getNewObjects = computedFn((changes, type) => {
    return [ ... changes.values()]
        .filter(entry => entry.status === WorkingSetStatus.NEW && (!type || entry.domainObject._type === type))
        .map( mapEntryToDomainObject );
});

/**
 * Encapsulates a current set of changes to domain objects not yet persisted to the server-side.
 */
export default class WorkingSet
{
    constructor()
    {
        this[secret] = {
            changes: observable(
                new Map()
            )
        }
    }


    /**
     * Adds a domain object as new object.
     * 
     * @param domainObject
     */
    @action
    addNew(domainObject)
    {
        const { _type, id } = domainObject;
        const { changes } = this[secret];

        const key = changeKey(_type, id);

        const existing = changes.get(key);
        if (existing)
        {
            throw new Error(
                `Error registering new object in working set: An object with the same identity is already registered, type = ${_type}, id = ${id}, status = ${existing.status}`
            )
        }

        changes.set(
            key,
            {
                domainObject,
                status: WorkingSetStatus.NEW
            }
        );
    }


    /**
     * Adds a domain object as changed object. If it was formerly marked as new object, it will remain a new object, but
     * with updated contents.
     *
     * @param domainObject
     */
    @action
    addChanges(domainObject)
    {
        const { _type, id } = domainObject;
        const { changes } = this[secret];

        const key = changeKey(_type, id);

        const existing = changes.get(key);

        let status;

        if (existing && existing.status === WorkingSetStatus.NEW)
        {
            status = WorkingSetStatus.NEW;
        }
        else
        {
            // MODIFIED remains, DELETED becomes MODIFIED
            status = WorkingSetStatus.MODIFIED
        }

        changes.set(
            key,
            {
                domainObject,
                status
            }
        );
    }

    /**
     * Marks a domain object as deleted. Marking an object with the same domain type / id combination as new or
     * changed will undo the the deletion.
     *
     * @param domainObject
     */
    @action
    markDeleted(domainObject)
    {
        const { _type, id } = domainObject;
        const { changes } = this[secret];

        const key = changeKey(_type, id);

        const existing = changes.get(key);

        if (existing && existing.status === WorkingSetStatus.NEW)
        {
            // if an object was new and is deleted now, we just revert the changes
            this.revert(domainObject);
        }
        else
        {
            // otherwise we mark it as deleted
            changes.set(
                changeKey(_type, id),
                {
                    domainObject: {
                        type: _type,
                        id: {
                            type: lookupType(_type, "id").name,
                            value: id
                        }
                    },
                    status: WorkingSetStatus.DELETED
                }
            );
        }
    }

    /**
     * Reverts the changes for the given domain object in the working set.
     *
     * @param domainObject
     */
    @action
    revert(domainObject)
    {
        const { _type, id } = domainObject;

        this[secret].changes.delete(
            changeKey(_type, id)
        );
    }


    /**
     * Forgets all changes.
     */
    @action
    revertAll()
    {
        const s = this[secret];
        s.changes.clear();
    }


    /**
     * Looks up changes in the working set for the given domain object
     *
     * @param type      domain type name
     * @param id        object id
     *
     * @returns {{domainObject: object, status: String}}
     */
    lookup(type, id)
    {

        const s = this[secret];
        return s.changes.get(changeKey(type, id));
    }

    /**
     *  Returns the array of changed domain objects except for the deletions
     *
     * @returns {Array<Object>} array with new or modified objects
     */
    @computed
    get changes()
    {
        return [ ... this[secret].changes.values()]
            .filter(entry => entry.status !== WorkingSetStatus.DELETED)
            .map(mapEntryToDomainObject);
    }


    /**
     * Returns an array of new objects of the given type. if no type is given, all new objects are returned.
     *
     * @param {String} [type]   domain type name
     *
     * @returns {Array<Object>} array of domain objects
     */
    newObjects(type)
    {
        return getNewObjects(this[secret].changes, type);
    }
    
    /**
     * Returns the registered deletions in this working set.
     *
     * @returns {Array<WorkingSetDeletion>} array with deleted objects
     */
    @computed
    get deletions()
    {
        return [ ... this[secret].changes.values()]
            .filter(entry => entry.status === WorkingSetStatus.DELETED)
            .map(mapEntryToDomainObject);
    }

    get hasChanges()
    {
        return this[secret].changes.size > 0;
    }


    /**
     * Persists the current changes contained in the working set to the server and resets the working set.
     *
     * @param {Function} [preprocessFn]     optional preprocessing function. Receives the array of current changes,
     *                                      returns an array of cleaned up objects. (default: use extractTypeData)
     *
     * @returns {Promise}
     */
    persist(preprocessFn = extractTypeDataFromObjects)
    {
        return PersistWorkingSetQuery.execute({
                domainObjects: preprocessFn(this.changes),
                deletions: this.deletions
            })
            .then(() => {
                this.revertAll();
            });
    }
}
