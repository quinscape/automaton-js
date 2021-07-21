import { action, computed, observable, toJS } from "mobx"
import { computedFn } from "mobx-utils"

import config from "./config";
import GraphQLQuery from "./GraphQLQuery";
import { getInputTypeName } from "./util/type-utils";
import extractTypeData from "./extractTypeData";
import equalsScalar from "./util/equalsScalar";
import MergePlan from "./merge/MergePlan";
import React from "react";

import ChangeConflictDialog, {
    FieldStatus,
    FieldType,
    OPERATION_CANCEL,
    RECURSE_EVERYTHING
} from "./ui/ChangeConflictDialog";
import { getWireFormat } from "./domain";
import { SCALAR } from "domainql-form/lib/kind";
import { MergeOperation } from "./merge/MergeOperation";
import { openDialog } from "./util/openDialog";


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


export const WorkingSetStatus = {
    NEW: "NEW",
    MODIFIED: "MODIFIED",
    DELETED: "DELETED",
    REGISTERED: "REGISTERED"
};

Object.freeze(WorkingSetStatus);

const secret = Symbol("WorkingSetSecret");


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
    return [...changes.values()]
        .filter(entry => entry.status === WorkingSetStatus.NEW && (!type || entry.domainObject._type === type))
        .map(mapEntryToDomainObject);
});

const DEFAULT_MERGE_CONFIG = {
    typeConfigs: [],
    allowDiscard: true,
    allowApply: true,
    logMergeScenarios: __DEV
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


function getFieldChangesForObject(status, domainObject, bases, mergePlan)
{
    //console.log({ status, domainObject: toJS(domainObject) });
    const changes = [];


    if (status === WorkingSetStatus.DELETED || status === WorkingSetStatus.REGISTERED)
    {
        // no changes
        return changes;
    }

    const isNew = status === WorkingSetStatus.NEW;

    const {_type: typeName, id, version = null} = domainObject;

    const key = changeKey(typeName, id);
    const base = bases.get(key);

    const changesForEntity = [];

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

            changesForGroup.push({
                field: name,
                value: {
                    type,
                    value: currValue
                }
            });

            if (isNew || !equalsScalar(type, baseValue, currValue))
            {
                addGroup = true;
            }
        }

        if (addGroup)
        {
            changesForEntity.push(...changesForGroup);
        }
    }

    for (let i = 0; i < scalarFields.length; i++)
    {
        const {name, type} = scalarFields[i];

        const currValue = domainObject[name];

        // XXX: We ignore all undefined values so clearing a former existing value with undefined won't work.
        //      Use null in that case
        if (currValue !== undefined)
        {
            if (isNew)
            {
                changesForEntity.push({
                    field: name,
                    value: {
                        type,
                        value: currValue
                    }
                });
            }
            else
            {
                const baseValue = base[name];
                if (!equalsScalar(type, baseValue, currValue))
                {
                    changesForEntity.push({
                        field: name,
                        value: {
                            type,
                            value: currValue
                        }
                    });
                }
            }
        }
    }

    const {idType} = mergePlan.getInfo(typeName);

    /**
     * We record a change for the entity only if we have field changes
     */
    if (changesForEntity.length)
    {
        changes.push({
            id: {
                type: idType,
                value: id
            },
            version,
            type: typeName,
            changes: changesForEntity,
            new: isNew
        })
    }

    return changes;
}

