import React, { useMemo, useRef, useState } from "react"
import cx from "classnames"
import PropTypes from "prop-types"

import {
    Addon,
    Field,
    FieldMode,
    FormGroup,
    Icon,
    renderStaticField
} from "domainql-form";

import config from "../config";
import uri from "../uri";
import get from "lodash.get"
import set from "lodash.set"
import toPath from "lodash.topath"
import { action } from "mobx";
import Attachments from "../Attachments";
import { v4 } from "uuid";
import i18n from "../i18n";
import AttachmentLink from "./AttachmentLink";


const setAttachment = action(
    "AttachmentField.setAttachment",
    (root, path, attachmentPath, attachment) => {

        console.log("setAttachment", path, attachmentPath, attachment)

        set(root, path, attachment ? attachment.id : null);
        set(root, attachmentPath, attachment);

    });


const removeAttachment = action(
    "AttachmentField.removeAttachment",
    (root, path, attachmentPath) => {

        console.log("removeAttachment", path, attachmentPath)
        set(root, path, null);
        set(root, attachmentPath, null);

    });

/**
 * Attachment form field allowing the user to upload attachments and remove attachments.
 *
 * Storage of the attachments has to be done with the Attachments API.
 */
const AttachmentField = React.forwardRef(
    ({ deleteRemoved = true, children, ... fieldProps}, ref) => {

        const [ original, setOriginal ] = useState(false);
        const [ isNew, setIsNew ] = useState(null);

        const { name } = fieldProps;

        const attachmentPath = useMemo(
            () => {

                const relations = config.inputSchema.getRelations().filter(r => r.targetType === "AppAttachment" && r.sourceFields[0] === name );
                if (!relations.length)
                {
                    throw new Error("Could not find attachment relation using '" + name + "' as source field");
                }

                const attachmentRelation = relations[0];
                if (!attachmentRelation.leftSideObjectName)
                {
                    throw new Error("No attachment object field in '" + attachmentRelation.sourceType + "");
                }

                const attachmentPath = [ ... toPath(name)];
                attachmentPath[attachmentPath.length - 1] = attachmentRelation.leftSideObjectName;
                return attachmentPath;
            },
            [ name ]
        )

        const fileInputRef = useRef(null);

        return (
            <Field
                { ...fieldProps }
                addons={ Addon.filterAddons(children) }
            >
                {
                    (formConfig, fieldContext) => {

                        const { fieldId, tooltip, mode, qualifiedName, path } = fieldContext;

                        const errorMessages = formConfig.getErrors(qualifiedName);

                        // The id of the attachment is our field value
                        const attachmentId = Field.getValue(formConfig, fieldContext, errorMessages);

                        const isPlainText = mode === FieldMode.PLAIN_TEXT;

                        const attachment = get(formConfig.root, attachmentPath);

                        const chooseFile = (ev) => {
                            const inputEl = (ref || fileInputRef).current;
                            if (inputEl != null) {
                                inputEl.click();
                            }
                        }

                        const handleFileChange = ev => {

                            if (original === false)
                            {
                                        setOriginal(attachment);
                                    }

                            const { files } = ( ref || fileInputRef).current;

                            if (files.length)
                            {
                                    // if we already had uploaded a new file
                                if (isNew)
                                {
                                        // cancel that
                                        Attachments.clearActionsFor(formConfig.root, attachmentId);
                                    }

                                const file = files[0];
                                    const newAttachment = {
                                        id: v4(),
                                        type: file.type,
                                        description: file.name,
                                        url: null
                                    };
                                    setAttachment(formConfig.root, path, attachmentPath,newAttachment);
                                    Attachments.markAttachmentAsNew(formConfig.root, newAttachment, file);
                                    setIsNew(true);
                                    formConfig.handleChange(fieldContext, newAttachment?.id ?? "");
                                }
                        };

                        const removeCurrent = () => {

                            if (original === false)
                            {
                                setOriginal(attachment);
                            }

                            removeAttachment(formConfig.root, path, attachmentPath);
                            if (deleteRemoved)
                            {
                                Attachments.markAttachmentDeleted(formConfig.root, attachmentId);
                            }
                            formConfig.handleChange(fieldContext, "");
                        };

                        const resetField = () => {
                            const elem = (ref || fileInputRef).current;

                            if (attachmentId)
                            {
                                Attachments.clearActionsFor(formConfig.root, attachmentId);
                            }

                            if (original)
                            {
                                Attachments.clearActionsFor(formConfig.root, original.id);
                            }
                            setAttachment(formConfig.root, path, attachmentPath, original);

                            elem.value = null;

                            setIsNew(false);
                            setOriginal(false);
                            formConfig.handleChange(fieldContext, original?.id ?? "");
                        };


                        let fieldElem;
                        if (isPlainText)
                        {
                            fieldElem = (
                                <span
                                    id={ fieldId }
                                    data-name={ qualifiedName }
                                    className="form-control-plaintext"
                                >
                                    <AttachmentLink
                                        className="text-left form-control text-truncate"
                                        attachment={ attachment }
                                    />
                                </span>
                            );
                        }
                        else
                        {
                            fieldElem =(
                                Addon.renderWithAddons(
                                    <AttachmentLink
                                        className="border text-left form-control text-truncate"
                                        attachment={ attachment }
                                        disabled={ isNew }
                                    />,
                                    [
                                        ... fieldContext.addons,
                                        <Addon placement={ Addon.RIGHT }>
                                            {
                                                attachment && !isNew ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-light border"
                                                        disabled={ mode !== FieldMode.NORMAL }
                                                        title={ i18n("Remove attachment") }
                                                        onClick={ removeCurrent }
                                                    >
                                                        <Icon className="fa-eraser text-danger mr-1"/>
                                                        {
                                                            i18n("Remove")
                                                        }
                                                    </button>
                                                ) : false
                                            }
                                        </Addon>,
                                        <Addon placement={ Addon.RIGHT }>
                                            {
                                                original !== false ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-light border"
                                                        disabled={ mode !== FieldMode.NORMAL }
                                                        title={ i18n("Reset Attachment Field") }
                                                        onClick={ resetField }
                                                    >
                                                        <Icon className="fa-times mr-1"/>
                                                        {
                                                            i18n("Reset")
                                                        }
                                                    </button>
                                                ) : false
                                            }
                                        </Addon>,
                                        <Addon placement={ Addon.RIGHT }>
                                            <button
                                                id={ fieldId }
                                                name={ qualifiedName }
                                                type="button"
                                                className="btn btn-light border"
                                                disabled={ mode !== FieldMode.NORMAL }
                                                title={ i18n("Upload attachment") }
                                                onClick={ chooseFile }
                                            >
                                                <Icon className="fa-file-import mr-1"/>
                                                {
                                                    i18n("Choose file")
                                                }
                                            </button>
                                    </Addon>
                                    ]
                                )
                            );
                        }
                        return (
                            <FormGroup
                                { ...fieldContext }
                                formConfig={ formConfig }
                                errorMessages={ errorMessages }
                            >
                                {
                                    fieldElem
                                }
                                <input
                                    ref={ ref || fileInputRef }
                                    type="file"
                                    onChange={ handleFileChange }
                                    style={{display: 'none'}}
                                />
                            </FormGroup>
                        )
                    }
                }
            </Field>
        );
    }
);

