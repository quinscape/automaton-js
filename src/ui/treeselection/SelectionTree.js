import React from "react";
import Tree from "../tree/Tree";

const SelectionTree = (props) => {
    const {
        treeContent,
        selectedElements = [],
        onSelectedElementsChange
    } = props;

    return (
        <Tree
            selectedElements={selectedElements}
            onSelectedElementsChange={onSelectedElementsChange}
        >
            {
                renderObject(treeContent)
            }
        </Tree>
    )
}

function renderObject(treeObject, path = "") {
    const renderedElements = [];

    for(const treeElement in treeObject) {
        const newPath = path ? `${path}.${treeElement}` : treeElement;
        if(typeof treeObject[treeElement] === "object") {
            renderedElements.push(
                <Tree.TreeNode
                    key={newPath}
                    selectionId={newPath}
                    renderer={treeElement}
                    renderCheckbox
                >
                    {
                        renderObject(treeObject[treeElement], newPath)
                    }
                </Tree.TreeNode>
            )
        } else {
            renderedElements.push(
                <Tree.TreeNode
                    key={newPath}
                    selectionId={newPath}
                    renderer={treeElement}
                    renderCheckbox
                />
            )
        }
    }

    return renderedElements;
}

export default SelectionTree;
