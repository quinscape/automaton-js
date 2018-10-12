import React from "react"
import getDisplayName from "./getDisplayName";
import { ScopeContext } from "./Process";


/**
 * High-order component to receive all standard enviroment contexts as props.
 *
 * This is not needed for process view component which receive those properties in any case.
 * 
 * @param Component
 * @return {React.Component} component with environment props
 */
export default function withScope(Component)
{
    return (
        class WithComponent extends React.Component {

            static displayName = "withScope(" + getDisplayName(Component) + ")";

            render()
            {

                return (
                    <ScopeContext.Consumer>
                        {
                            ctx => <Component
                                {... this.props}
                                { ... ctx }
                            />

                        }
                    </ScopeContext.Consumer>
                );
            }
        }
    );
}


