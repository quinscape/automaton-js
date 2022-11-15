import { action, computed, makeObservable, observable, reaction, toJS, comparer } from "mobx"
import { computedFn } from "mobx-utils"

import config from "./config"
import GraphQLQuery from "./GraphQLQuery"
import { field, value } from "./FilterDSL"
import { getGraphQLMethodType, getInputTypeName, getIQueryPayloadType } from "./util/type-utils"
import extractTypeData from "./extractTypeData"
import equalsScalar from "./util/equalsScalar"
import MergePlan from "./merge/MergePlan"
import React from "react"

import ChangeConflictDialog, { FieldStatus, FieldType, OPERATION_CANCEL } from "./ui/ChangeConflictDialog"
import { getWireFormat } from "./domain"
import { SCALAR } from "domainql-form/lib/kind"
import { MergeOperation } from "./merge/MergeOperation"
import { openDialog } from "./util/openDialog"
import toJSEveryThing from "./util/toJSEveryThing"
import { getCurrentProcess } from "./process/Process"
import { isPropertyWritable } from "domainql-form"


const LIST_OF_DOMAIN_OBJECTS_TYPE = "[DomainObject]";

const FROM_WIRE_OPTS = {
    fromWire: true,
    noWrapping: true
};

const TO_WIRE_OPTS = {
    fromWire: false,
    noWrapping: true
};

const GENERIC_SCALAR_REF = {
    kind: SCALAR,
    name: "GenericScalar"
};

/**
 * special internal value used to flag changed to be deleted
 */
const DELETE_CHANGE = { _delete: true}

function mapEntryToDomainObject(entry)
{
    return entry.domainObject
}

export function convertConflicts(inputConflicts, fromWire)
{
    const wireFormat = getWireFormat()

    const convertOpts = fromWire ? FROM_WIRE_OPTS : TO_WIRE_OPTS

    return inputConflicts.map(
        raw => ({
            ...raw,

            fields: raw.fields.map(rawField => {

                return ({
                    ...rawField,
                    ours: wireFormat.convert(
                        GENERIC_SCALAR_REF,
                        rawField.ours,
                        convertOpts
                    ),
                    theirs: wireFormat.convert(
                        GENERIC_SCALAR_REF,
                        rawField.theirs,
                        convertOpts
                    )
                });
            })
        })
    );
}


// language=GraphQL
const MergeWorkingSetQuery = new GraphQLQuery(`
    mutation mergeWorkingSet($changes: [EntityChangeInput]!, $deletions: [EntityDeletionInput]!, $mergeConfig: MergeConfigInput!)
    {
        mergeWorkingSet(
            mergeConfig: $mergeConfig,
            changes: $changes,
            deletions: $deletions
        )
        {
            conflicts{
                type
                id
                theirVersion
                deleted
                decided
                fields {
                    name
                    status
                    ours
                    theirs
                    references{
                        id
                        version
                    }
                    informational
                }
            }
            done
        }
    }`
);


function changeKey(type, id)
{
    return type + ":" + id;
}


/**
 * Enum for the status of an entity registration
 * 
 * @readonly
 * @enum {string}
 */
export const WorkingSetStatus = {
    /**
     * Object is registered as a new object
     * @member {string}
     */
    NEW: "NEW",
    /**
     * Object is pre-existing and modified.
     * @member {string}
     */
    MODIFIED: "MODIFIED",
    /**
     * Object is marked as deleted.
     * @member {string}
     */
    DELETED: "DELETED",
    /**
     * Base version for the object is registered, but no changes.
     * @member {string}
     */
    REGISTERED: "REGISTERED"
};

Object.freeze(WorkingSetStatus);

const secret = Symbol("WorkingSetSecret");


/**
 * @typedef GenericScalar
 * @type {object}
 * @property {String} type      scalar type
 * @property {*} value          value
 */

/**
 * Entry for a deleted domain object
 *
 * @typedef WorkingSetDeletion
 * @type {object}
 * @property {String} type                      type name
 * @property {{type: String, value: *}} id      id value as generic scalar
 */

/**
 * 
 * @param {EntityRegistration} entry
 * @return {object}
 */
function mapEntityRegistrationToDomainObject(entry)
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
 * @param {Map} registrations
 * @param {String} [type]   optional type
 */
const getNewObjects = computedFn((registrations, type) => {
    return [...registrations.values()]
        .filter(entry => entry.status === WorkingSetStatus.NEW && (!type || entry.domainObject._type === type))
        .map(mapEntityRegistrationToDomainObject);
});

const DEFAULT_MERGE_CONFIG = {
    typeConfigs: [],
    allowDiscard: true,
    allowApply: true,
    logMergeScenarios: __DEV,
    reactionTimeout: 250
};


function findChange(changes, typeName, id)
{
    for (let i = 0; i < changes.length; i++)
    {
        const change = changes[i];
        if (change.type === typeName && change.id.value === id)
        {
            return change;
        }
    }
    return null;
}


function getChangesForNewObject(domainObject, mergePlan)
{
    const { _type: typeName } = domainObject;

    const fieldChanges = [];

    const { scalarFields, groupFields } = mergePlan.getInfo(typeName);

    for (let i = 0; i < groupFields.length; i++)
    {
        const fieldsOfGroup = groupFields[i];

        for (let j = 0; j < fieldsOfGroup.length; j++)
        {
            const {name, type} = fieldsOfGroup[j];

            if (isPropertyWritable(domainObject, name)) {
                const currValue = domainObject[name];
    
                fieldChanges.push({
                    field: name,
                    value: {
                        type,
                        value: currValue
                    }
                });

            }
        }
    }

    for (let i = 0; i < scalarFields.length; i++)
    {
        const {name, type} = scalarFields[i];

        if (isPropertyWritable(domainObject, name)) {
            const currValue = domainObject[name];

            // XXX: We ignore all undefined values so clearing a former existing value with undefined won't work.
            //      Use null in that case
            if (currValue !== undefined)
            {
                fieldChanges.push({
                    field: name,
                    value: {
                        type,
                        value: currValue
                    }
                });
            }
        }
    }

    return fieldChanges;
}


/**
 * Gets the changes to scalar
 *
 * @param {Map} registrations       map of registrations keyed by change key ("<type>:<id>")
 * @param {MergePlan} mergePlan     merge plan instance
 *
 * @returns {Array<Object>} Array of changes ( typed "EntityChange" in GraphQL)
 */
