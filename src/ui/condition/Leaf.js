import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import cx from "classnames";
import ConditionEditorState from "./ConditionEditorState";


const Leaf = observer(function Lead ({className, layoutNode, offsetX, offsetY, tree, children}) {

    const leafRef = useRef(null);

    if (!layoutNode)
    {
        return false;
    }

    let { right: x, y } = layoutNode;

    const nodeId = ConditionEditorState.getNodeId(layoutNode.data);
    const { height, maxWidth } = tree.getDimension(nodeId)

    if (x === undefined || y === undefined)
    {
        x = 0;
        y = 0;

    }
    else
    {
        // rotate 90 degree ccw and mirror on the x axis
        let tmp = x;
        // noinspection JSSuspiciousNameCombination
        x = y;
        y = tmp - height;

    }



    //console.log("LEAF", x, y, offsetX, offsetY)

    return (
        <span
            ref={ leafRef }
            id={ nodeId }
            className={
                cx( "node leaf", className )
            }
            style={{
                left: x - offsetX,
                top: y - offsetY,
                maxWidth: maxWidth > 0 ? maxWidth : null,
                //transform: className === "structural" && "rotate(-90deg)"
            }}
        >
            {
                children
            }
        </span>
    );
});

export default Leaf;
