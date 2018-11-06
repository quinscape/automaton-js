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


    const {default: DevTools, GraphControl, LogControl, UpdatesControl} = devToolsModule;

    AutomatonDevTools = withAutomatonEnv(
        class extends React.Component {

            state = {
                isOpen: false
            };

            toggle = () => this.setState({isOpen: !this.state.isOpen});


            render()
            {
                if (process.env.NODE_ENV === "production")
                {
                    return false;
                }

                const {env} = this.props;
                const {isOpen} = this.state;

                return (
                    <React.Fragment>
                        <DevTools noPanel/>

                        <div className="automaton-devtools p-0" style={{left: (window.innerWidth * 0.93) | 0}}>
                            <GraphControl>
                                <ToolbarButton className="fa-chart-bar"/>
                            </GraphControl>
                            <LogControl>
                                {/* Must have only one child that takes props: `active` (bool), `onToggle` (func) */}
                                <ToolbarButton className="fa-list-alt"/>
                            </LogControl>
                            <UpdatesControl>
                                {/* Must have only one child that takes props: `active` (bool), `onToggle` (func) */}
                                <ToolbarButton className="fa-recycle"/>
                            </UpdatesControl>
                            <ToolbarButton active={isOpen} className="fa-font" onToggle={this.toggle}/>
                        </div>
                        <Modal
                            isOpen={isOpen}
                            toggle={this.toggle}
                            backdrop={false}
                            modalTransition={{timeout: 100}}
                        >
                            <ModalHeader>Modal title</ModalHeader>
                            <ModalBody>
                                {
                                    Object.keys(env).map(name => {
                                        const value = env[name];

                                        if (isObservable(value))
                                        {
                                            return (
                                                <React.Fragment key={name}>
                                                    <h6>{name} (observable)</h6>
                                                    <JSONTree invertTheme={true} data={toJS(value)}/>
                                                </React.Fragment>
                                            )
                                        }
                                        else if (value && typeof value === "object")
                                        {
                                            return (
                                                <React.Fragment key={name}>
                                                    <h6>{name} (observable)</h6>
                                                    <JSONTree invertTheme={true} data={(value)}/>
                                                </React.Fragment>
                                            )
                                        }
                                        else
                                        {
                                            return (
                                                <React.Fragment key={name}>
                                                    <h6>{name} (observable)</h6>
                                                    {value}
                                                </React.Fragment>
                                            )
                                        }
                                    })
                                }
                            </ModalBody>
                        </Modal>
                    </React.Fragment>
                )
            }
        }
    )

}

export default AutomatonDevTools


/* eslint react/no-multi-comp: 0, react/prop-types: 0 */

class ModalExample extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
            modal: false
        };

        this.toggle = this.toggle.bind(this);
    }


    toggle()
    {
        this.setState({
            modal: !this.state.modal
        });
    }


    render()
    {
        const externalCloseBtn = <button className="close" style={{position: "absolute", top: "15px", right: "15px"}}
                                         onClick={this.toggle}>&times;</button>;
        return (
            <div>
                <Button color="danger" onClick={this.toggle}>{this.props.buttonLabel}</Button>
            </div>
        );
    }
}



