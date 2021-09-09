import React, { useMemo, useState } from "react"
import cx from "classnames"
import { ButtonToolbar, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import { Addon, Field, Form, FormLayout, GlobalConfig, Icon } from "domainql-form"
import i18n from "../i18n";
import config from "../config";
import { useLocalObservable, Observer } from "mobx-react-lite";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import equalsScalar from "../util/equalsScalar";
import { findNamed, isListType, unwrapAll } from "../util/type-utils";
import { OBJECT } from "domainql-form/lib/kind";
import renderEntity from "../util/renderEntity";
import CalendarField from "./CalendarField";
import { MergeOperation } from "../merge/MergeOperation";

export const RECURSE_EVERYTHING = { recurseEverything: true };

export const FieldStatus = {
    UNDECIDED: "UNDECIDED",
    OURS: "OURS",
    THEIRS: "THEIRS",
    VALUE: "VALUE"
};


export const OPERATION_CANCEL = {
    operation: MergeOperation.CANCEL,
    resolutions: []
};

const OPERATION_DISCARD = {
    operation: MergeOperation.DISCARD,
    resolutions: []
};


const infos = new Map();

function getInfoMap(type)
{
    const info = infos.get(type);
    if (!info)
    {
        const newInfo = createInfoMap(type);
        infos.set(type, newInfo)
        return newInfo;
    }
    return info;
}

export const FieldType = {
    /**
     * Normal input field
     */
    FIELD: "FIELD",
    /**
     * Embedded object for a foreign key
     */
    FK_OBJECT: "FK_OBJECT",
    /**
     * Embedded list of objects for a m-to-n relation
     */
    MANY_TO_MANY: "MANY_TO_MANY",

    /**
     * Foreign key raw key id field
     */
    FK_KEY: "FK_KEY",

    /**
     * Ignored field
     */
    IGNORE: "IGNORE"
}


function createInfoMap(typeName)
{
    const { inputSchema } = config;

    const typeDef = inputSchema.getType(typeName);
    
    const { fields } = typeDef;

    const out = new Map();

    for (let i = 0; i < fields.length; i++)
    {
        const { name, type } = fields[i];

        if (isListType(type))
        {
            const leftSideRelation = inputSchema.getRelations().find( r => r.targetType === typeName && r.rightSideObjectName === name);
            if (!leftSideRelation)
            {
                throw new Error("Could not find left side relation for type '" + typeName +"' and object field '" + name + "'");
            }

            const rightSideRelation = inputSchema.getRelations().find( r => r.sourceType === leftSideRelation.sourceType && r.targetType !== leftSideRelation.targetType);
            if (rightSideRelation)
            {
                out.set(name, {
                        fieldType: FieldType.MANY_TO_MANY,
                        relation : rightSideRelation
                    }
                );
            }
            else
            {
                // ignore fields that are not part of a many to many relation
                out.set(
                    name,
                    {
                        fieldType : FieldType.IGNORE,
                        objectField: null
                    }
                );
            }
        }
        else
        {
            const unwrapped = unwrapAll(type);
            if (unwrapped.kind === OBJECT)
            {
                const relation = inputSchema.getRelations().find( r => r.sourceType === typeName && r.leftSideObjectName === name);

                if (!relation)
                {
                    throw new Error("Could not find relation for type '" + typeName +"' and object field '" + name + "'");
                }

                // mark the foreign key key field
                out.set(
                    relation.sourceFields[0],
                    {
                        fieldType : FieldType.FK_KEY,
                        objectField: name
                    }
                );

                out.set(
                    name,
                    {
                        fieldType: FieldType.FK_OBJECT,
                        relation
                    }
                );
            }
            else
            {
                // for normal fields we have to check whether an entry already exists or we would might overwrite the
                // the ignored foreign key fields with a string field
                if (!out.has(name))
                {
                    out.set(
                        name,
                        {
                            fieldType: FieldType.FIELD
                        }
                    );
                }
            }
        }
    }

    return out;
}

/**
 * Finds the change index from a focused elem. The parents of the element are visited until we find the <tr data-idx=""/>
 * parent. Otherwise we return -1 for "not found".
 *
 * @param elem          focused element
 * @returns {number}    change index
 */
function getRowIndex(elem)
{
    // there's at least a <td> between us an our <tr> ancestor, so we can start with the grandparent
    let current = elem.parentNode.parentNode;
    while (current)
    {
        if (current.tagName === "TR")
        {
            const { idx } = current.dataset;
            if (idx)
            {
                return +idx;
            }
        }
        current = current.parentNode;
    }
    return -1;
}


const statusIcons = {
    UNDECIDED: <Icon className="fa-bolt text-danger" aria-label={ i18n("Merge Conflict") }/>,
    OURS: <Icon className="fa-check text-success"  aria-label={ i18n("Use Our Value") }/>,
    THEIRS: <Icon className="fa-check text-success" aria-label={ i18n("Use Their Value") }/>,
    VALUE: <Icon className="fa-check text-success" aria-label={ i18n("Use New Value") }/>
};


export class MergeDialogState {
    @observable
    resolutions = [];

    @observable
    showInfo = !config.mergeOptions.allowAutoMerge;

    constructor(conflicts)
    {
        const newResolutions = conflicts.map(
            c => {

                const infoMap = getInfoMap(c.type);

                const resolution = {
                    type: c.type,
                    id: c.id,
                    fields: c.fields.map(
                        f => {

                            const { name, theirs: theirsScalar, status, informational } = f;
                            const { type } = theirsScalar;

                            const {fieldType, objectField } = infoMap.get(name);

                            const value = status === FieldStatus.THEIRS ? f.theirs && f.theirs.value : f.ours && f.ours.value;

                            if (fieldType === FieldType.FK_KEY)
                            {
                                return {
                                    name,
                                    fieldType,
                                    value: {
                                        type: type,
                                        value
                                    },
                                    objectField,
                                    status,
                                    informational
                                };
                            }
                            if (fieldType === FieldType.MANY_TO_MANY)
                            {
                                return {
                                    name,
                                    fieldType,
                                    value: {
                                        type: type,
                                        value
                                    },
                                    status,
                                    informational
                                }

                            }
                            if (fieldType === FieldType.FK_OBJECT)
                            {
                                return {
                                    name,
                                    fieldType,
                                    value: {
                                        type: type,
                                        value
                                    },
                                    status,
                                    informational
                                };
                            }


                            return {
                                name,
                                fieldType,
                                value: {
                                    type: type,
                                    value
                                },
                                status,
                                informational
                            };
                        }
                    ),
                    version: c.theirVersion
                };


                //console.log("INITIAL RESOLUTION", toJS({ resolution }, RECURSE_EVERYTHING))

                return resolution;
            }
        );

        this.resolutions = newResolutions;

        makeObservable(this)

    }


    @computed
    get allResolved()
    {
        //console.log("Run MergeDialogState.allResolved")

        const {resolutions} = this;

        for (let i = 0; i < resolutions.length; i++)
        {
            const {fields} = resolutions[i];
            for (let j = 0; j < fields.length; j++)
            {
                const { fieldType, status } = fields[j];

                if (fieldType !== FieldType.IGNORE && fieldType !== FieldType.FK_KEY && status === FieldStatus.UNDECIDED)
                {
                    return false;
                }
            }
        }
        return true;
    }

    @computed
    get containsInformational()
    {
        const {resolutions} = this;

        for (let i = 0; i < resolutions.length; i++)
        {
            const {fields} = resolutions[i];
            for (let j = 0; j < fields.length; j++)
            {
                const { informational } = fields[j];

                if (informational)
                {
                    return true;
                }
            }
        }
        return false;
    }

    @action
    toggleInfo()
    {
        this.showInfo = !this.showInfo;
    }
}

const changeFieldValue = action("MergeDialog.changeFieldValue", (resolution, fieldIndex, value, status) => {

    const field = resolution.fields[fieldIndex];
    field.value.value = value;
    field.status = status;

    //console.log("CHANGED", {fieldIndex, value, status})
})

/**
 */
const updateFieldStatus = action("MergeDialog.updateFieldStatus", (resolution, conflict, focusedIndex) => {

    if (focusedIndex < 0)
    {
        //console.warn("NO FOCUS")
        return;
    }

    const {fields} = resolution;

    const field = fields[focusedIndex];
    const conflictField = conflict.fields[focusedIndex];

    const { type, value } = field.value;

    const equalsOurs = equalsScalar(
        type,
        value,
        conflictField.ours.value
    );
    const equalsTheirs = equalsScalar(
        type,
        value,
        conflictField.theirs.value
    );

    if ( field.status !== FieldStatus.VALUE && !equalsOurs && !equalsTheirs )
    {
        field.status = FieldStatus.VALUE;
    }

    if ( field.status !== FieldStatus.OURS && equalsOurs )
    {
        field.status = FieldStatus.OURS;
    }

    if ( field.status !== FieldStatus.THEIRS && equalsTheirs)
    {
        field.status = FieldStatus.THEIRS;
    }
});

function postProcess(result)
{
    const resolutions = toJS(result);
    //console.log("postProcess", resolutions);

    for (let i=0; i < resolutions.length; i++)
    {
        const resolution = resolutions[i];

        const { fields } = resolution;
        for (let j = 0; j < fields.length; j++)
        {
            const field = fields[j];
            if (field.fieldType === FieldType.FK_KEY)
            {
                const objectField = findNamed(fields, field.objectField);
                if (!objectField)
                {
                    throw new Error("Object field '" + field.objectField + "' not found.");
                }

                // update id field with selected value
                field.value.value = objectField.value.value.id;
                field.status = objectField.status;
                delete field.objectField
            }
        }
    }

    return resolutions;
}


/**

 */
const ChangeConflictDialog = ({dialog, conflicts, config, submitTimeOut = 300}) => {

    const mergeDialogState = useLocalObservable(
        () => new MergeDialogState(conflicts)
    );


    const [ current, setCurrent ] = useState(0);
    const [ focused, setFocused ] = useState(-1);

    const toggleDialog = () => dialog.confirm(OPERATION_CANCEL);


    const formOptions = useMemo(
        () => ({
            isolation: false,
            layout: FormLayout.INLINE,
            autoSubmit: true,
            submitTimeOut
        }),
        [ submitTimeOut ]
    )

    return (
        <Observer>
            {
                () => {
                    const { resolutions, allResolved, containsInformational, showInfo } = mergeDialogState;
                    const currentResolution = resolutions[current];
                    const { fields } = currentResolution;

                    return (
                        <Modal
                            isOpen={true}
                            toggle={toggleDialog}
                            size={dialog.opts.size}
                            fade={dialog.opts.fade}
                        >
                            <ModalHeader
                                toggle={toggleDialog}
                            >
                    <span className="badge badge-warning mr-1">
                        <Icon className="fa-code-branch"/>
                    </span>
                                {
                                    i18n("Change Conflict -- {0} ({1} of {2})", currentResolution.type, current + 1, conflicts.length)
                                }
                            </ModalHeader>
                            <ModalBody>
                                <Container fluid={true}>
                                    <div className="row">
                                        <div className="col">
                                            <Form
                                                key={currentResolution.id.value}
                                                value={currentResolution}
                                                options={
                                                    formOptions
                                                }
                                                onSubmit={formConfig => updateFieldStatus(formConfig.root, conflicts[current], focused)}
                                            >
                                                <table className="merge-table table table-hover table-sm"
                                                       onFocusCapture={ev => {
                                                           const idx = getRowIndex(ev.target);
                                                           if (idx !== -1 && idx !== focused)
                                                           {
                                                               setFocused(idx);
                                                           }
                                                       }}>
                                                    <thead>
                                                    <tr>
                                                        <th>
                                                            {
                                                                i18n("Merge:Status")
                                                            }
                                                        </th>
                                                        <th>
                                                            {
                                                                i18n("Merge:Field")
                                                            }
                                                        </th>
                                                        <th>
                                                            {
                                                                i18n("Merge:Value")
                                                            }
                                                        </th>
                                                        <th>
                                                            {
                                                                i18n("Merge:Their Value")
                                                            }
                                                        </th>
                                                        <th>
                                                            {
                                                                i18n("Merge:Action")
                                                            }
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {
                                                        fields
                                                            .map((f, idx) => {

                                                                const {name, status, fieldType} = f;

                                                                if (
                                                                    fieldType === FieldType.IGNORE ||
                                                                    fieldType === FieldType.FK_KEY ||
                                                                    (!mergeDialogState.showInfo && f.informational)
                                                                )
                                                                {
                                                                    return false;
                                                                }

                                                                const scalarType = f.value.type;

                                                                const useCalendar = scalarType === "Date" || scalarType === "Timestamp";

                                                                // we have to keep the `fields` and `conflicts` in sync, which is why we don't filter
                                                                const conflict = conflicts[current].fields[idx];

                                                                const fieldLabel = i18n(currentResolution.type + ":" + name);

                                                                return (
                                                                    <tr key={idx}
                                                                        className={cx(status === FieldStatus.UNDECIDED && "border border-danger")}
                                                                        data-idx={String(idx)}
                                                                    >
                                                                        <td>
                                                                            <p className="form-control-plaintext">
                                                                                {
                                                                                    statusIcons[status]
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="form-control-plaintext">
                                                                                {
                                                                                    fieldLabel
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                        <td>

                                                                            {
                                                                                fieldType === FieldType.FIELD && !useCalendar && (
                                                                                    <Field
                                                                                        label={fieldLabel}
                                                                                        labelClass="sr-only"
                                                                                        name={"fields." + idx + ".value.value"}
                                                                                        type={scalarType}
                                                                                    >
                                                                                        <Addon
                                                                                            placement={Addon.RIGHT}
                                                                                            text={true}
                                                                                        >
                                                                                            {
                                                                                                status === FieldStatus.VALUE &&
                                                                                                <Icon
                                                                                                    className="fa-check text-success"/>
                                                                                            }

                                                                                        </Addon>
                                                                                    </Field>
                                                                                )
                                                                            }
                                                                            {
                                                                                fieldType === FieldType.FIELD && useCalendar && (
                                                                                    <CalendarField
                                                                                        label={fieldLabel}
                                                                                        labelClass="sr-only"
                                                                                        name={"fields." + idx + ".value.value"}
                                                                                        type={scalarType}
                                                                                        addonClass={cx(status === FieldStatus.VALUE && "btn-success")}
                                                                                    >
                                                                                    </CalendarField>
                                                                                )
                                                                            }

                                                                            {
                                                                                fieldType === FieldType.FK_OBJECT && (
                                                                                    <p className="form-control-plaintext">
                                                                                        {
                                                                                            renderEntity(status !== FieldStatus.THEIRS ?
                                                                                                conflict.ours.value :
                                                                                                conflict.theirs.value, false)
                                                                                        }
                                                                                    </p>
                                                                                )
                                                                            }
                                                                            {
                                                                                fieldType === FieldType.MANY_TO_MANY && (
                                                                                    <ul className="list-unstyled">
                                                                                        {
                                                                                            (status !== FieldStatus.THEIRS ?
                                                                                                conflict.ours :
                                                                                                conflict.theirs).value.map(e => (
                                                                                                <li
                                                                                                    key={e.id}
                                                                                                    className="form-control-plaintext"
                                                                                                >
                                                                                                    {
                                                                                                        renderEntity(e, false)
                                                                                                    }
                                                                                                </li>
                                                                                            ))

                                                                                        }
                                                                                    </ul>
                                                                                )
                                                                            }

                                                                        </td>
                                                                        <td>
                                                                            {
                                                                                fieldType === FieldType.FIELD && (
                                                                                    <p className="form-control-plaintext">
                                                                                        {
                                                                                            GlobalConfig.renderStatic(conflict.theirs.type, conflict.theirs.value)
                                                                                        }
                                                                                    </p>
                                                                                )
                                                                            }
                                                                            {
                                                                                fieldType === FieldType.FK_OBJECT && (
                                                                                    <p className="form-control-plaintext">
                                                                                        {
                                                                                            renderEntity(conflict.theirs.value, false)
                                                                                        }
                                                                                    </p>

                                                                                )
                                                                            }
                                                                            {
                                                                                fieldType === FieldType.MANY_TO_MANY && (
                                                                                    <ul className="list-unstyled">
                                                                                        {
                                                                                            conflict.theirs.value.map(e => (
                                                                                                <li
                                                                                                    key={e.id}
                                                                                                    className="form-control-plaintext"
                                                                                                >
                                                                                                    {
                                                                                                        renderEntity(e, false)
                                                                                                    }
                                                                                                </li>
                                                                                            ))

                                                                                        }
                                                                                    </ul>
                                                                                )
                                                                            }
                                                                        </td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                title={i18n("Merge:Take our value")}
                                                                                className={
                                                                                    cx(
                                                                                        "btn mr-1",
                                                                                        status === FieldStatus.OURS ?
                                                                                            "btn-success" :
                                                                                            "btn-secondary",
                                                                                    )
                                                                                }
                                                                                disabled={status === FieldStatus.OURS}
                                                                                onClick={() => changeFieldValue(currentResolution, idx, conflict.ours.value, FieldStatus.OURS)}
                                                                            >
                                                                                {
                                                                                    status === FieldStatus.OURS &&
                                                                                    <Icon className="fa-check"/>
                                                                                }
                                                                                {
                                                                                    i18n("Merge:Ours")
                                                                                }
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className={
                                                                                    cx(
                                                                                        "btn mr-1",
                                                                                        status === FieldStatus.THEIRS ?
                                                                                            "btn-success" :
                                                                                            "btn-secondary",
                                                                                    )
                                                                                }
                                                                                title={
                                                                                    i18n("Merge:Take their value")
                                                                                }
                                                                                disabled={status === FieldStatus.THEIRS}
                                                                                onClick={() => changeFieldValue(currentResolution, idx, conflict.theirs.value, FieldStatus.THEIRS)}
                                                                            >
                                                                                {
                                                                                    status === FieldStatus.THEIRS &&
                                                                                    <Icon className="fa-check"/>
                                                                                }
                                                                                {
                                                                                    i18n("Merge:Theirs")
                                                                                }
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                    }

                                                    </tbody>
                                                </table>
                                            </Form>
                                            <ButtonToolbar>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary mr-1"
                                                    disabled={current === 0}
                                                    onClick={() => setCurrent(current - 1)}
                                                >
                                                    <Icon
                                                        className="fa-step-backward mr-1"
                                                    />
                                                    {
                                                        i18n("Merge:Previous")
                                                    }
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary mr-3"
                                                    disabled={current === resolutions.length - 1}
                                                    onClick={() => setCurrent(current + 1)}
                                                >
                                                    <Icon
                                                        className="fa-step-forward mr-1"
                                                    />
                                                    {
                                                        i18n("Merge:Next")
                                                    }
                                                </button>
                                                {
                                                    containsInformational && (
                                                        <form className="form-inline">
                                                            <div className="form-check mb-2 mr-sm-2">
                                                                <input
                                                                    id="cb-show-info"
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={showInfo}
                                                                    onChange={() => mergeDialogState.toggleInfo()}
                                                                />
                                                                <label className="form-check-label"
                                                                       htmlFor="cb-show-info">
                                                                    {
                                                                        i18n("Show Informational")
                                                                    }
                                                                </label>
                                                            </div>
                                                        </form>
                                                    )
                                                }

                                            </ButtonToolbar>
                                            <hr/>
                                            <ButtonToolbar>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary mr-1 float-right"
                                                    onClick={() => dialog.confirm(OPERATION_CANCEL)}
                                                >
                                                    <Icon
                                                        className="fa-times mr-1"
                                                    />
                                                    {
                                                        i18n("Cancel")
                                                    }
                                                </button>
                                                {
                                                    config.allowDiscard && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger mr-1"
                                                            onClick={
                                                                () => {
                                                                    if (confirm(i18n("Discard Working Set?")))
                                                                    {
                                                                        dialog.confirm(OPERATION_DISCARD)
                                                                    }
                                                                }
                                                            }
                                                        >
                                                            <Icon
                                                                className="fa-trash-alt mr-1"
                                                            />
                                                            {
                                                                i18n("Merge:Discard")
                                                            }
                                                        </button>
                                                    )
                                                }
                                                {
                                                    config.allowApply && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary mr-1"
                                                            disabled={!allResolved}
                                                            onClick={() => dialog.confirm({
                                                                operation: MergeOperation.APPLY,
                                                                resolutions: postProcess(resolutions)
                                                            })}
                                                        >
                                                            {
                                                                i18n("Merge:Apply")
                                                            }
                                                        </button>
                                                    )
                                                }
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mr-1"
                                                    disabled={!allResolved}
                                                    onClick={() => dialog.confirm({
                                                        operation: MergeOperation.STORE,
                                                        resolutions: postProcess(resolutions)
                                                    })}
                                                >
                                                    <Icon
                                                        className="fa-save mr-1"
                                                    />
                                                    {
                                                        i18n("Merge:Merge")
                                                    }
                                                </button>
                                            </ButtonToolbar>
                                        </div>
                                    </div>
                                </Container>
                            </ModalBody>
                        </Modal>
                    );
                }
            }
        </Observer>
    );
};

export default ChangeConflictDialog;
