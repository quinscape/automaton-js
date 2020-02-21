/**
 * Returns the given element if the first <li> around it is the given parent.
 * @param {Element} elem        element
 * @param {Element} parent      parent <li>
 * @returns {Element}
 */
function ensureParent(elem, parent)
{
    if (elem)
    {
        let current = elem.parentNode;

        while (current)
        {
            if (current.tagName === "LI")
            {
                return current === parent ? elem: null;
            }
            current = current.parentNode;
        }
    }
    return null;
}


/**
 * Find an element inside a tree item itself but not in descendant tree items.
 *
 * @param treeItem
 * @param selectors
 * @returns {Element}
 */
function find(treeItem, selectors)
{
    const result = treeItem.querySelector(selectors);
    return ensureParent(result, treeItem);
}


function getText(treeItem)
{

    let s = "";

    s += !!find(treeItem, ".focus") ? "*" : " ";

    const defaultButton = find(treeItem , ".default");

    elem = defaultButton;

    let first = true;
    while (elem)
    {
        if (elem.tagName === "LI")
        {
            if (first)
            {
                first = false;
            }
            else
            {
                s += "  ";
            }
        }
        elem = elem.parentNode;
    }

    const caretButton = find(treeItem , ".caret");
    if (caretButton)
    {
        s += caretButton.getAttribute("aria-expanded") === "true" ? "v" : ">";
    }
    else
    {
        s += " ";
    }

    let elem = defaultButton.firstChild;
    while (elem)
    {
        if (elem.nodeType === 3)
        {
            s += elem.nodeValue;
        }

        elem = elem.nextSibling;
    }


    return s;
}


/**
 * Returns a simplified textual representation of the current tree state to run asserts against.
 *
 * Returns an array of string lines. "*" represents the current selection, ">" an closes caret button "v" an open caret
 * button. The indentation of the lines matches the current depth of the tree ignoring the first level.
 *
 * @param container
 * @returns {string[]}
 */
export default function getTreeSummary(container)
{
    return [...container.querySelectorAll("li[role='treeitem']")].map(getText);
}
