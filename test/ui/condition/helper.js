import ConditionEditorState from "../../../src/ui/condition/ConditionEditorState";
import {
    act,
    findByRole,
    getAllByText,
    getByText,
    prettyDOM,
    queryByText,
    waitForElementToBeRemoved
} from "@testing-library/react";


function findContextMenuInternal(container, condition, text)
{
    const nodeId = ConditionEditorState.getNodeId(condition);

    const nodeSpan = container.querySelector(`span[data-layout="${nodeId}"]`);
    if (!nodeSpan)
    {
        throw new Error("Could not find span with data-layout=\"" + nodeId + "\". Got the wrong condition node?")
    }

    const allEllipses = getAllByText(nodeSpan, "…");

    const toggle = allEllipses.find(e => e.parentNode.parentNode.dataset.layout === nodeId);

    toggle.click()

    return findByRole(nodeSpan, "menu")
        .then(
            menu => {

                return [queryByText(menu, text), menu]
            }
        )
}


export function findContextMenu(container, condition, text)
{
    return findContextMenuInternal(container, condition, text).then(([button] ) => button)
}


/**
 * Helper method to invoke a named context-menu function from
 * @param container     HTML container
 * @param condition     condition to invoke the context-menu for
 * @param text          text of the context menu entry to invoke
 */
export function invokeContextMenu(container, condition, text)
{
    return findContextMenuInternal(container, condition, text)
        .then(
            ([menuButton, menu]) => {
                if (!menuButton)
                {
                    throw new Error("Could not find context menu '" + text  + "' for" + JSON.stringify(condition))
                }

                menuButton.click()

            }
        )
}