AttachmentField.propTypes = {
    /**
     * Name / path for this field (e.g. "name", but also "foos.0.name")
     */
    name: PropTypes.string.isRequired,

    /**
     * If true, delete removed attachments from the database, otherwise just de-reference them. (default is true)
     */
    deleteRemoved: PropTypes.bool,

    /**
     * Mode for this field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
     */
    mode: PropTypes.oneOf(FieldMode.values()),
    /**
     * Additional help text for this field. Is rendered for non-erroneous fields in place of the error. If a function
     * is given, it should be a stable reference ( e.g. with useCallback()) to prevent creating the field context over
     * and over. The same considerations apply to using elements. ( The expression <Bla/> recreates that element on every
     * invocation, use static element references)
     */
    helpText: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.element]),
    /**
     * Tooltip / title attribute for the input element
     */
    tooltip: PropTypes.string,
    /**
     * Label for the field.
     */
    label: PropTypes.string,

    /**
     * Additional HTML classes for the label element.
     */
    labelClass: PropTypes.string,

    /**
     * Additional HTML classes for the form group element.
     */
    formGroupClass: PropTypes.string,

    /**
     * Array of addons as props instead of as children. Only useful if you're writing a component wrapping Field and want
     * to render your addons as field addons while using the render function form.
     */
    addons: PropTypes.array,

    /**
     * Optional local on-change handler ( ({oldValue, fieldContext}, value) => ... )
     */
    onChange: PropTypes.func

}

export default AttachmentField;
