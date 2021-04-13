import cx from "classnames";
import React, { useContext } from "react";
import { useRouter } from "next/router";
import MarkdownTOC from "./MarkdownTOC";
import ReadingPosition from "./ReadingPosition";

const TOCLink = ({docs, name, short = false}) =>
{
    const router = useRouter();
    //const intersectionContext = useContext(IntersectionContext);


    const doc = docs.docs[name];
    const { handwritten } = docs;

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
    }

    return (
        <ReadingPosition.Consumer>
            {
                readingPosition => {
                    const isReading = readingPosition != null && readingPosition.section === doc.name;

                    return (
                        <>
                            <a
                                className={
                                    cx(
                                        "btn btn-link toc-link",
                                        isReading && "reading"
                                    )
                                }
                                href={ router.basePath + "/" + doc.link }
                            >
                                {
                                    doc.name
                                }
                            </a>
                            <br/>
                        </>
                    )
                }
            }
        </ReadingPosition.Consumer>

    );
};

export default TOCLink;
