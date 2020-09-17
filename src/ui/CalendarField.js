import React, { useState, useCallback } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import get from "lodash.get"
import { Field, FormGroup, InputSchema, unwrapType, FieldMode, Icon, Addon } from "domainql-form"
import i18n from "../i18n";
import CalendarModal from "./CalendarModal";


function toggleValue(open)
{
    return !open;
}

const CalendarField = props => {

    const { minDate, maxDate, addonClass = "btn-outline-secondary", children, ... fieldProps} = props;

    const [ isOpen, setOpen] = useState(false);

    const toggle = useCallback(
        () => setOpen(toggleValue),
        []
    );


    return (
        <Field
            {... fieldProps}
            addons={ Addon.filterAddons(children)}
        >
            {

                (formConfig, ctx) => {

                    const { fieldType, mode, fieldId, inputClass, tooltip, path, qualifiedName, placeholder, addons } = ctx;

                    const errorMessages = formConfig.getErrors(qualifiedName);
                    const scalarType = unwrapType(fieldType).name;

                    const timestamp = get(formConfig.root, path);

                    const fieldValue = Field.getValue(formConfig, ctx, errorMessages);

                    //console.log("checkbox value = ", fieldValue);

                    // if the mode is DISABLED, we keep that, otherwise we set it to READ_ONLY for the input
                    const inputMode = mode !== FieldMode.DISABLED ? FieldMode.READ_ONLY : FieldMode.DISABLED;

                    const buttonTitle = i18n("Open calendar");

                    const fieldElement = (
                        <input
                            id={ fieldId }
                            name={ qualifiedName }
                            className={
                                cx(
                                    inputClass,
                                    "form-control"
                                )
                            }
                            type="text"
                            placeholder={ placeholder }
                            disabled={ inputMode === FieldMode.DISABLED }
                            title={ tooltip }
                            readOnly={ inputMode === FieldMode.READ_ONLY }
                            value={ fieldValue }
                        />
                    );

                    return (
                        <FormGroup
                            { ... ctx }
                            formConfig={ formConfig }
                            errorMessages={ errorMessages }
                        >
                            {
                                Addon.renderWithAddons(fieldElement, addons.concat(
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
                                ))
                            }
                            <CalendarModal
                                ctx={ ctx }
                                formConfig={ formConfig }
                                isOpen={ isOpen }
                                toggle={ toggle }
                                name={ qualifiedName }
                                value={ timestamp }
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

CalendarField.propTypes = {
    /**
     * Minimum date the user can select
     */
    minDate: PropTypes.instanceOf(Date),
    /**
     * Maximum date the user can select
     */
    maxDate: PropTypes.instanceOf(Date),

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
     * Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
     */
    helpText: PropTypes.string,
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
    addonClass: PropTypes.string

};

export default CalendarField;
