import React from "react"
import cx from "classnames"
import ReadingPosition from "./ReadingPosition";

function TOCItem({item})
{
    return (
        <ReadingPosition.Consumer>
            {
                readingPosition => {
                    const isReading = readingPosition != null && readingPosition.section === item.name;

                    return (
                        <li>
                            <a
                                className={
                                    cx(
                                        "btn btn-link toc-link",
                                        isReading ? "reading" : "text-muted"
                                    )
                                }
                                href={ "#" + item.name }
                            >
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
            }
        </ReadingPosition.Consumer>
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