function getFieldChanges(registrations, mergePlan)
{
    let out = [];

    for (let entry of registrations.values())
    {
        // do final update to catch changes made in the current un-commited mobx transaction
        entry._updateChanges(entry.workingSet, entry.recalculateChanges())

        const { changes, domainObject, typeName, status } = entry;

        const isNew = status === WorkingSetStatus.NEW;
        let fieldChanges
        if (isNew)
        {
            fieldChanges = getChangesForNewObject(entry.domainObject, mergePlan)
        }
        else if (changes.size)
        {
            fieldChanges = []
            for (let [field, value] of changes)
            {
                fieldChanges.push({
                    field,
                    value
                });
            }
        }

        if (fieldChanges)
        {
            const { idType } = mergePlan.getInfo(typeName);

            out.push({
                changes: fieldChanges,
                id: {
                    type: idType,
                    value: domainObject.id
                },
                version: domainObject.version,
                type: typeName,
                new: isNew
            })
        }
    }

    return out;
}


/**
 * Returns the changes for many-to-many fields resulting from the changes contained in the given registrations map.
 *
 * @param {Map} registrations                      map of current objects keyed by change key ("<type>:<id>")
 * @param {MergePlan} mergePlan                 merge plan instance
 */
function getManyToManyChanges(registrations, mergePlan)
{
    let manyToManyChanges = []
    let manyToManyDeletions = []
    for (let registration of registrations.values())
    {
        const { base, domainObject, typeName } = registration;
        const { embedded } = mergePlan.getInfo(typeName);
        const { idType } = mergePlan.getInfo(typeName);

        for (let i = 0; i < embedded.length; i++)
        {
            const entry = embedded[i]
            if (entry.isManyToMany)
            {
                const {
                    name: linkFieldName,
                    leftSideRelation,
                    rightSideRelation
                } = entry;

                const otherRelation = leftSideRelation.targetType !== typeName ? leftSideRelation : rightSideRelation

                //console.log("otherRelation", otherRelation)

                const linkedA = base != null ? base[linkFieldName] : [];
                if (linkedA === undefined)
                {
                    // if we have a undefined base array, we just keep ignoring that property
                    continue
                }

                const linkedB = domainObject[linkFieldName];
                const idField = otherRelation.sourceFields[0];

                // delete all A not found in B
                for (let j = 0; j < linkedA.length; j++)
                {
                    const linkA = linkedA[j];

                    let found = false;
                    for (let k = 0; k < linkedB.length; k++)
                    {
                        const linkB = linkedB[k];

                        if (linkA[idField] === linkB[idField])
                        {
                            found = true
                            break
                        }
                    }
                    if (!found)
                    {

                        const {_type: type, version, id} = linkA

                        manyToManyDeletions.push({
                            type,
                            version,
                            id: {
                                type: idType,
                                value: id
                            }
                        })
                    }
                }

                // create all B that were not present in A
                for (let j = 0; j < linkedB.length; j++)
                {
                    const linkB = linkedB[j];

                    let found = false;
                    for (let k = 0; k < linkedA.length; k++)
                    {
                        const linkA = linkedA[k];

                        if (linkB[idField] === linkA[idField])
                        {
                            found = true
                            break
                        }
                    }
                    if (!found)
                    {

                        manyToManyChanges.push({
                            changes: getChangesForNewObject(linkB, mergePlan),
                            id: {
                                type: idType,
                                value: domainObject.id
                            },
                            version: null,
                            type: otherRelation.sourceType,
                            new: true
                        })
                    }
                }
            }
        }
    }
    return { manyToManyChanges, manyToManyDeletions }
}

function findManyToManyObjectName(mergePlan, type, name)
{
    const { embedded } = mergePlan.getInfo(type);

    for (let i = 0; i < embedded.length; i++)
    {
        const e = embedded[i];
        if (e.name === name)
        {
            if (!e.rightSideRelation)
            {
                //console.log("No rightSideRelation for", type, name)
                return null;
            }

            return e.rightSideRelation.leftSideObjectName;
        }
    }
    return null;
}


/**
 * Prepares the received merge conflicts for the merge dialog.
 *
 * @param mergePlan
 * @param result
 * @param registrations
 */
function prepareMergeConflicts(mergePlan, result, registrations)
{
    result.conflicts.forEach(c => {

        const { type, id, fields } = c;

        const key = changeKey(type, id.value);
        const { domainObject, status } = registrations.get(key)

        if (status === WorkingSetStatus.NEW || status === WorkingSetStatus.MODIFIED)
        {
            for (let i = 0; i < fields.length; i++)
            {
                const field = fields[i];

                const { name, theirs } = field;
                if (theirs.type === "DomainObject")
                {
                    field.ours = {
                        type: theirs.type,
                        value: domainObject[name]
                    };
                }
            }
        }

        for (let i = 0; i < fields.length; i++)
        {
            const field = fields[i];

            const { name, theirs, status, ours, informational } = field;

            if (informational && status === FieldStatus.THEIRS && ours === null)
            {
                if (theirs.type === LIST_OF_DOMAIN_OBJECTS_TYPE)
                {
                    const targetTypeName = domainObject._type;
                    const linkField = findManyToManyObjectName(mergePlan, targetTypeName, name);
                    if (linkField)
                    {
                        field.ours = {
                            type: theirs.type,
                            value: domainObject[name].map(link => link[linkField])
                        };
                    }
                }
                else
                {
                    field.ours = {
                        type: theirs.type,
                        value: domainObject[name]
                    };

                }
            }
        }

    });
}


const BASE_FROM_JS_OPTS = {
    fromWire: true,
    withType: true,
    noWrapping: true
};

const BASE_TO_JS_OPTS = {
        fromWire: false,
        withType: true
    }
;

const CHANGE_TO_JS_OPTS = {
    fromWire: false,
    withType: true
};


function linkedObjectEquality(valueA, valueB)
{
    if (valueA === null)
    {
        return valueB === null
    }
    if (valueB === null)
    {
        // we just checked that valueA is not null
        return false
    }
    if (valueA.length !== valueB.length)
    {
        return false
    }

    for (let i = 0; i < valueA.length; i++)
    {
        if (valueA[i].id !== valueB[i].id)
        {
            return false
        }
    }
    return true;
}


