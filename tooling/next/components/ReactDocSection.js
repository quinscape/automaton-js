import MarkdownSection from "./MarkdownSection";
import React from "react";


function renderType(type, shapeConsumer, propName)
{
    if (!type)
    {
        return "---";
    }

    const { name, value } = type;

    if (name === "union")
    {
        if (typeof value === "string")
        {
            return value;
        }

        let s = "";
        for (let i = 0; i < value.length; i++)
        {
            if (i > 0)
            {
                s += " or "
            }

            s += renderType(value[i], shapeConsumer, propName);
        }

        return s;
    }
    else if (name === "arrayOf")
    {
        return "Array of " + renderType(value, shapeConsumer, propName);
    }
    else if (name === "enum" && value === "FieldMode.values()")
    {
        return "FieldMode value";
    }
    else if (name === "enum" && value === "FORM_CONFIG_PROP_TYPES")
    {
        return "config props";
    }
    else if (name === "instanceOf")
    {
        return "instance of " + value;
    }
    else if (name === "shape")
    {
        const newShape = {

            name: propName,
            props: value
        };
        //console.log("NEW SHAPE", newShape)

        typeof shapeConsumer === "function" && shapeConsumer(newShape);

        return name;
    }
    else
    {
        return name;
    }
}

const PropsTable = ({props, shapeConsumer = false}) => {

    if (!props)
    {
        return false;
    }

    return (
        <table className="table table-bordered table-striped table-bordered">
            <thead>
            <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
            </tr>
            </thead>
            <tbody>
            {
                Object.keys(props).map(propName => {
                    const {name, type, required, description} = props[propName];

                    return (
                        <tr
                            key={propName}
                        >
                            <td>
                                {
                                    required ? <strong> {propName} </strong> : propName
                                }
                            </td>
                            <td>
                                {
                                    renderType(
                                        (
                                            type ||
                                            (
                                                name === "union" ?
                                                props[propName] :
                                                {name, value: "---"}
                                            )
                                        ),
                                        shapeConsumer,
                                        propName
                                    )
                                }

                            </td>
                            <td>
                                {description}
                            </td>
                        </tr>
                    );
                })
            }
            </tbody>
        </table>);
};


export default function ReactDocSection({name, data, docs})
{

    const toInsert = docs.handwritten.find( hw => hw.into === name)
    const toAppend = docs.handwritten.filter( hw => hw.after === name) || false;

    const shapes = [];
    return (
        <section
            id={name}
            className="mb-5"
        >
            <h2>
                <i className="fab fa-react text-info mr-1"/>
                &lt;
                {
                    name
                }
                /&gt;
            </h2>
            {
                !data && <p className="text-muted">
                    No documentation
                </p>
            }
            {
                data && (
                    <>
                        <p>
                            {
                                data.description || <span className="text-muted">no description</span>
                            }
                        </p>
                        {
                            toInsert ? <MarkdownSection
                                name={ name + "-" + toInsert.src }
                                content={ toInsert.content }
                            /> : false
                        }
                        <h3>Props</h3>
                        {
                            !data.props && <p className="text-muted">
                                No Props
                            </p>
                        }
                        <PropsTable
                            props={ data.props }
                            shapeConsumer={ shape => shapes.push(shape) }
                        />
                        {
                            shapes.map(
                                (shape, idx) => (
                                    <PropsTable
                                        key={idx}
                                        props={shape}
                                    />
                                )
                            )
                        }
                        {
                            toAppend.filter(hw => hw.after === name).map(
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
                    </>
                )
            }
        </section>
    )

}
