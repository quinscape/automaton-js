import React, { useEffect, useReducer, useRef, useState } from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import { Field, GlobalConfig, FieldMode, Addon } from "domainql-form";
import BigNumber from "bignumber.js";


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


const DecimalField = ({precision, scale, padToScale, children, ...restProps}) => {

    const ref = useRef(null);

    const [sel, setSel] = useState(-1);

    /**
     * Special case handling for usability edge cases
     */
    const onKeyDown = ev => {
        const { decimalSeparator, groupSeparator } = BigNumber.config().FORMAT;

        //console.log("handleDecimalSeparator", ev.key);

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

    const [isEditMode, setEditMode] = useState(false);

    return (
        <span
            onKeyDownCapture={ onKeyDown }
        >
        <Field
            ref={ref}
            fieldContext={ ctx => {
                if (precision != null)
                {
                    ctx.precision = precision;
                }
                if (scale != null)
                {
                    ctx.scale = scale;
                }
                ctx.padToScale = padToScale;
            }}
            onChange={(/*newFieldContext, value*/) => {


                const {selectionStart, value} = ref.current;

                const selectionInDigits = getSelectionInDigits(selectionStart, value)

                //console.log("SET", selectionInDigits)

                setSel(selectionInDigits)
            }}
            {...restProps}
            addons={ addons }
            onBlur={(formConfig, fieldContext, value) => {
                // console.log("DECIMAL FIELD BLUR");
                setEditMode(false);
            }}
            onFocus={(formConfig, fieldContext) => {
                // console.log("DECIMAL FIELD FOCUS");
                setEditMode(true);
            }}
            isEditMode={ isEditMode }
        >
            {
                (formConfig, fieldContext) => {
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
     * Optional local on-change handler ( ({oldValue, fieldContext}, value) => ... )
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
    scale: PropTypes.number,

    /**
     * Fill fractional digits until scale / number of fractional digits is reached
     */
    padToScale: PropTypes.bool
}

export default DecimalField;
