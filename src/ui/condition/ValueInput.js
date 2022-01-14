import React from "react"
import cx from "classnames"
import { observer } from "mobx-react-lite";


const ValueInput = observer(({node}) => {

    return (
        <div>
            Value: { node.data.value }
        </div>
    );
});

export default ValueInput;
