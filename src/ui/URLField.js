import React from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import { Field, FieldMode, GlobalConfig, FormGroup, Addon, Icon } from "domainql-form";

const LINK_RE = /\/\//

const URLField = (props) => {

    return (
        <Field
            {... props}
            addons={ Addon.filterAddons(props.children) }
        >
            {
                (formConfig, fieldContext) => {

                    const { fieldId, mode, qualifiedName, addons } = fieldContext;


                    const errorMessages = formConfig.getErrors(qualifiedName)
                    const value = Field.getValue(formConfig, fieldContext, errorMessages);

                    if (mode === FieldMode.PLAIN_TEXT)
                    {
                        return (
                            <FormGroup
                                { ... fieldContext}
                                formConfig={ formConfig }
                                errorMessages={ errorMessages }
                            >
                                <p
                                   id={fieldId}
                                   data-name={qualifiedName}
                                   className="form-control-plaintext"
                                >
                                {
                                    Addon.renderWithAddons(
                                        value ? (
                                            <a
                                                href={ value }
                                                target="_blank" rel="noopener noreferrer"
                                            >
                                                { value }
                                            </a>
                                        ) : GlobalConfig.none(),
                                        addons
                                    )
                                }
                                </p>

                            </FormGroup>
                        )
                    }

                    const renderFn = GlobalConfig.getRenderFn(formConfig, fieldContext);

                    const haveLink = value && LINK_RE.test(value);

                    const newCtx = {
                        ... fieldContext,
                        addons: [
                            ... fieldContext.addons,
                            <Addon placement={ Addon.LEFT }>
                                {
                                    React.createElement(
                                        haveLink ? "a" : "span",
                                        {
                                            className: cx("btn btn-light border", !haveLink && "disabled"),
                                            href: value,
                                            target: "_blank",
                                            rel: "noopener noreferrer"
                                        },
                                        <Icon className="fa-link"/>
                                    )
                                }
                            </Addon>
                        ]
                    }

                    return renderFn(formConfig, newCtx);
                }
            }
        </Field>
    );
};

URLField.propTypes = {
    /**
     * Name / path for this field (e.g. "name", but also "foos.0.name")
     */
    name: PropTypes.string.isRequired,
    /**
     * Mode for this field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
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
     * Optional change handler to use
     */
    onChange: PropTypes.func,

    /**
     * Optional blur handler to use
     */
    onBlur: PropTypes.func,

    /**
     * Pass-through autoFocus attribute for text inputs
     */
    autoFocus: PropTypes.bool,

    /**
     * Array of addons as props instead of as children. Only useful if you're writing a component wrapping Field and want
     * to render your addons as field addons while using the render function form.
     */
    addons: PropTypes.array
}

export default URLField;
