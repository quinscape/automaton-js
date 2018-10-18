import React from "react"
import withAutomatonEnv from "../withAutomatonEnv";
import Icon from "./Icon";
import cx from "classnames"

class Button extends React.Component {

    onClick = ev => {
        const { action, context, env } = this.props;

        if (typeof action === "function")
        {
            action(context)
        }
        else
        {
            const { process } = env;
            process.transition(context)
        }
    };

    render()
    {
        const { className, name, icon, text } = this.props;

        return (
            <button
                type="button"
                name={ name }
                className={ className }
                onClick={ this.onClick }
            >
                {
                    icon && (
                        <Icon
                            className={
                                cx(
                                    icon,
                                    "pr-1"
                                )
                            }
                        />
                    )
                }
                {
                    text
                }
            </button>
        )
    }
}

export default withAutomatonEnv(Button)
