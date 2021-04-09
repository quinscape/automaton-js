import React from "react"
import cx from "classnames"

function TOCItem({item})
{
    return (
        <li>
            <a className="btn btn-link" href={ "#" + item.name }>
                {
                    item.title
                }
            </a>
            {
                !!item.headings.length && (
                    <ul className="list-unstyled pl-4">
                        {
                            item.headings.map( h => (
                                <TOCItem
                                    key={ h.name }
                                    item={ h }
                                />
                            ))
                        }
                    </ul>
                )
            }
        </li>
    )
}


function MarkdownTOC({toc, className })
{

    if (!toc || !toc.headings)
    {
        return "---";
    }

    return (
        <ul className={ cx("markdown-doc list-unstyled", className) }>
            {
                toc.headings.map( h => (
                    <TOCItem
                        key={ h.name }
                        item={ h }
                    />

                ))
            }
        </ul>
    );
}


export default MarkdownTOC;
