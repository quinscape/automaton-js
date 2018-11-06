import React from "react"


class DefaultLayout extends React.Component {

    render()
    {
        const {env, children} = this.props;

        return (
            <div className="container default-layout">
                {
                    children
                }
            </div>
        )
    }
}


export default DefaultLayout
