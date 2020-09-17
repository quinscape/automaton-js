import React, { useEffect, useReducer, useRef, useState } from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import { Field, GlobalConfig, FieldMode, Addon } from "domainql-form";
import BigNumber from "bignumber.js";


function getDigitIndex(selectionInDigits, value)
{
    let index;
    for (index = 0; selectionInDigits > 0 && index < value.length; index++)
    {
        const c = value[index];
        const isNumber = c >= "0" && c <= "9";
        if (isNumber)
        {
            selectionInDigits--;
        }
    }
    return index;
}


function getSelectionInDigits(selectionStart, value)
{
    const length = selectionStart;
    for (let i = 0; i < length; i++)
    {
        const c = value[i];
        const isNumber = c >= "0" && c <= "9";
        if (!isNumber)
        {
            selectionStart--;
        }
    }
    return selectionStart;
}


const DecimalField = ({precision, scale, children, ...restProps}) => {

    const ref = useRef(null);

    const [sel, setSel] = useState(-1);

    const handleDecimalSeparator = ev => {
        const { decimalSeparator } = BigNumber.config().FORMAT;
        if (ev.key === decimalSeparator){

            const {selectionStart, value } = ref.current;
            const pos = value.indexOf(decimalSeparator);
            if (pos >= 0)
            {
                if (selectionStart === pos)
                {
                    //console.log("Correct separator")
                    ref.current.setSelectionRange(pos + 1, pos + 1);
                }
                ev.preventDefault();
            }
        }
    };

    const addons = Addon.filterAddons( children );


    return (
        <span
            onKeyDownCapture={ handleDecimalSeparator }
        >
        <Field
            ref={ref}
            onChange={(/*newFieldContext, value*/) => {


                const {selectionStart, value} = ref.current;

                const selectionInDigits = getSelectionInDigits(selectionStart, value)

                //console.log("SET", selectionInDigits)

                setSel(selectionInDigits)
            }}
            {...restProps}
            addons={ addons }
        >
            {
                (formConfig, fieldContext) => {

                    useEffect(() => {

                        if (sel >= 0)
                        {
                            const errors = formConfig.getErrors(fieldContext.qualifiedName);
                            if (!errors.length)
                            {
                                const value = Field.getValue(formConfig, fieldContext, errors);

                                const index = getDigitIndex(sel, value);
                                ref.current.setSelectionRange(index, index);
                            }
                        }
                    })

                    const renderFn = GlobalConfig.getRenderFn(formConfig, fieldContext);
                    return renderFn(formConfig, fieldContext);
                }
            }
        </Field>
    </span>
    );
};

DecimalField.propTypes = {
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
    addons: PropTypes.array,

    /**
     * Numerical precision for big decimal fields. (e.g. 123.45 has a scale of 5)
     */
    precision: PropTypes.number,

    /**
     * Numerical scale / number of fractional digits for big decimal fields
     */
    scale: PropTypes.number
}

export default DecimalField;
