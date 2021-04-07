import cx from "classnames"
import MarkdownSection from "./MarkdownSection";
import React from "react";

import ComplexIcon from "./complex.icon.svg";

const Description = ({text}) => (
    <p className={ cx( !text && "text-muted") }>
        {
            text || "No description"
        }
    </p>
)


function printJsDocType(type)
{
    if (!type)
    {
        return "---";
    }
    if (type.type === "NameExpression")
    {
        return type.name;
    }
    else if (type.type === "AllLiteral")
    {
        return "*";
    }
    else if (type.type === "VoidLiteral")
    {
        return "void";
    }
    else if (type.type === "NullLiteral")
    {
        return "null";
    }
    else if (type.type === "RestType")
    {
        return "... " + printJsDocType(type.expression);
    }
    else if (type.type === "FunctionType")
    {
        return "(" + type.params.map( p => printJsDocType(p)).join(", ") + ") => " + printJsDocType(type.result);
    }
    else if (type.type === "UnionType")
    {
        return type.elements.map( elem => printJsDocType(elem)).join(" | ");
    }
    else if (type.type === "TypeApplication")
    {
        return printJsDocType(type.expression) + "<" +  type.applications.map( a => printJsDocType(a)).join(", ") + ">";
    }
    else if (type.type === "NullableType")
    {
        return "[" +  printJsDocType(type.expression) + "]";
    }

    /*
    {
    "type": "TypeApplication",
    "expression": {
        "type": "NameExpression",
        "name": "Array"
    },
    "applications": [
        {
            "type": "NameExpression",
            "name": "String"
        }
    ]
}
     */
    throw new Error("Cannot print type: " + JSON.stringify(type))
}


const MethodDoc = ({doc, name = doc.name, standalone = false, insert = false}) => {
    const { description } = doc;

    const tags = doc.tags || doc.description.tags || [];

    const params = tags.filter(
        t => t.title === "param"
    );

    const returnTag =tags.find(
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
                        </h3>
                        <Description text={typeof description === "object" ? description.description : description }/>
                        {
                            typeof insert === "function" && insert()
                        }
                        {
                            params.length ? (
                                <>
                                    <h4>Parameters</h4>
                                    <table className="table table-striped table-hover">
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
    const replacement = docs.handwritten.find( hw => hw.replace === name);
    if (replacement)
    {
        return (
            <MarkdownSection
                name={ name }
                content={ replacement.content }
            />
        )
    }
    
    const toInsert = docs.handwritten.find( hw => hw.into === name) || false;
    const toAppend = docs.handwritten.filter( hw => hw.after === name) || false;

    return (
        <section
            id={name}
            className="mb-5"
        >
            {
                doc.description &&
                <MethodDoc
                    name={ doc.name }
                    doc={ doc.description }
                    standalone={ standalone }
                    insert={ () => (
                            toInsert ? (
                                <MarkdownSection
                                    name={ name + "-" + toInsert.src }
                                    content={ toInsert.content }
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
                                        content={ hw.content }
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
    const replacement = docs.handwritten.find( hw => hw.replace === name);
    if (replacement)
    {
        return (
            <MarkdownSection
                name={ name }
                content={ replacement.content }
            />
        )
    }

    const ctor = doc.members && doc.members.find(mdoc => mdoc.name === "constructor");

    const toInsert = docs.handwritten.find( hw => hw.into === name)
    const toAppend = docs.handwritten.filter( hw => hw.after === name) || false;

    return (
        <section
            id={name}
            className="mb-5"
        >
            <h2>
                <ComplexIcon/>
                {
                    name
                }
            </h2>
            <Description text={doc.description && doc.description.description}/>
            {
                toInsert ? <MarkdownSection
                    name={ name + "-" + toInsert.src }
                    content={ toInsert.content }
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

                    return (
                        <MethodDoc
                            key={ idx }
                            doc={ mdoc }
                        />
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
                                content={hw.content}
                            />
                        );
                    }
                )
            }
            <hr/>
        </section>
    )

}