function checkUpdateEquality(registration, a,b)
{
    if (a.length !== b.length)
    {
        return false;
    }

    for (let i = 0; i < a.length; i += 3)
    {
        const scalarType = a[i + 1]

        const nameA = a[i];
        const nameB = b[i];
        const valueA = a[i + 2];
        const valueB = b[i + 2];

        if (nameA !== nameB)
        {
            return false
        }
        // we have to special case the artificial changes we produce for many-to-many changes
        else if (scalarType === LIST_OF_DOMAIN_OBJECTS_TYPE)
        {
            // we have to check all linked objects in the updates set to see if there are changes
            if (!linkedObjectEquality(valueA, valueB)) {
                return false;
            }
        }
        else if (!equalsScalar(scalarType, valueA, valueB))
        {
            return false
        }
    }
    return true
}


function compareLinkObjects(a, b, idField)
{
    if (a.length !== b.length)
    {
        return false;
    }

    for (let i = 0; i < a.length; i++)
    {
        const id = a[i][idField];
        let found = false
        for (let j = 0; j < b.length; j++)
        {
            if (id === b[j][idField])
            {
                found = true
                break;
            }
        }
        if (!found)
        {
            return false;
        }
    }
    return true;

}


/**
 * A registration for single entity instance identified by a type/id tuple. Encapsulates the status, the observable
 * object for the entity and the JS base version of that entity.
 */
class EntityRegistration
{
    /**
     * Observable object for this entity registration. Type and id must match that of the registration.
     *
     * @type {object}
     */
    _domainObject = null

    /**
     * Status of this entry
     * @type {WorkingSetStatus}
     */
    status = WorkingSetStatus.REGISTERED

    /**
     * Base version for this entity registration. (non-observable js-object)
     *
     * @type {object}
     */
    base = null

    dispose = null;

    /**
     *
     * @type {WorkingSet}
     */
    workingSet = null;

    /**
     * Incrementally updated map of changes collected via a reaction
     * @type {Map<String,GenericScalar>}
     */
    changes = observable.map()

    key
    typeName
    id

    constructor(workingSet, domainObject, base, status = WorkingSetStatus.REGISTERED)
    {
        this.typeName = base ? base._type : domainObject._type
        this.id = base ? base.id : domainObject.id

        const typeDef = config.inputSchema.getType(this.typeName);
        if (!typeDef)
        {
            throw new Error("Could not find type '" + this.typeName + "'")
        }

        this.key = changeKey(this.typeName, this.id)

        //console.log("Create EntityRegistration", this.key , {workingSet, domainObject, base, status})

        this.workingSet = workingSet
        this.domainObject = domainObject
        this.base = base
        this.status = status
    }

    get domainObject()
    {
        return this._domainObject
    }

    set domainObject(domainObject)
    {
        this._domainObject = domainObject

        // if we have registered a reaction, we need to redo that with the new object
        if (this.registered)
        {
            this.unregisterReaction()
            this.registerReaction()
        }

    }

    _updateChanges = action("_updateChanges", (workingSet, updates) => {

        //console.log("UPDATES", updates)

        for (let i = 0; i < updates.length; i += 3)
        {
            const name = updates[i];
            const type = updates[i + 1];
            const value = updates[i + 2];

            if (value === DELETE_CHANGE)
            {
                //console.log("Delete change for", name)

                this.changes.delete(name)
            }
            else
            {
                const entry = this.changes.get(name)
                if (entry)
                {
                    //console.log("Update change for ", name, " to ", value)

                    entry.type = type
                    entry.value = value
                }
                else
                {
                    //console.log("Create change for ", name, ": ", value)

                    this.changes.set(name, { type, value })
                }
            }
        }

        const { onNextChangeCallbacks } = workingSet[secret];

        workingSet[secret].onNextChangeCallbacks = []
        
        onNextChangeCallbacks.forEach( fn => fn())
    })

    get registered()
    {
        return !!this.dispose
    }

    registerReaction()
    {
        //console.log("registerReaction", this.key, "domainObject #",FormContext.getUniqueId(this.domainObject))

        if (this.dispose)
        {
            throw new Error("Reaction already registered")
        }
        const { workingSet } = this

        this.dispose = reaction(
            () => this.recalculateChanges(),
            changes => this._updateChanges(workingSet, changes),
            {
                name: "WS" + workingSet.id + ":" + this.key,
                equals: (a,b) => checkUpdateEquality(this,a,b),
                delay: workingSet.mergeConfig.reactionTimeout
            }
        )

    }
    unregisterReaction()
    {
        if (!this.dispose)
        {
            throw new Error("Reaction already unregistered")
        }

        const { dispose } = this

        if (typeof dispose === "function")
        {
            dispose();
        }
        this.dispose = null
    }


    /**
     * Reaction method that gets executed whenever the domain object registered with the association changes
     */
    recalculateChanges()
    {
        const { domainObject, status } = this;
        //console.log("_updateFieldChanges", this.key, toJS(domainObject))

        if ((status !== WorkingSetStatus.MODIFIED && status !== WorkingSetStatus.NEW) || !domainObject)
        {
            // no changes
            return [];
        }

        const updates = []
        this.collectFieldUpdates(updates);
        this.collectManyToManyUpdates(updates);

        //console.log("recalculateChanges", updates)

        return updates

    }


    collectFieldUpdates(updates)
    {
        const { changes, domainObject, base, workingSet, typeName, status } = this;
        const { mergePlan } = workingSet[secret];

        const isNew = status === WorkingSetStatus.NEW;

        const {scalarFields, groupFields} = mergePlan.getInfo(typeName);
        let addGroup = false;
        for (let i = 0; i < groupFields.length; i++)
        {
            const fieldsOfGroup = groupFields[i];

            const changesForGroup = [];
            for (let j = 0; j < fieldsOfGroup.length; j++)
            {
                const {name, type} = fieldsOfGroup[j];

                const baseValue = base && base[name];
                const currValue = domainObject[name];

                changesForGroup.push(
                    name,
                    type,
                    currValue
                );

                if (isNew || !equalsScalar(type, baseValue, currValue))
                {
                    addGroup = true;
                }
            }

            if (addGroup)
            {
                updates.push(...changesForGroup)
            }
            else
            {
                for (let j = 0; j < changesForGroup.length; j += 3)
                {
                    const name = changesForGroup[j];
                    if (changes.has(name))
                    {
                        updates.push(
                            name,
                            null,
                            DELETE_CHANGE
                        )
                    }
                }
            }
        }

        for (let i = 0; i < scalarFields.length; i++)
        {
            const {name, type} = scalarFields[i];

            if(!isPropertyWritable(domainObject, name)) {
                continue;
            }

            const currValue = domainObject[name];

            // XXX: We ignore all undefined values so clearing a former existing value with undefined won't work.
            //      Use null in that case

            if (currValue !== undefined)
            {
                if (isNew)
                {
                    updates.push(
                        name,
                        type,
                        currValue
                    )
                }
                else
                {
                    const baseValue = base && base[name];
                    if (equalsScalar(type, baseValue, currValue))
                    {
                        if (changes.has(name))
                        {
                            updates.push(
                                name,
                                null,
                                DELETE_CHANGE
                            )
                        }
                    }
                    else
                    {
                        updates.push(
                            name,
                            type,
                            currValue
                        )
                    }
                }
            }
        }
    }


