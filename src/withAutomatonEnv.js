import React from "react"
import getDisplayName from "./util/getDisplayName";
import { AutomatonEnv } from "./Process";


/**
 * High-order component to receive all standard enviroment contexts as props.
 *
 * This is not needed for process view component which receive those properties in any case.
 * 
 * @param Component
 * @return {React.Component} component with environment props
 */
export default function withAutomatonEnv(Component)
{
    return (
        class WithComponent extends React.Component {

            static displayName = "withAutoEnv(" + getDisplayName(Component) + ")";

            render()
            {

                return (
                    <AutomatonEnv.Consumer>
                        {
                            env => (
                                <Component
                                    { ... this.props}
                                    env={ env }
                                />
                            )
                        }
                    </AutomatonEnv.Consumer>
                );
            }
        }
    );
}


