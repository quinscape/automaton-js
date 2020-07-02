import rightpad from "rightpad";


export function appendHeader(out, section)
{
    let current = section.firstChild.firstChild;
    while (current)
    {
        out.push(current.innerHTML)

        current = current.nextSibling;
    }
}


function print(out, element)
{
    if (element.nodeType === Node.TEXT_NODE)
    {
        //console.log("PRINT", element.textContent)
        out.push(element.textContent);
        return;
    }

    //console.log("PRINT", "<"+ element.tagName+ ">")

    if (element.tagName === "P")
    {
        element = element.firstChild;
    }

    switch (element.tagName)
    {
        case "I":
            out.push(element.classList.contains("fa-check") ? "V" : "X")
            break;
        case "LABEL":
            if (!element.classList.contains("sr-only"))
            {
                out.push("/" + element.innerHTML + "/")
            }
            break;
        case "INPUT":
            if (element.readOnly || element.disable)
            {
                out.push("'" + element.getAttribute("value") + "'")
            }
            else
            {
                out.push("<[" + element.getAttribute("value") + "]>")
            }

            break;
        case "DIV":
        case "BUTTON":
        {
            let current = element.firstChild;
            const buf = [];
            while (current)
            {
                print(buf, current);
                current = current.nextSibling;
            }
            out.push(buf.join(" "))
            break;
        }
        default:
            out.push(element.textContent)
            break;
    }

}


function appendRows(out, section)
{
    let currentRow = section.firstChild;
    while (currentRow)
    {
        let currentCell = currentRow.firstChild;
        while (currentCell)
        {
            let currentContent = currentCell.firstChild;
            const buf = [];
            while (currentContent)
            {
                print(buf, currentContent);
                currentContent = currentContent.nextSibling;
            }
            out.push(buf.join(" "))

            currentCell = currentCell.nextSibling;
        }
        currentRow = currentRow.nextSibling;
    }

}


export function getTableSummary( forcedWidths = null)
{

    const tableElem = document.querySelector("table.merge-table");

    const out = [];

    appendHeader(out, tableElem.firstChild)

    const columnCount = out.length;

    appendRows(out, tableElem.firstChild.nextSibling)

    //console.log("OUT", out)

    const sizes = new Array(columnCount).fill(0);

    let pos = 0;
    while (pos < out.length)
    {
        for (let i = 0; i < columnCount; i++)
        {
            sizes[i] = forcedWidths && forcedWidths[i] !== 0 ? forcedWidths[i] : Math.max(sizes[i], out[pos + i].length);
        }
        pos += columnCount;
    }

    pos = 0;
    let s = "\n";
    while (pos < out.length)
    {
        s += rightpad(out[pos], sizes[0], " ")
        for (let i = 1; i < columnCount; i++)
        {
            s += " | " + rightpad(out[pos + i], sizes[i], " ")
        }
        s += " |\n"

        if (pos === 0)
        {
            s += rightpad("", sizes[0], "-")
            for (let i = 1; i < columnCount; i++)
            {
                s += "-+-" + rightpad("", sizes[i], "-")
            }
            s += "-+\n"
        }

        pos += columnCount;
    }

    return s;
}