    collectManyToManyUpdates(updates)
    {
        const { domainObject, base, workingSet, typeName } = this;
        const { mergePlan } = workingSet[secret];

        const { embedded } = mergePlan.getInfo(typeName);

        for (let i = 0; i < embedded.length; i++)
        {
            const entry = embedded[i];
            if (entry.isManyToMany)
            {
                const {
                    name: linkFieldName,
                    leftSideRelation,
                    rightSideRelation
                } = entry;

                const otherRelation = leftSideRelation.targetType !== typeName ? leftSideRelation : rightSideRelation

                const linkArrayBase = base && base[linkFieldName];

                if (!linkArrayBase)
                {
                    // if we have a undefined base array, we just keep ignoring that property
                    continue
                }

                const linkArray = domainObject[linkFieldName];

                const idField = otherRelation.sourceFields[0];
                if (!compareLinkObjects(linkArrayBase, linkArray, idField))
                {
                    updates.push(
                        linkFieldName,
                        LIST_OF_DOMAIN_OBJECTS_TYPE,
                        linkArray.map(link => link[otherRelation.leftSideObjectName]),
                    )
                }
                else
                {
                    updates.push(
                        linkFieldName,
                        LIST_OF_DOMAIN_OBJECTS_TYPE,
                        DELETE_CHANGE
                    )
                }
            }
        }
    }
}

let counter = 0


/**
 * Validates that the given GraphQLQuery has the given type as payload type and returns the name of the GraphQL query
 * used in the query.
 *
 * The query is expected to contain only one GraphQL method call.
 *
 * @param {String} type             domain type
 * @param {GraphQLQuery} query      GraphQLQuery instance
 *
 * @return {String} GraphQL query name
 */
function validateQuery(type, query)
{
    const { methodCalls, aliases } = query.getQueryDefinition();

    if (methodCalls.length !== 1)
    {
        throw new Error("WorkingSet.load: GrapQLQuery must have exactly one method call. is = " + query);
    }

    const name = methodCalls[0];
    const gqlMethodName = aliases ? aliases[name] || name : name;

    const methodName = getGraphQLMethodType(gqlMethodName).name
    const iQueryType = getIQueryPayloadType(methodName)

    if (iQueryType !== type)
    {
        throw new Error("Expected query to have the payload type " + type + ", but " + methodName + " has the payload type " + iQueryType )
    }

    return gqlMethodName
}


/**
 * Encapsulates a current set of changes to domain objects not yet persisted to the server-side.
 */
export default class WorkingSet {
    _mergeQuery;
    _openDialog;

    /**
     * Counter id for this WorkingSet
     * @type {number}
     */
    id;


    constructor(mergeConfig = null)
    {
        //console.log("New WorkingSet", mergeConfig)

        this[secret] = {
            /**
             * @type {Map<string,EntityRegistration>}
             */
            registrations: observable.map(),
            mergePlan: new MergePlan({
                ... DEFAULT_MERGE_CONFIG,
                ... mergeConfig
            }),
            /**
             * Callback queue to be flushed on next update
             * @type Array<Function>
             */
            onNextChangeCallbacks: []
        }

        // Store query and openDialog internally for easy hijacking in test
        this._mergeQuery = MergeWorkingSetQuery;
        this._openDialog = openDialog;

        makeObservable(this)

        const currentProcess = getCurrentProcess();

        const workingSetName = "WorkingSet #" + (counter++) + " (" + currentProcess.name + ")";

        currentProcess.addProcessEffect(() => {

            //console.log("Registering", workingSetName)

            const { registrations } = this[secret]

            for (let entry of registrations.values())
            {
                //console.log("ENTRY", entry)

                if (!entry.registered)
                {
                    entry.registerReaction()
                }
            }
            return () => {

                //console.log("Unregistering", workingSetName)

                const { registrations } = this[secret]

                for (let entry of registrations.values())
                {
                    if (entry.registered)
                    {
                        entry.unregisterReaction()
                    }
                }
            }

        }, null)


        //console.log("MERGE-PLAN:", this[secret].mergePlan)
    }

    get registrations()
    {
        return [ ... this[secret].registrations.values() ]
    }

    static fromJS(data)
    {
        const { registrations, mergeConfig } = data;

        const wireFormat = getWireFormat();

        const ws = new WorkingSet(mergeConfig);
        const internal = ws[secret];
        
        for (let key in registrations)
        {
            if (registrations.hasOwnProperty(key))
            {
                const { status, domainObject: raw, base, typeName } = registrations[key];

                let domainObject = null;
                let convertedBase = null;
                if (raw)
                {
                    const typeDef = config.inputSchema.getType(typeName);
                    if (!typeDef)
                    {
                        throw new Error("Could not find type '" + typeName + "'")
                    }

                    domainObject = wireFormat.convert(
                        typeDef,
                        raw,
                        true
                    );

                    if (base)
                    {
                        convertedBase = wireFormat.convert(
                            typeDef,
                            base,
                            BASE_FROM_JS_OPTS
                        );
                    }
                }


                internal.registrations.set(
                    key,
                    new EntityRegistration(ws, domainObject, convertedBase, status)
                );
            }
        }

        return ws;
    }


    /**
     * Executes the given callback after the next update has been processed. This callback is only executed *once*.
     * @param {Function} cb
     */
    onNextChange(cb)
    {
        if (typeof cb !== "function")
        {
            throw new Error("Callback must be a function");
        }
        this[secret].onNextChangeCallbacks.push(cb);
    }


