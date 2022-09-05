import React, { useState, useCallback } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import get from "lodash.get"
import { Field, FormGroup, unwrapType, FieldMode, Icon, Addon, GlobalConfig, renderStaticField } from "domainql-form"
import config from "../../../config";
import i18n from "../../../i18n";
import DateRangeModal from "./DateRangeModal";
import { DateTime } from "luxon";


function toggleValue(open)
{
    return !open;
}

const DateRangeField = props => {

    const {
        minDate,
        maxDate,
        addonClass = "btn-light",
        autoFocus,
        children,
        dateFormat = config.dateFormat,
        timestampFormat = config.timestampFormat,
        ... fieldProps
    } = props;

    const [ isOpen, setOpen] = useState(false);

    const toggle = useCallback(
        () => setOpen(toggleValue),
        []
    );

    return (
        <Field
            {... fieldProps}
            fieldContext={ ctx => {
                ctx.dateFormat = dateFormat;
                ctx.timestampFormat = timestampFormat;
            }}
            addons={ Addon.filterAddons(children)}
        >
            {

                (formConfig, ctx) => {

                    const { fieldType, mode, fieldId, inputClass, tooltip, path, qualifiedName, placeholder, addons } = ctx;

                    const errorMessages = formConfig.getErrors(qualifiedName);
                    const scalarType = unwrapType(fieldType).name;

                    const timestamps = get(formConfig.root, path);

                    const fieldValue = Field.getValue(formConfig, ctx, errorMessages);

                    const buttonTitle = i18n("Open calendar");

                    let fieldElement;

                    if (mode === FieldMode.PLAIN_TEXT)
                    {
                        // we don't use renderStaticField to have the correct timestamp/date formatting
                        fieldElement = (
                            <span
                                id={ fieldId }
                                data-name={ qualifiedName }
                                className={
                                    cx(
                                        inputClass,
                                        "form-control-plaintext"
                                    )
                                }
                            >
                                {
                                    fieldValue || GlobalConfig.none()
                                }
                            </span>
                        );
                    }
                    else
                    {
                        let placeholderAttribute;
                        if (!(mode === FieldMode.READ_ONLY || mode === FieldMode.DISABLED)) {
                            placeholderAttribute = placeholder || i18n("Date Format {0}", dateFormat);
                        }

                        fieldElement = Addon.renderWithAddons(
                            <input
                                id={fieldId}
                                name={qualifiedName}
                                className={
                                    cx(
                                        inputClass,
                                        "form-control",
                                        errorMessages.length > 0 && "is-invalid"
                                    )
                                }
                                type="text"
                                placeholder={placeholderAttribute}
                                disabled={mode === FieldMode.DISABLED}
                                title={tooltip}
                                readOnly={mode === FieldMode.READ_ONLY}
                                value={fieldValue}
                                onKeyPress={ ctx.handleKeyPress }
                                onChange={ctx.handleChange}
                                onBlur={ctx.handleBlur}
                                autoFocus={autoFocus ? true : null}
                            />,
                            addons.concat(
                                <Addon placement={ Addon.RIGHT }>
                                    <button
                                        className={ cx("btn", addonClass) }
                                        type="button"
                                        title={ buttonTitle }
                                        disabled={ mode !== FieldMode.NORMAL }
                                        aria-roledescription={ buttonTitle }
                                        onClick={ () => setOpen(true) }
                                    >
                                        <Icon className="fa-calendar-check"/>
                                    </button>
                                </Addon>
                            )
                        );
                    }

                    return (
                        <FormGroup
                            { ... ctx }
                            formConfig={ formConfig }
                            errorMessages={ errorMessages }
                        >
                            {
                                fieldElement
                            }
                            <DateRangeModal
                                ctx={ ctx }
                                formConfig={ formConfig }
                                isOpen={ isOpen }
                                toggle={ toggle }
                                name={ qualifiedName }
                                values={ timestamps }
                                scalarType={ scalarType }
                                minDate={ minDate }
                                maxDate={ maxDate }
                            />
                        </FormGroup>
                    );
                }
            }
        </Field>
    );

};

DateRangeField.propTypes = {
    /**
     * Minimum date the user can select
     */
    minDate: PropTypes.instanceOf(DateTime),
    /**
     * Maximum date the user can select
     */
    maxDate: PropTypes.instanceOf(DateTime),

    // FIELD PROP TYPES

    /**
     * Name / path for the  calendar field value (e.g. "name", but also "foos.0.name")
     */
    name: PropTypes.string.isRequired,

    /**
     * Mode for this calendar field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
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
     * Placeholder text to render for text inputs.
     */
    placeholder: PropTypes.string,

    /**
     * Additional HTML classes for the input element.
     */
    inputClass: PropTypes.string,

    /**
     * Additional HTML classes for the label element.
     */
    labelClass: PropTypes.string,

    /**
     * Additional HTML classes for the form group element.
     */
    formGroupClass: PropTypes.string,

    /**
     * Additional HTML classes for the calendar button addon
     */
    addonClass: PropTypes.string,

    /**
     * Date format string to use for "Date" typed fields.
     */
    dateFormat: PropTypes.string,

    /**
     * Pass-through autoFocus attribute for the Calendar input field
     */
    autoFocus: PropTypes.bool,

    /**
     * Date format string to use for "Timestamp" typed fields.
     */
    timestampFormat: PropTypes.string,

    /**
     * Optional local on-change handler ( ({oldValue, fieldContext}, value) => ... )
     */
    onChange: PropTypes.func

};

export default DateRangeField;
