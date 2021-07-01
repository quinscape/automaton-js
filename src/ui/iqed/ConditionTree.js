import React, { useLayoutEffect, useRef, useState } from "react"
import cx from "classnames"
import { observer } from "mobx-react-lite";
import TreeLayout from "../../util/TreeLayout";


function follow(node, prop)
{
    const sub = [];
    let current = node[prop];
    while (current)
    {
        sub.push(current);
        current = current[prop];
    }
    return sub;
}

function append(out, node)
{
    if (!node)
    {
        return;
    }

    const leftSide = follow(node, "leftSibling");
    const rightSide = follow(node, "rightSibling");
    leftSide.reverse();

    if (leftSide.length)
    {
        out.push(... leftSide);
    }

    out.push(node);

    if (rightSide.length)
    {
        out.push(...rightSide);
    }

    for (let i = 0; i < leftSide.length; i++)
    {
        append(out, leftSide[i].offspring);
    }
    append(out, node.offspring);
    for (let i = 0; i < rightSide.length; i++)
    {
        append(out, rightSide[i].offspring);
    }

}

function flatten(node)
{
    const out = [];

    append(out, node);

    return out;
}


const ConditionTree = observer(({editorState, maxHeight = 500}) => {

    const { queryConfig, layoutNodes } = editorState;

    const containerRef = useRef(null);

    const [ layout, setLayout ] = useState(null);

    // original condition FilterDSL nodes (or null)
    const condition = queryConfig && queryConfig.condition;

    useLayoutEffect(
        () => {

            return new TreeLayout({
                NODE_WIDTH: node => node.elem.getBoundingClientRect().width,
                NODE_HEIGHT: node => node.elem.getBoundingClientRect().height
            })


        },
        []
    );


    return (
        <div
            ref={ containerRef }
            style={{ maxWidth, maxHeight }}
        >

            <svg width={0 } height={ 0 }>


            </svg>

            {
                flatten(layoutNodes).map( ln =>
                    <div>
                        {
                            "Item " + ln.id
                        }
                    </div>
                    
                )
            }
        </div>
    );
});

export default ConditionTree;
