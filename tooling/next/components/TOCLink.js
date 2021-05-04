import cx from "classnames";
import React, { useContext } from "react";
import { useRouter } from "next/router";
import MarkdownTOC, { TOCItem } from "./MarkdownTOC";
import ReadingPosition from "./ReadingPosition";

const TOCLink = ({docs, name, href, short = false}) =>
{
    const router = useRouter();
    //const intersectionContext = useContext(IntersectionContext);

    const doc = docs.docs[name];
    const { handwritten } = docs;
    let inserted = null;

    if (!short)
    {
        const replacement = handwritten.find(hw => hw.replace === name);

        if (replacement && replacement.toc )
        {
            return (
                <MarkdownTOC
                    className="mb-0"
                    toc={ replacement.toc }
                />
            )
        }

        inserted = handwritten.find(hw => hw.into === name);
        // if (inserted) {
        //     console.log(inserted);
        // }
    }

    return (
        <ReadingPosition.Consumer>
            {
                readingPosition => {
                    const isReading = readingPosition != null && readingPosition.section === doc.name;

                    return (
                        <li>
                            <a
                                className={
                                    cx(
                                        "btn btn-link toc-link",
                                        isReading ? "reading" : !href && "text-muted"
                                    )
                                }
                                href={ href || `#${doc.name}` }
                            >
                                {
                                    doc.name
                                }
                            </a>
                            {
                                inserted && inserted.toc ? 
                                    inserted.toc.title ? (
                                        <ul className="markdown-doc list-unstyled pl-4">
                                            <TOCItem
                                                key={ inserted.toc.name }
                                                item={ inserted.toc }
                                            />
                                        </ul>
                                    ) : (
                                        <MarkdownTOC
                                            className="pl-4"
                                            toc={ inserted.toc }
                                        />
                                    )
                                : (
                                    <br/>
                                )
                            }
                        </li>
                    )
                }
            }
        </ReadingPosition.Consumer>

    );
};

export default TOCLink;