function hasFieldChanges(status, domainObject, bases, mergePlan)
{

    if (status === WorkingSetStatus.DELETED || status === WorkingSetStatus.REGISTERED)
    {
        // no changes
        return false;
    }

    const isNew = status === WorkingSetStatus.NEW;

    const {_type: typeName, id } = domainObject;

    const key = changeKey(typeName, id);
    const base = bases.get(key);

    const {scalarFields, groupFields} = mergePlan.getInfo(typeName);

    for (let i = 0; i < groupFields.length; i++)
    {
        const fieldsOfGroup = groupFields[i];

        for (let j = 0; j < fieldsOfGroup.length; j++)
        {
            const {name, type} = fieldsOfGroup[j];

            const baseValue = base && base[name];
            const currValue = domainObject[name];

            if (isNew || !equalsScalar(type, baseValue, currValue))
            {
                return true;
            }
        }
    }

    for (let i = 0; i < scalarFields.length; i++)
    {
        const {name, type} = scalarFields[i];

        const currValue = domainObject[name];

        if (currValue !== undefined)
        {
            if (isNew)
            {
                return true;
            }
            else
            {
                const baseValue = base[name];
                if (!equalsScalar(type, baseValue, currValue))
                {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Gets the changes to scalar
 *
 * @param {Map} changesMap          map of current objects keyed by change key ("<type>:<id>")
 * @param {Map} bases               map with registered base objects by change key
 * @param {MergePlan} mergePlan     merge plan instance
 *
 * @returns {Array<Object>} Array of changes ( typed "EntityChange" in GraphQL)
 */
function getFieldChanges(changesMap, bases, mergePlan)
{
    let changes = [];

    for (let entry of changesMap.values())
    {
        const { domainObject, status } = entry;

        changes = changes.concat(getFieldChangesForObject(status, domainObject, bases, mergePlan));
    }

    return changes;
}


/**
 * Adds changes for many-to-many fields to the given list of changes.
 *
 * @param {Array<Object>} changesAndDeletions   list of existing changes
 * @param {Map} changesMap                      map of current objects keyed by change key ("<type>:<id>")
 * @param {MergePlan} mergePlan                 merge plan instance
 */
function getManyToManyChanges(changesAndDeletions, changesMap, mergePlan)
{
    const manyToManyLookup = new Map();
    const manyToManyChanges = [];

    for (let i = 0; i < changesAndDeletions.length; i++)
    {
        const change = changesAndDeletions[i];

        const linkTypes = mergePlan.linkTypes.get(change.type);
        // is the change or deletion for a link type representing a many-to-many relation?
        if (linkTypes)
        {
            // get the full object for the change
            const { domainObject: linkInstance } = changesMap.get(changeKey(change.type, change.id.value))

            for (let j = 0; j < linkTypes.length; j++)
            {
                const { targetType, relation } = linkTypes[j];

                const prefix = targetType + ":";

                for (let [key, { domainObject, status }] of changesMap.entries())
                {
                    let associatedObjects;
                    const manyToManyField = relation.rightSideObjectName;
                    if (
                        // if the object is of the target type
                        key.indexOf(prefix) === 0 &&
                        // and has an actual change
                        status !== WorkingSetStatus.REGISTERED &&
                        // the many-to-many field was selected
                        (associatedObjects = domainObject[manyToManyField]) &&
                        // and the id matches our linked id
                        domainObject.id === linkInstance[relation.sourceFields[0]]
                    )
                    {
                        let set = manyToManyLookup.get(key);
                        if (!set)
                        {
                            set = new Set();
                            manyToManyLookup.set(key, set);
                        }

                        set.add(manyToManyField);
                    }
                }
            }
        }
    }

    for (let [key, fields] of manyToManyLookup)
    {
        // get the full object for the change
        const { domainObject } = changesMap.get(key)

        for (let manyToManyField of fields)
        {
            const targetTypeName = domainObject._type;
            const linkField = findManyToManyObjectName(mergePlan, targetTypeName, manyToManyField);
            if (linkField)
            {

                // generate an additional change for the manyToManyField.
                const fieldChange = {
                    field: manyToManyField,
                    value: {
                        type: LIST_OF_DOMAIN_OBJECTS_TYPE,
                        // We represent the value of a many to many fields as a simplified list of associated values
                        // from the other side of the many to many relation.
                        value: domainObject[manyToManyField].map(o => o[linkField])
                    }
                };

                const existing = findChange(changesAndDeletions, targetTypeName, domainObject.id);
                if (existing)
                {
                    existing.changes.push(fieldChange);
                }
                else
                {
                    const { idType } = mergePlan.getInfo(targetTypeName);

                    manyToManyChanges.push({
                        id: {
                            type: idType,
                            value: domainObject.id
                        },
                        version: domainObject.version,
                        type: targetTypeName,
                        changes: [fieldChange],
                        new: false
                    })
                }
            }

        }
    }

    return manyToManyChanges;
}


/**
 * Checks for virtual many-to-many changes relating to a single entity
 *
 * @param {String} entityType       Domain type
 * @param {*} entityId              entity id
 * @param {Map} changesMap          map of current objects keyed by change key ("<type>:<id>")
 * @param {MergePlan} mergePlan     merge plan instance
 */
function hasManyToManyChanges(entityType, entityId, changesMap, mergePlan)
{
    for (let entry of changesMap.values())
    {
        const { status, domainObject: linkInstance } = entry;

        // the only changes that lead to virtual many-to-many changes on the connected entity are NEW and DELETE operations
        // on the link type, just changing potential fields within the link changes nothing for the connected entity.
        if (status === WorkingSetStatus.NEW || status === WorkingSetStatus.DELETED)
        {
            const linkTypes = mergePlan.linkTypes.get(linkInstance._type);
            if (linkTypes)
            {
                for (let j = 0; j < linkTypes.length; j++)
                {
                    const { targetType, relation } = linkTypes[j];

                    const prefix = targetType + ":";

                    for (let [key, { domainObject, status }] of changesMap.entries())
                    {
                        let associatedObjects;
                        const manyToManyField = relation.rightSideObjectName;
                        if (
                            // if the object is of the target type
                            key.indexOf(prefix) === 0 &&
                            // and has an actual change
                            status !== WorkingSetStatus.REGISTERED &&
                            // the many-to-many field was selected
                            (associatedObjects = domainObject[manyToManyField]) &&
                            // and the type matches our type
                            entityType === relation.targetType &&
                            // and the id matches our id
                            domainObject.id === linkInstance[relation.sourceFields[0]]
                        )
                        {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
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
 * @param changesMap
 */
function prepareMergeConflicts(mergePlan, result, changesMap)
{
    result.conflicts.forEach(c => {

        const { type, id, fields } = c;

        const key = changeKey(type, id.value);
        const { domainObject, status } = changesMap.get(key)

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



/**
 * Encapsulates a current set of changes to domain objects not yet persisted to the server-side.
 */
export default class WorkingSet {
    _mergeQuery;
    _openDialog;


    constructor(mergeConfig = null)
    {
        this[secret] = {
            changes: observable(
                new Map()
            ),
            bases: new Map(),
            mergePlan: new MergePlan({
                ...DEFAULT_MERGE_CONFIG,
                ...mergeConfig
            })
        }

        // Store query and openDialog internally for easy hijacking in test
        this._mergeQuery = MergeWorkingSetQuery;
        this._openDialog = openDialog;

        //console.log("MERGE-PLAN:", this[secret].mergePlan)
    }


    static fromJS(data)
    {
        const { bases, changes, mergeConfig } = data;

        const wireFormat = getWireFormat();

        const ws = new WorkingSet(mergeConfig);
        const internal = ws[secret];

        for (let key in bases)
        {
            if (bases.hasOwnProperty(key))
            {
                const base = bases[key];
                const { _type: typeName } = base;
                const typeDef = config.inputSchema.getType(typeName);

                if (!typeDef)
                {
                    throw new Error("Could not find type '" + typeName + "'")
                }

                const converted = wireFormat.convert(
                    typeDef,
                    base,
                    BASE_FROM_JS_OPTS
                );

                internal.bases.set(key, converted);
            }
        }

        for (let key in changes)
        {
            if (changes.hasOwnProperty(key))
            {
                const { status, domainObject: raw } = changes[key];

                let domainObject = null;
                if (raw)
                {
                    const { _type: typeName } = raw;

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
                }

                internal.changes.set(
                    key,
                    {
                        status,
                        domainObject
                    }
                );
            }
        }

        return ws;
    }


    toJS()
    {
        const { changes, bases, mergePlan } = this[secret];
        const wireFormat = getWireFormat();

        const convertedChanges = {};

        for (let [key, entry] of changes)
        {
            const { status, domainObject } = entry;

            let converted = null;
            if (domainObject)
            {
                const { _type: typeName } = domainObject;
                const typeDef = config.inputSchema.getType(typeName);

                converted = wireFormat.convert(
                    typeDef,
                    domainObject,
                    CHANGE_TO_JS_OPTS
                );

            }
            convertedChanges[key] = {
                status,
                domainObject: converted
            }

        }

        const convertedBases = {};

        for (let [key, base] of bases)
        {
            const { _type: typeName } = base;
            const typeDef = config.inputSchema.getType(typeName);

            if (!typeDef)
            {
                throw new Error("Could not find type '" + typeName + "': " + JSON.stringify(base));
            }

            convertedBases[key] = wireFormat.convert(
                typeDef,
                base,
                BASE_TO_JS_OPTS
            )
        }

        return {
            changes: convertedChanges,
            bases: convertedBases,
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
    registerBaseVersion(domainObject, followRelations = true, trackChanges = true)
    {
        const { _type, id } = domainObject;

        if (!id)
        {
            throw new Error("Domain Object has no id: " + JSON.stringify(domainObject));
        }

        //console.log("REGISTER BASE", _type, id);

        const { changes, bases } = this[secret];

        const key = changeKey(_type, id);

        const existing = changes.get(key);
        if (!existing)
        {

            changes.set(
                key,
                {
                    domainObject: null,
                    status: WorkingSetStatus.REGISTERED
                }
            );

            bases.set(
                key,
                toJS(domainObject)
            );

            if (followRelations)
            {
                this.registerRelations(domainObject);
            }
        }

        if (trackChanges)
        {
            this.addChanges(domainObject, followRelations);
        }
    }


    registerRelations(domainObject)
    {
        const { mergePlan } = this[secret];
        const { inputSchema } = config;

        const { _type } = domainObject;

        if ( !_type )
        {
            throw new Error("Not _type field: " + JSON.stringify(domainObject))
        }

        const { embedded } = mergePlan.getInfo(_type);

        for (let i = 0; i < embedded.length; i++)
        {
            const { name, isManyToMany, linkTypeName } = embedded[i];

            if (isManyToMany)
            {

                const elements = domainObject[name];

                if (elements)
                {
                    for (let j = 0; j < elements.length; j++)
                    {
                        this.registerBaseVersion(
                            elements[j],
                            // we special case many-to-many handling here, so we don't want to follow relations for this object
                            false,
                            false
                        );
                    }

                    // find relations originating from element type of the embedded list that do not point the type we're coming from
                    const relations = inputSchema.getRelations().filter(r => r.sourceType === linkTypeName && r.targetType !== _type);

                    for (let j = 0; j < relations.length; j++)
                    {
                        const { leftSideObjectName } = relations[j];
                        if (leftSideObjectName)
                        {
                            for (let k = 0; k < elements.length; k++)
                            {
                                const element = elements[k];
                                const leftSideObject = element[leftSideObjectName];
                                if (leftSideObject && leftSideObject.id)
                                {
                                    this.registerBaseVersion(leftSideObject, true, false);
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                const targetObj = domainObject[name];
                if (targetObj && targetObj.id)
                {
                    this.registerBaseVersion(targetObj, true, false)
                }
            }
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
        const { changes, bases } = this[secret];

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
                domainObject: domainObject,
                status: WorkingSetStatus.NEW
            }
        );

        bases.set(
            key,
            null
        );

        this.addRelationChanges(domainObject);
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
        const { changes, bases } = this[secret];

        const key = changeKey(_type, id);

        const existing = changes.get(key);

        if (!existing)
        {
            if (allowUnregistered)
            {
                if (!domainObject._type)
                {
                    throw new Error("Implicit new object lacks _type property. You set allowUnregistered to the missing type.")
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
            bases.set(key, toJS(domainObject));
            existing.domainObject = domainObject;
        }
        else
        {
            // NEW remains, all other become MODIFIED.
            existing.status = WorkingSetStatus.MODIFIED;
            existing.domainObject = domainObject;
        }

        if (followRelations)
        {
            this.addRelationChanges(domainObject);
        }
    }


    addRelationChanges(domainObject)
    {
        const { mergePlan } = this[secret];
        const { inputSchema } = config;

        const { _type, id } = domainObject;

        const key = changeKey(_type, id);
        const base = this[secret].bases.get(key);

        const { embedded } = mergePlan.getInfo(_type);

        for (let i = 0; i < embedded.length; i++)
        {
            const { name, isManyToMany, linkTypeName } = embedded[i];

            // our assumptions for many-to-many and *-to-one relations are exactly the opposite
            // We never update the link objects for a many-to-many relation. Either the link exists and
            // we delete it or it doesn't and we create it.

            if (isManyToMany)
            {
                // So if we encounter unknown objects when following a many-to-many relation it means
                // that that object is new

                const elements = domainObject[name];

                const baseElements = base && base[name];
                if (baseElements)
                {
                    for (let j = 0; j < baseElements.length; j++)
                    {
                        const baseElement = baseElements[j];

                        if (!elements || !elements.find(e => e.id === baseElement.id))
                        {
                            this.markDeleted(baseElement);
                        }
                    }
                }

                if (elements)
                {
                    for (let j = 0; j < elements.length; j++)
                    {
                        this.addChanges(
                            elements[j],
                            // we special case many-to-many handling here, so we don't want to follow relations for this object
                            false,
                            true
                        );
                    }

                    // find relations originating from element type of the embedded list that do not point the type we're coming from
                    const relations = inputSchema.getRelations().filter(r => r.sourceType === linkTypeName && r.targetType !== _type);

                    for (let j = 0; j < relations.length; j++)
                    {
                        const { leftSideObjectName, targetType } = relations[j];
                        if (leftSideObjectName)
                        {
                            for (let k = 0; k < elements.length; k++)
                            {
                                const element = elements[k];
                                const leftSideObject = element[leftSideObjectName];
                                if (leftSideObject && leftSideObject.id)
                                {
                                    this.addChanges(leftSideObject, true, true);
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                // if we find a new object following a *-to-one relation we assume that the object is newly assigned
                // and we register it as base version.
                //
                // Make sure to mark new objects connected by a *-to-one relation as new.

                const targetObj = domainObject[name];
                if (targetObj && targetObj.id)
                {
                    const { _type, id } = targetObj;
                    const { changes } = this[secret];

                    const key = changeKey(_type, id);
                    const existing = changes.get(key);
                    if (!existing)
                    {
                        this.registerBaseVersion(targetObj, true, false);
                    }
                    else if (existing.status !== WorkingSetStatus.REGISTERED)
                    {
                        this.addChanges(targetObj, true, true)
                    }
                }
            }
        }
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
        const { _type, id, version } = domainObject;
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
                key,
                {
                    domainObject,
                    status: WorkingSetStatus.DELETED
                }
            );

            // bases.set(
            //     key,
            //     toJS(domainObject)
            // );
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

        this[secret].changes.delete(
            changeKey(_type, id)
        );
    }


    /**
     * Forgets all changes.
     */
    @action
    clear()
    {
        this[secret].changes.clear();
    }


    /**
     * Discards all changes by reverting the observables registered as changed back to their original state
     */
    @action
    discard()
    {
        const { mergePlan } = this[secret];
        const defaultDiscard = () => {

            const { changes, bases } = this[secret];

            for (let [key, entry] of changes)
            {
                const base = bases.get(key);

                const { _type: domainType } = base;

                const { status, domainObject } = entry;

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

            const { changes, bases } = this[secret];

            for (let i = 0; i < resolutions.length; i++)
            {
                const { type, id, fields, deleted, version } = resolutions[i];
                const { fields: conflictFields } = conflicts[i];

                const { domainObject } = changes.get(changeKey(type, id.value));

                const { versionField } = config.mergeOptions;

                const base = bases.get(changeKey(type, id.value));

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
                                    [rightSideRelation.leftSideObjectName]: association
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

                        for (let [key, entry] of changes)
                        {
                            if (entry.status === WorkingSetStatus.DELETED && entry.domainObject[leftSideRelation.sourceFields[0]] === id.value)
                            {
                                base.delete(key);
                            }
                        }

                    }
                    else
                    {
                        base[field.name] = conflictFields[j].theirs.value;
                    }
                }

                if (changeInBaseEmbbed)
                {
                    this.registerRelations(base);
                }

                if (changeInEmbbed)
                {
                    this.addRelationChanges(domainObject);
                }

                //console.log("AFTER APPLY", toJS( { bases, changes }, RECURSE_EVERYTHING))
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
     * Looks up the currently stored observable for a given entity
     *
     * @param type      entity type name
     * @param id        entity id
     *
     * @returns {{domainObject: object, status: String}} entry containing the registered observable and the current WorkingSetStatus
     */
    lookup(type, id)
    {
        return this[secret].changes.get(changeKey(type, id));
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

        if (id !== undefined)
        {
            type = entity;
            entityId = id;
        }
        else
        {
            type = entity._type;
            entityId = entity.id;
        }

        const key = changeKey(type, entityId);

        const { status, domainObject } = this[secret].changes.get(key)

        if (status === WorkingSetStatus.NEW)
        {
            return true;
        }

        if (status !== WorkingSetStatus.MODIFIED)
        {
            return false;
        }

        const {changes: changesMap, bases, mergePlan} = this[secret];

        return hasFieldChanges(status, domainObject, bases, mergePlan) || hasManyToManyChanges(type, entityId, changesMap, mergePlan);
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

        return this[secret].bases.get(changeKey(type, id));
    }


    /**
     *  Returns the array of changed domain objects except for the deletions
     *
     * @returns {Array<Object>} array with new or modified objects
     */
    @computed
    get changes()
    {
        return [...this[secret].changes.values()]
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
        return [...this[secret].changes.values()]
            .filter(entry => entry.status === WorkingSetStatus.DELETED)
            .map(mapEntryToDomainObject);
    }


    get hasChanges()
    {
        return this[secret].changes.size > 0;
    }


    /**
     * Merges the current changes contained in the working set using the merge functionality and resets the working set.
     *
     * @returns {Promise<*>} Promise resolving with the merge-result
     */
    @action
    merge(attempt = 1)
    {
        const {changes: changesMap, bases, mergePlan} = this[secret];

        this._updateRelationChanges();

        if (typeof mergePlan.mergeConfig.beforeMerge === "function")
        {
            if (mergePlan.mergeConfig.beforeMerge(this, attempt) === false)
            {
                return Promise.resolve(OPERATION_CANCEL);
            }
        }

        let changes = getFieldChanges(changesMap, bases, mergePlan);

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

        const changesAndDeletions = [
            ...changes,
            ...deletions
        ];

        // second pass to add changes for many-to-many relations
        changes = changes.concat(getManyToManyChanges(changesAndDeletions, changesMap, mergePlan));

        const vars = {
            mergeConfig: mergePlan.mergeConfig,
            changes: changes.filter(c => c.changes.length > 0),
            deletions
        };

        //console.log("MERGE", { vars: toJS(vars, RECURSE_EVERYTHING), bases, associations } );

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
                    prepareMergeConflicts(mergePlan, result, changesMap);

                    if (mergePlan.mergeConfig.logMergeScenarios)
                    {
                        console.log("STARTING MERGE: scenario = ", toJS(
                            {
                                conflicts: convertConflicts(result.conflicts, false),
                                workingSet: this.toJS()
                            }, RECURSE_EVERYTHING
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
                                return this.merge(attempt + 1);
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


    _updateRelationChanges()
    {
        const {changes: changesMap} = this[secret];

        for (let entry of changesMap.values())
        {
            const {domainObject, status} = entry;

            if (status === WorkingSetStatus.DELETED || status === WorkingSetStatus.REGISTERED)
            {
                continue;
            }

            this.addRelationChanges(domainObject);
        }

    }

}

