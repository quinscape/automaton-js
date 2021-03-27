import cx from "classnames";
import React from "react";
import { useRouter } from "next/router";


export default function TOCLink({doc})
{
    const router = useRouter();

    return (
        <>
            <a
                className={
                    cx(
                        "btn btn-link btn-sm"
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