    toJS()
    {
        const { registrations, mergePlan } = this[secret];
        const wireFormat = getWireFormat();

        const convertedRegistrations = {};

        for (let [key, entry] of registrations)
        {
            const { status, domainObject, base, typeName } = entry;

            let converted = null;
            if (domainObject)
            {
                const typeDef = config.inputSchema.getType(typeName);

                converted = wireFormat.convert(
                    typeDef,
                    domainObject,
                    CHANGE_TO_JS_OPTS
                );

            }

            let convertedBase = null
            if (base)
            {
                const typeDef = config.inputSchema.getType(typeName);

                convertedBase = wireFormat.convert(
                    typeDef,
                    base,
                    BASE_TO_JS_OPTS
                )
            }

            convertedRegistrations[key] = {
                status,
                domainObject: converted
            }

        }

        return {
            registrations: convertedRegistrations,
            mergeConfig: {
                ... mergePlan.mergeConfig,
                // we don't want to print logs for already recorded scenarios in the tests
                logMergeScenarios : false
            }
        };
    }


    /**
     * Registers the base version of an object before changing it within the working set.
     * If an object with the same type and the same id is already registered, this method does
     * nothing.
     *
     * @param {object} domainObject             domain object to register the base version of. Can be a complex GraphQL output graph.
     * @param {boolean} [followRelations]       if true, follow the relations of the domain object to connected objects and register those, too. Default is true
     * @param {boolean} [trackChanges]          if true (default), not only register the base version of the object, but also track the same
     *                                          object for changes
     */
    @action
    registerBaseVersion(domainObject, followRelations = true, trackChanges = true)
    {
        const { _type, id } = domainObject;

        if (!id)
        {
            throw new Error("Domain Object has no id: " + JSON.stringify(domainObject));
        }

        //console.log("REGISTER BASE", _type, id);

        const { registrations } = this[secret];

        const key = changeKey(_type, id);

        const existing = registrations.get(key);
        if (!existing)
        {

            const entityRegistration = new EntityRegistration(this, null, toJS(domainObject), WorkingSetStatus.REGISTERED);
            registrations.set(
                key,
                entityRegistration
            );

            entityRegistration.registerReaction()

            // if (followRelations)
            // {
            //     this.registerRelations(domainObject);
            // }
        }
        else
        {
            existing.base = toJS(domainObject)
        }

        if (trackChanges)
        {
            this.addChanges(domainObject, followRelations);
        }
    }


    // XXX: something similar to this needs to be done if we want to selective follow marked relations according to some
    //      domain meta config.
    // registerRelations(domainObject)
    // {
    //     const { mergePlan } = this[secret];
    //     const { inputSchema } = config;
    //
    //     const { _type } = domainObject;
    //
    //     if ( !_type )
    //     {
    //         throw new Error("Not _type field: " + JSON.stringify(domainObject))
    //     }
    //
    //     const { embedded } = mergePlan.getInfo(_type);
    //
    //     for (let i = 0; i < embedded.length; i++)
    //     {
    //         const { name, isManyToMany, linkTypeName } = embedded[i];
    //
    //         if (isManyToMany)
    //         {
    //
    //             const elements = domainObject[name];
    //
    //             if (elements)
    //             {
    //                 for (let j = 0; j < elements.length; j++)
    //                 {
    //                     this.registerBaseVersion(
    //                         elements[j],
    //                         // we special case many-to-many handling here, so we don't want to follow relations for this object
    //                         false,
    //                         false
    //                     );
    //                 }
    //
    //                 // find relations originating from element type of the embedded list that do not point the type we're coming from
    //                 const relations = inputSchema.getRelations().filter(r => r.sourceType === linkTypeName && r.targetType !== _type);
    //
    //                 for (let j = 0; j < relations.length; j++)
    //                 {
    //                     const { leftSideObjectName } = relations[j];
    //                     if (leftSideObjectName)
    //                     {
    //                         for (let k = 0; k < elements.length; k++)
    //                         {
    //                             const element = elements[k];
    //                             const leftSideObject = element[leftSideObjectName];
    //                             if (leftSideObject && leftSideObject.id)
    //                             {
    //                                 this.registerBaseVersion(leftSideObject, true, false);
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         else
    //         {
    //             const targetObj = domainObject[name];
    //             if (targetObj && targetObj.id)
    //             {
    //                 this.registerBaseVersion(targetObj, true, false)
    //             }
    //         }
    //     }
    // }


    /**
     * Adds a domain object as new object.
     *
     * @param domainObject
     */
    @action
    addNew(domainObject)
    {
        const { _type, id } = domainObject;
        const { registrations } = this[secret];

        const key = changeKey(_type, id);

        const existing = registrations.get(key);
        if (existing)
        {
            throw new Error(
                `Error registering new object in working set: An object with the same identity is already registered, type = ${_type}, id = ${id}, status = ${existing.status}`
            )
        }

        registrations.set(
            key,
            new EntityRegistration(this, domainObject, null, WorkingSetStatus.NEW)
        );

        //this.addRelationChanges(domainObject);
    }


    /**
     * Adds a domain object as changed object. If it was formerly marked as new object, it will remain a new object, but
     * with updated contents.
     *
     * @param {object} domainObject             domain object to register the base version of. Can be a complex GraphQL output graph.
     * @param {boolean} [followRelations]       if true, follow the relations of the domain object to connected objects and add changes for those, too. Default is true
     * @param {boolean} [allowUnregistered]     if true, automatically register objects with non-existing base versions as new.
     */
    @action
    addChanges(domainObject, followRelations = true, allowUnregistered = false)
    {
        const { _type, id } = domainObject;

        //console.log("addChanges", _type, id, "domainObject #",FormContext.getUniqueId(domainObject))

        const { registrations } = this[secret];

        const key = changeKey(_type, id);

        const existing = registrations.get(key);

        if (!existing)
        {
            if (allowUnregistered)
            {
                if (!domainObject._type)
                {
                    throw new Error("Implicit new object lacks _type property.")
                }

                this.addNew(domainObject);
                this.addChanges(domainObject, followRelations, allowUnregistered);
                return;
            }
            else
            {

                throw new Error(`No base version registered for type='${ _type }, id=${ id }`);
            }

        }

        if (existing.status === WorkingSetStatus.NEW)
        {
            existing.domainObject = domainObject;
            existing.base = toJS(domainObject);
        }
        else
        {
            // NEW remains, all other become MODIFIED.
            existing.status = WorkingSetStatus.MODIFIED;
            existing.domainObject = domainObject;
        }

        // if (followRelations)
        // {
        //     this.addRelationChanges(domainObject);
        // }
    }


