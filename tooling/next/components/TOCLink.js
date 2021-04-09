import cx from "classnames";
import React from "react";
import { useRouter } from "next/router";
import MarkdownTOC from "./MarkdownTOC";


export default function TOCLink({docs, name, short = false})
{
    const router = useRouter();

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
        <>
            <a
                className={
                    cx(
                        "btn btn-link"
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

    );
}
