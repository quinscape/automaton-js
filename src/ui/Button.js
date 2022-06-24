import React from "react"
import PropTypes from "prop-types"
import { useFormConfig } from "domainql-form"

import { observer as fnObserver } from "mobx-react-lite"
import useAutomatonEnv from "../useAutomatonEnv";
import hasText from "../util/hasText";


function getTextFromChildren(children)
{
    let text = "";
    React.Children.forEach(children, kid => {

        if (typeof kid === "string")
        {
            text += kid;
        }
    });
    return text;
}


const Button = props => {

    const formConfig = useFormConfig();
    const env = useAutomatonEnv();

    const {
        className,
        name,
        text,
        transition,
        disabled,
        tooltip,
        formContext = formConfig.formContext,
        type="button",
        children
    } = props;
    /**
     * Returns either the explicit context set as prop or the current form object model if present.
     *
     * @return {*} context
     */
    const getContext = () =>
    {
        const { context : contextFromProps } = props;
        // if no explicit context is set, use original form root (might be null)
        return contextFromProps !== undefined ? contextFromProps : formConfig.root;
    };

    const onClick = ev => {
        const entry = transition && env.process.getTransition(transition);
        return ( !entry || !entry.discard ? formConfig.formContext.waitForAsyncValidation() : Promise.resolve()).then(
            () => {
                const { action } = props;
                //console.log("BUTTON-CLICK", { action, transition, context, env })

                if (typeof action !== "function")
                {
                    if (!entry)
                    {
                        throw new Error("No transition '" + transition + "' in " + env.process.name + " / " + env.process.currentState.name)
                    }

                    if (!entry.discard)
                    {
                        if (formConfig.ctx)
                        {
                            formConfig.ctx.submit();
                            return formConfig.formContext.waitForAsyncValidation()
                        }
                        else
                        {
                            return formConfig.formContext.revalidate();
                        }
                    }
                }

            })
            .then(
                () => {

                    if (!isDisabled(formConfig))
                    {
                        const { action } = props;
                        //console.log("BUTTON-CLICK", { action, transition, context, env })

                        if (typeof action === "function")
                        {
                            action(getContext())
                        }
                        else
                        {
                            try
                            {
                                const { process } = env;

                                //console.log("TRANSITION", transition, process);
                                // it's important to take context *after* we submit or reset it above
                                process.transition(transition, getContext(), name)
                            }
                            catch(e)
                            {
                                console.error(e);
                            }
                        }
                    }
                }
            )

    };

    const isDisabled = () =>
    {

        let isDisabled = false;

        if (typeof disabled === "function")
        {
            isDisabled = disabled(formConfig);
        }

        // if the `transition` prop is defined ..
        if (!isDisabled && transition)
        {
            const entry = env.process.getTransition(transition);
            if (!entry)
            {
                throw new Error("No transition '" + transition + "' in " + env.process.name + " / " + env.process.currentState)
            }

            // .. and we're not discarding and we have errors, then disable button
            isDisabled = !entry.discard && (formConfig.hasErrors() || (formConfig.ctx && !formConfig.root));
        }

        return isDisabled;
    };


    if (__DEV)
    {
        const textFromKids = getTextFromChildren(children);
        if (!hasText(text) && !hasText(textFromKids))
        {
            // hard error might seem a little harsh, but it gives the best error description
            // in terms of locating the offending button component
            throw new Error("<Button/> is missing a textual description. Set the text prop to a meaningful text.");
        }
    }

    return (
        <button
            type={ type }
            name={ name }
            className={ className }
            disabled={ isDisabled() }
            title={ tooltip }
            aria-label={ text || null }
            onClick={ onClick }
        >
            {
                children
            }
        </button>
    )
};

Button.propTypes = {
    /**
     * Transition reference. button must have either a `transition` or an `action` attribute.
     */
    transition: PropTypes.string,
    /**
     * Additional button classes
     */
    className: PropTypes.string,
    /**
     * Text for the button
     */
    text: PropTypes.string,
    /**
     * Text for the button
     */
    tooltip: PropTypes.string,
    /**
     * Additional function to check for disabled status. The default behavior is to disable the button if the button has
     * a transition which is not discarding and there are form errors.
     *
     * This check runs before that and can disable the button in any case.
     */
    disabled: PropTypes.func,
    /**
     * Explicitly sets the button context to the given object. If no context is given, the form base object of the surrounding
     * form is used.
     */
    context: PropTypes.any,
    /**
     * Optional action function, receives the context as argument
     */
    action: PropTypes.func,
    /**
     * the type of the button, defaults to "button"
     */
    type: PropTypes.string
};

Button.defaultProps = {
    className: "btn btn-secondary",
    text: ""
};

/**
 * Convenience method to have a non-transition button that is disabled when there are errors in the form. Makes sure
 * to submit the form /revalidate the form context before deciding.
 *
 * It follows the behavior of transition discard buttons and disables if there is either an error in the form or if the
 * button is inside a form, but there is no form object.
 *
 * @param formConfig
 *
 * @return {boolean} true if the button should be disabled
 */
Button.disabledIfErrors = formConfig => {

    if (formConfig.ctx)
    {
        formConfig.ctx.submit();
    }
    else
    {
        formConfig.formContext.revalidate();
    }

    return formConfig.hasErrors() || (formConfig.ctx && !formConfig.root);
};

export default fnObserver( Button )
