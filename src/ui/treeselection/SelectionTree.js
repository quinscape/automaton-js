import React from "react";
import Tree from "../tree/Tree";

const SelectionTree = (props) => {
    const {
        treeContent,
        selectedElements = [],
        onSelectedElementsChange,
        valueRenderer
    } = props;

    return (
        <Tree
            selectedElements={selectedElements}
            onSelectedElementsChange={onSelectedElementsChange}
        >
            {
                renderObject(treeContent, valueRenderer)
            }
        </Tree>
    )
}

function renderObject(treeObject, valueRenderer, path = "") {
    const renderedElements = [];

    for(const treeElement in treeObject) {
        const newPath = path ? `${path}.${treeElement}` : treeElement;
        if(typeof treeObject[treeElement] === "object") {
            renderedElements.push(
                <Tree.TreeNode
                    key={newPath}
                    selectionId={newPath}
                    renderer={valueRenderer ? valueRenderer(treeElement, {
                        isDirectory: true
                    }) : treeElement}
                    renderCheckbox
                >
                    {
                        renderObject(treeObject[treeElement], valueRenderer, newPath)
                    }
                </Tree.TreeNode>
            )
        } else {
            renderedElements.push(
                <Tree.TreeNode
                    key={newPath}
                    selectionId={newPath}
                    renderer={valueRenderer ? valueRenderer(treeElement, {
                        isDirectory: false
                    }) : treeElement}
                    renderCheckbox
                />
            )
        }
    }

    return renderedElements;
}

export default SelectionTree;