    // addRelationChanges(domainObject)
    // {
    //     const { mergePlan } = this[secret];
    //     const { inputSchema } = config;
    //
    //     const { _type, id } = domainObject;
    //
    //     const key = changeKey(_type, id);
    //     const { base } = this[secret].registrations.get(key);
    //
    //     const { embedded } = mergePlan.getInfo(_type);
    //
    //     for (let i = 0; i < embedded.length; i++)
    //     {
    //         const { name, isManyToMany, linkTypeName } = embedded[i];
    //
    //         // our assumptions for many-to-many and *-to-one relations are exactly the opposite
    //         // We never update the link objects for a many-to-many relation. Either the link exists and
    //         // we delete it or it doesn't and we create it.
    //
    //         if (isManyToMany)
    //         {
    //             // So if we encounter unknown objects when following a many-to-many relation it means
    //             // that that object is new
    //
    //             const elements = domainObject[name];
    //
    //             const baseElements = base && base[name];
    //             if (baseElements)
    //             {
    //                 for (let j = 0; j < baseElements.length; j++)
    //                 {
    //                     const baseElement = baseElements[j];
    //
    //                     if (!elements || !elements.find(e => e.id === baseElement.id))
    //                     {
    //                         this.markDeleted(baseElement);
    //                     }
    //                 }
    //             }
    //
    //             if (elements)
    //             {
    //                 for (let j = 0; j < elements.length; j++)
    //                 {
    //                     this.addChanges(
    //                         elements[j],
    //                         // we special case many-to-many handling here, so we don't want to follow relations for this object
    //                         false,
    //                         true
    //                     );
    //                 }
    //
    //                 // find relations originating from element type of the embedded list that do not point the type we're coming from
    //                 const relations = inputSchema.getRelations().filter(r => r.sourceType === linkTypeName && r.targetType !== _type);
    //
    //                 for (let j = 0; j < relations.length; j++)
    //                 {
    //                     const { leftSideObjectName, targetType } = relations[j];
    //                     if (leftSideObjectName)
    //                     {
    //                         for (let k = 0; k < elements.length; k++)
    //                         {
    //                             const element = elements[k];
    //                             const leftSideObject = element[leftSideObjectName];
    //                             if (leftSideObject && leftSideObject.id)
    //                             {
    //                                 this.addChanges(leftSideObject, true, true);
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         else
    //         {
    //             // if we find a new object following a *-to-one relation we assume that the object is newly assigned
    //             // and we register it as base version.
    //             //
    //             // Make sure to mark new objects connected by a *-to-one relation as new.
    //
    //             const targetObj = domainObject[name];
    //             if (targetObj && targetObj.id)
    //             {
    //                 const { _type, id } = targetObj;
    //                 const { registrations } = this[secret];
    //
    //                 const key = changeKey(_type, id);
    //                 const existing = registrations.get(key);
    //                 if (!existing)
    //                 {
    //                     this.registerBaseVersion(targetObj, true, false);
    //                 }
    //                 else if (existing.status !== WorkingSetStatus.REGISTERED)
    //                 {
    //                     this.addChanges(targetObj, true, true)
    //                 }
    //             }
    //         }
    //     }
    // }


