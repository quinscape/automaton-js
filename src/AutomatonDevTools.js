import React from "react"
import cx from "classnames"

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

import { isObservable, toJS } from "mobx"
import withAutomatonEnv from "./withAutomatonEnv";


let AutomatonDevTools;
if (process.env.NODE_ENV === "production")
{
    // render as empty span
    AutomatonDevTools = "span";
}
else
{
    // noinspection JSUnusedLocalSymbols
    const DEV_TOOLS_CSS = require("../automaton-devtools.css");
    // optimization friendly late imports
    const devToolsModule = require("mobx-react-devtools");

    const JSONTree = require("react-json-tree").default;


    class ToolbarButton extends React.Component {
        render()
        {
            const {active, onToggle, className} = this.props;
            return (
                <button
                    className={cx("btn btn-sm pl-1 pt-1 pr-1 pb-0 mr-1", active && "active")}
                    onClick={onToggle}
                    role="button"
                    aria-pressed={active}
                >
                    <i className={"fas " + className}/>
                </button>
            );
        }
    }


    const {default: DevTools } = devToolsModule;

    AutomatonDevTools = withAutomatonEnv(
        class extends React.Component {

            render()
            {
                if (process.env.NODE_ENV === "production")
                {
                    return false;
                }


                return (
                    <DevTools />
                )
            }
        }
    )

}

export default AutomatonDevTools

