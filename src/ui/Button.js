import React from "react"
import withAutomatonEnv from "../withAutomatonEnv";
import PropTypes from "prop-types";
import Icon from "./Icon";
import cx from "classnames"


class Button extends React.Component {

    static propTypes = {
        action: PropTypes.func,
        transition: PropTypes.string,
        className: PropTypes.string,
        icon: PropTypes.string,
        text: PropTypes.string
    };

    static defaultProps = {
        className: "btn btn-secondary",
        text: ""
    };

    onClick = ev => {
        const {action, transition, context, env} = this.props;

        if (typeof action === "function")
        {
            action(context)
        }
        else
        {
            const {process} = env;
            process.transition(transition, context)
        }
    };


    render()
    {
        const {className, name, icon, text} = this.props;

        return (
            <button
                type="button"
                name={name}
                className={className}
                onClick={this.onClick}
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
