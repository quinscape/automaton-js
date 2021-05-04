import cx from "classnames"
import MarkdownSection from "./MarkdownSection";
import React from "react";

import ComplexIcon from "./iquery.icon.svg";
import { printJsDocType } from "../service/printJsDocType";
import useViewIntersect from "./useViewIntersect";
import SectionLink from "./SectionLink";


const Description = ({text}) => (
    <p className={ cx( !text && "text-muted") }>
        {
            text || "No description"
        }
    </p>
)


const MethodDoc = (props) => {

    const {doc, name = doc.name, standalone = false, insert = false} = props;
    const { description } = doc;

    const tags = doc.tags || doc.description.tags || [];

    const params = tags.filter(
        t => t.title === "param"
    );

    const returnTag = tags.find(
        t => t.title === "return"
    );

    return (
        <>
            {
                name !== "constructor" && (
                    <>
                        <h3>
                            {
                                (standalone ? "" : ".") + name + "(" +
                                params.map(
                                    t => t.name
                                ).join(", ") +
                                ")"
                            }
                            {
                                doc.link != null ? (
                                    <SectionLink link={ `#${name}` } />
                                ) : ""
                            }
                        </h3>
                        <Description text={typeof description === "object" ? description.description : description }/>
                        {
                            typeof insert === "function" && insert()
                        }
                        {
                            params.length ? (
                                <>
                                    <h4>Parameters</h4>
                                    <table className="table table-bordered table-hover">
                                        <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            params.map( p => (
                                                <tr
                                                    key={ p.name }
                                                >
                                                    <td>
                                                        {
                                                            p.name
                                                        }
                                                    </td>
                                                    <td>
                                                        {
                                                            !p.type && "---"
                                                        }
                                                        {
                                                            printJsDocType(p.type)
                                                        }
                                                    </td>
                                                    <td>
                                                        {
                                                            p.description
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                        </tbody>

                                    </table>
                                </>
                            ) : false
                        }
                        {
                            returnTag && (
                                <>
                                    <h4>Return Value</h4>
                                    Type: {
                                    printJsDocType(returnTag.type)
                                }
                                    <Description text={ returnTag.description } />

                                </>
                            )
                        }

                    </>
                )
            }
            <pre>
            </pre>
        </>
    );
}

/**
 * Section for a function exported from the library
 */
export function JsDocFunctionSection({ name, doc, docs, standalone = false })
{
    const sectionRef = useViewIntersect();

    const replacement = docs.handwritten.find( hw => hw.replace === name);
    if (replacement)
    {
        return (
            <MarkdownSection
                name={ name }
                markdown={ replacement }
                inserted={ true }
            />
        )
    }
    
    const toInsert = docs.handwritten.find( hw => hw.into === name) || false;
    const toAppend = docs.handwritten.filter( hw => hw.after === name) || false;

    return (
        <section
            ref={sectionRef}
            id={name}
            className="mb-5"
        >
            {
                doc.description &&
                <MethodDoc
                    name={ doc.name }
                    doc={ doc }
                    standalone={ standalone }
                    insert={ () => (
                            toInsert ? (
                                <MarkdownSection
                                    name={ name + "-" + toInsert.src }
                                    markdown={ toInsert }
                                    inserted={ true }
                                />
                            ) : false
                        )
                    }
                    after={ () => toAppend ?
                        toAppend.filter(hw => hw.after === name).map(
                            hw => {
                                const n = name + "-" + hw.src;
                                return (
                                    <MarkdownSection
                                        key={ n }
                                        name={ n }
                                        markdown={ hw }
                                        inserted={ true }
                                    />
                                );
                            }
                        ) : false
                    }
                />
            }
            <hr/>
        </section>
    )

}




/**
 * Section for a complex class or static util object.
 */
export function JsDocClassSection({name, doc, docs})
{
    const sectionRef = useViewIntersect();
    
    const replacement = docs.handwritten.find( hw => hw.replace === name);
    if (replacement)
    {
        return (
            <MarkdownSection
                name={ name }
                markdown={ replacement }
                inserted={ true }
            />
        )
    }

    const ctor = doc.members && doc.members.find(mdoc => mdoc.name === "constructor");

    const toInsert = docs.handwritten.find( hw => hw.into === name)
    const toAppend = docs.handwritten.filter( hw => hw.after === name) || false;

    return (
        <section
            ref={sectionRef}
            id={name}
            className="mb-5"
        >
            <h2>
                <ComplexIcon/>
                {
                    name
                }
                <SectionLink link={ `#${name}` } />
            </h2>
            <Description text={doc.description && doc.description.description}/>
            {
                toInsert ? <MarkdownSection
                    name={ name + "-" + toInsert.src }
                    markdown={ toInsert }
                    inserted={ true }
                /> : false
            }
            {
                ctor &&(
                    <>
                        <h3>Constructor</h3>
                        <MethodDoc
                            doc={ ctor }
                        />

                    </>
                )
            }

            {
                doc.members && doc.members.map((mdoc, idx) => {
                    if (mdoc.name === "constructor")
                    {
                        return false;
                    }

                    const mDocName = name + "." + mdoc.name;
                    const replacement = docs.handwritten.find(hw => hw.replace === mDocName);

                    return (
                        replacement ? (
                            <MarkdownSection
                                key={ idx }
                                name={ mDocName }
                                markdown={ replacement }
                                inserted={ true }
                            />
                        ) : (
                            <MethodDoc
                                key={ idx }
                                doc={ mdoc }
                            />
                        )
                    )

                })
            }

            {
                toAppend.map(
                    hw => {
                        const n = name + "-" + hw.src;
                        return (
                            <MarkdownSection
                                key={ n }
                                name={ n }
                                markdown={ hw }
                                inserted={ true }
                            />
                        );
                    }
                )
            }
            <hr/>
        </section>
    )

}