    /**
     * Marks a domain object as deleted. Marking an object with the same domain type / id combination as new or
     * changed will undo the the deletion.
     *
     * @param domainObject
     */
    @action
    markDeleted(domainObject)
    {
        const { _type, id, version } = domainObject;
        const { registrations } = this[secret];

        const key = changeKey(_type, id);

        const existing = registrations.get(key);

        if (existing && existing.status === WorkingSetStatus.NEW)
        {
            // if an object was new and is deleted now, we just revert the changes
            this.revert(domainObject);
        }
        else
        {
            // otherwise we mark it as deleted
            registrations.set(
                key,
                new EntityRegistration(this, domainObject, null, WorkingSetStatus.DELETED)
            );

            //XXX: not needed?
            
            // this.registerRelations(domainObject);
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

        this[secret].registrations.delete(
            changeKey(_type, id)
        );
    }


    /**
     * Forgets all changes.
     */
    @action
    clear()
    {
        this[secret].registrations.clear();
    }


    /**
     * Discards all changes by reverting the observables registered as changed back to their original state
     */
    @action
    discard()
    {
        const { mergePlan } = this[secret];
        const defaultDiscard = () => {

            const { registrations } = this[secret];

            for (let entry of registrations.values())
            {
                const { status, domainObject, base } = entry;
                const { _type: domainType } = base;

                if (status === WorkingSetStatus.REGISTERED)
                {
                    continue;
                }

                const { scalarFields, groupFields, embedded } = mergePlan.getInfo(domainType);

                for (let i = 0; i < groupFields.length; i++)
                {
                    const fieldsOfGroup = groupFields[i];

                    for (let j = 0; j < fieldsOfGroup.length; j++)
                    {
                        const { name } = fieldsOfGroup[j];

                        domainObject[name] = base[name];
                    }
                }

                for (let i = 0; i < scalarFields.length; i++)
                {
                    const { name } = scalarFields[i];
                    domainObject[name] = base[name];
                }

                for (let i = 0; i < embedded.length; i++)
                {
                    const { name } = embedded[i];
                    domainObject[name] = base[name];
                }
            }
        };

        if (typeof mergePlan.mergeConfig.onDiscard === "function")
        {
            mergePlan.mergeConfig.onDiscard(defaultDiscard);
        }
        else
        {
            defaultDiscard();
        }
    }


    @action
    apply(resolutions, conflicts)
    {
        const { mergePlan } = this[secret];
        const defaultApply = () => {

            const { registrations } = this[secret];

            for (let i = 0; i < resolutions.length; i++)
            {
                const { type, id, fields, deleted, version } = resolutions[i];
                const { fields: conflictFields } = conflicts[i];

                const registration = registrations.get(changeKey(type, id.value));
                const { domainObject, base } = registration;

                const { versionField } = config.mergeOptions;


                domainObject[versionField] = version;

                let changeInEmbbed = false;
                let changeInBaseEmbbed = false;
                for (let j = 0; j < fields.length; j++)
                {
                    const field = fields[j];

                    const { status, fieldType } = field;

                    if (status === FieldStatus.THEIRS || status === FieldStatus.VALUE)
                    {
                        //console.log("APPLY", field, "to", toJS(domainObject));

                        if (fieldType === FieldType.MANY_TO_MANY)
                        {
                            changeInEmbbed = true;

                            const { leftSideRelation, rightSideRelation } = mergePlan.getInfo(type).embedded.find(e => e.name === field.name);

                            const associations = field.value.value;

                            const newLinks = [];

                            for (let k = 0; k < associations.length; k++)
                            {
                                const association = associations[k];
                                const newLink = {
                                    _type: rightSideRelation.sourceType,
                                    id: conflictFields[j].references[k].id.value,
                                    [versionField]: conflictFields[j].references[k].version,
                                    [leftSideRelation.sourceFields[0]]: id.value,
                                    [rightSideRelation.sourceFields[0]]: association.id,
                                    [rightSideRelation.leftSideObjectName]: toJS(association)
                                }
                                newLinks.push(newLink)
                            }

                            //console.log("APPLY MANY-TO-MANY", toJS(newLinks))

                            domainObject[field.name] = newLinks;
                        }
                        else if (fieldType === FieldType.FK_KEY || fieldType === FieldType.FK_OBJECT)
                        {
                            domainObject[field.name] = field.value.value;
                            changeInEmbbed = true;
                        }
                        else
                        {
                            domainObject[field.name] = field.value.value;
                        }
                    }
                    //console.log("APPLY OURS", field, "to", toJS(domainObject));

                    // update base version with the currently known "their" values
                    if (fieldType === FieldType.MANY_TO_MANY)
                    {
                        changeInBaseEmbbed = true;

                        const { leftSideRelation, rightSideRelation } = mergePlan.getInfo(type).embedded.find(e => e.name === field.name);

                        base[field.name] = conflictFields[j].theirs.value.map((association, idx) => ({
                            _type: rightSideRelation.sourceType,
                            id: conflictFields[j].references[idx].id.value,
                            [versionField]: conflictFields[j].references[idx].version,
                            [leftSideRelation.sourceFields[0]]: id.value,
                            [rightSideRelation.sourceFields[0]]: association.id,
                            [rightSideRelation.leftSideObjectName]: association
                        }))

                        // for (let entry of registrations.values())
                        // {
                        //     if (entry.status === WorkingSetStatus.DELETED && entry.domainObject[leftSideRelation.sourceFields[0]] === id.value)
                        //     {
                        //         entry.base = null
                        //     }
                        // }
                    }
                    else
                    {
                        base[field.name] = conflictFields[j].theirs.value;
                    }
                }

                // if (changeInBaseEmbbed)
                // {
                //     this.registerRelations(base);
                // }
                //
                // if (changeInEmbbed)
                // {
                //     this.addRelationChanges(domainObject);
                // }

                //console.log("AFTER APPLY", toJS( { bases, registrations }, RECURSE_EVERYTHING))
            }
        };

        if (typeof mergePlan.mergeConfig.onApply === "function")
        {
            mergePlan.mergeConfig.onApply(defaultApply);
        }
        else
        {
            defaultApply();
        }

    }


    /**
     * Looks up the registration for a given entity
     *
     * @param type      entity type name
     * @param id        entity id
     *
     * @returns {EntityRegistration} entity registration for that entity
     */
    lookup(type, id)
    {
        const registrations = this[secret].registrations;
        return registrations.get(changeKey(type, id));
    }


    /**
     * Returns true, if there are actual modifications for the given entity, that is either one of its fields changed or
     * a many-to-many connected entity changed

     * @param {Object|String} entity    entity object or domain type
     * @param {String} [id]             id value if the first argument is a type name.
     *
     * @returns true if the entity was modified
     */
    isModified(entity, id)
    {
        let type, entityId;
        if (entity && typeof entity === "object")
        {
            type = entity._type;
            entityId = entity.id;
        }
        else
        {
            if (!id)
            {
                throw new Error("Need id. 'isModified' either takes an object as argument or a type/id tuple.")
            }
            type = entity;
            entityId = id;
        }

        const key = changeKey(type, entityId);

        const { status, changes } = this[secret].registrations.get(key)

        if (status === WorkingSetStatus.NEW)
        {
            return true;
        }

        return changes.size > 0
    }

    /**
     * Looks up the base object for an given entity
     *
     * @param type      entity type name
     * @param id        entity id
     *
     * @returns {object} non-observable base object
     */
    lookupBase(type, id)
    {

        const entry = this[secret].registrations.get(changeKey(type, id));
        return entry ? entry.base : null;
    }


    /**
     *  Returns the array of changed domain objects except for the deletions. These are the objects with actual changes.
     *  A changed object that has its changed changed back to the intial value is no longer changed.
     *
     * @returns {Array<Object>} array with changed objects
     */
    @computed
    get changes()
    {
        return [...this[secret].registrations.values()]
            .filter(entry => (entry.status === WorkingSetStatus.MODIFIED && entry.changes.size > 0) || entry.status === WorkingSetStatus.NEW)
            .map(mapEntityRegistrationToDomainObject);
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
        return getNewObjects(this[secret].registrations, type);
    }

    /**
     * Returns the registered deletions in this working set.
     *
     * @returns {Array<WorkingSetDeletion>} array with deleted objects
     */
    @computed
    get deletions()
    {
        return [...this[secret].registrations.values()]
            .filter(entry => entry.status === WorkingSetStatus.DELETED)
            .map(mapEntryToDomainObject);
    }

    @computed
    get hasChanges()
    {
        const { registrations } = this[secret];
        for (let registration of registrations.values())
        {
            if (registration.status === WorkingSetStatus.NEW || registration.status === WorkingSetStatus.DELETED || registration.changes.size > 0)
            {
                return true
            }
        }
        return false;
    }


    /**
     * Merges the current changes contained in the working set using the merge functionality and resets the working set.
     *
     * @returns {Promise<*>} Promise resolving with the merge-result
     */
    @action
    merge(attempt = 1)
    {
        const { registrations, mergePlan } = this[secret];

        //console.log("registrations", registrations)

        if (typeof mergePlan.mergeConfig.beforeMerge === "function")
        {
            if (mergePlan.mergeConfig.beforeMerge(this, attempt) === false)
            {
                return Promise.resolve(OPERATION_CANCEL);
            }
        }

        const changes = getFieldChanges(registrations, mergePlan)

        const deletions = this.deletions.map(
            ({_type: type, version, id}) => ({
                type,
                version,
                id: {
                    type: mergePlan.getInfo(type).idType,
                    value: id
                }
            })
        );

        const { manyToManyChanges, manyToManyDeletions } = getManyToManyChanges(registrations, mergePlan)

        const vars = {
            mergeConfig: mergePlan.mergeConfig,
            changes: changes.concat(manyToManyChanges),
            deletions: deletions.concat(manyToManyDeletions)
        };

        //console.log("MERGE", { vars: toJS(vars), associations } );

        return this._mergeQuery.execute(vars)
            .then(({ mergeWorkingSet: result }) => {

                //console.log("MERGE RESULT", toJS(result));

                if (result.done)
                {
                    this.clear();
                    return MergeOperation.STORE;
                }
                else
                {
                    prepareMergeConflicts(mergePlan, result, registrations);

                    if (mergePlan.mergeConfig.logMergeScenarios)
                    {
                        console.info("STARTING MERGE: scenario = ", toJSEveryThing(
                            {
                                conflicts: convertConflicts(result.conflicts, false),
                                workingSet: this.toJS()
                            }
                        ));
                    }

                    return this._openDialog(
                        dialog => {
                            return (
                                <ChangeConflictDialog
                                    dialog={ dialog }
                                    conflicts={ result.conflicts }
                                    config={ mergePlan.mergeConfig }
                                />
                            );
                        },
                        {

                        }
                    )
                        .then(resolution => {

                            const { operation, resolutions } = resolution;

                            if (operation === MergeOperation.CANCEL)
                            {
                                return MergeOperation.CANCEL;
                            }
                            else if (operation === MergeOperation.DISCARD)
                            {
                                this.discard();
                                return MergeOperation.DISCARD;
                            }
                            else if (operation === MergeOperation.APPLY)
                            {
                                this.apply(resolutions, result.conflicts)
                                return MergeOperation.APPLY;
                            }
                            else if (operation === MergeOperation.STORE)
                            {
                                this.apply(resolutions, result.conflicts)
                                return this.merge(attempt + 1)
                            }
                            else
                            {
                                throw new Error("Invalid operation: " + operation)
                            }
                        });
                }
            })
    }

    get mergeConfig()
    {
        return this[secret].mergePlan.mergeConfig;
    }


    /**
     * Convenience method that loads the entity with the given name and type. If the entity is registered with the
     * working set, that instance is returned. Otherwise the entity is loaded from the given source and registered.
     *
     * The source function has to make sure it is safe to edit the domain object directly and should clone the object
     * if there is any doubt. load() does *not* clone.
     *
     * @param {String} type                     Domain type name
     * @param {String} id                       Entity id
     * @param {GraphQLQuery|function} source    GraphQL query to load the entity from or a function that returns a promise
     *                                          that resolves to the entity data ( (type,id) => Promise<Observable> )
     * @return {Promise<object>} Promise resolving to the referenced entity
     */
    load(type, id, source)
    {
        if (!type)
        {
            throw new Error("Need type")
        }
        if (!id)
        {
            throw new Error("Need id")
        }

        const registration = this.lookup(type,id )
        if (registration && registration.domainObject)
        {
            return Promise.resolve(registration.domainObject)
        }
        else
        {
            let promise;
            if (typeof source === "function")
            {
                promise = Promise.resolve(
                        source(type,id)
                    )
                    .then(result => {

                        if (!result)
                        {
                            return Promise.reject(
                                new Error("Entity source failed: function returned falsy value")
                            )
                        }
                        return result
                    })
            }
            else if (source instanceof GraphQLQuery)
            {
                const methodName = validateQuery(type, source)
                promise = source.execute({
                    config: {
                        condition:
                            field("id")
                                .eq(
                                    value(
                                        id
                                    )
                                )
                    }
                })
                    .then(result => {

                        if (!result[methodName].rows.length)
                        {
                            return Promise.reject(
                                new Error("Entity source failed: iQuery document contains no rows")
                            )
                        }
                        return result[methodName].rows[0]
                    })
            }
            return promise
                .then(
                    source => {
                        // we assume ownership over the value received from our source and do not clone the object
                        this.registerBaseVersion(source)
                        return source
                    }
                )
        }
    }


    /**
     * Changes all registered domain objects back to their original values. In contrast to clear() it keeps
     * the registrations alive, so the objects will be immediately be open to accept other changes.
     */
    @action
    undo()
    {
        const { registrations : registrationsArray } = this
        const { registrations } = this[secret]

        for (let i = 0; i < registrationsArray.length; i++)
        {
            const registration = registrationsArray[i]

            const { status } = registration
            
            if (status === WorkingSetStatus.MODIFIED)
            {
                // copy over all properties from base
                Object.assign(registration.domainObject, registration.base)
                // recalculate changes immediately to be safe for nested actions
                registration._updateChanges(this, registration.recalculateChanges())
            }
            else if (status === WorkingSetStatus.DELETED || status === WorkingSetStatus.NEW)
            {
                registrations.delete(registration.key)

                if (registration.dispose)
                {
                    registration.unregisterReaction()
                }
            }
        }
    }


    /**
     * A reactive reducer helper function. The given reducer function ( (domainObject,<T>) => <T> ) is applied to the
     * combined set of domain objects from the given iQuery document and the working set.
     *
     * @param {InteractiveQuery} iQuery     iQuery document
     * @param {function} fn                 reducer function
     * @param {*} initial                   initial reducer value
     *
     * @return {*} reducer result
     */
    reducer = computedFn((iQuery, fn, initial) => {

        const { registrations } = this[secret]
        const { rows } = iQuery

        let curr = initial;
        for (let registration of registrations)
        {
            const { status, domainObject } = registration
            if (status === WorkingSetStatus.NEW)
            {
                curr = fn(domainObject, curr)
            }
        }
        for (let i = 0; i < rows.length; i++)
        {
            const row = rows[i]
            const key = changeKey(row._type, row.id)
            const registration = registrations.get(key)
            if (registration)
            {
                const { status, domainObject } = registration
                if (status === WorkingSetStatus.MODIFIED)
                {
                    curr = fn(domainObject, curr)
                }
                else if (status === WorkingSetStatus.DELETED)
                {
                    curr = fn(row, curr)
                }
            }
            else
            {
                curr = fn(row, curr)
            }
        }
        return curr;

    }, {
        name: "WorkingSet.reducer"
    })

}

