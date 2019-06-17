const reactDocGen = require("react-docgen");
const fs = require("fs");
const path = require("path");

const COMPONENTS = [
    {
        name: "Automaton UI Components",
        components: [
            "../src/ui/Button.js",
            "../src/ui/CalendarField.js",
            "../src/ui/Icon.js",
            "../src/ui/Link.js",
            "../src/ui/datagrid/IQueryGrid.js",
            "./snippets/GridExamples.md",
            "../src/ui/datagrid/Column.js",
            "./snippets/CustomFilter.md",
            "../src/ui/datagrid/RowSelector.js",
            "./snippets/RowSelectorExample.md",
            "../src/ui/ScrollTracker.js",
        ]
    }
];

const BREAK = "\n";
const DOUBLE_BREAK = "\n\n";

function renderType(type)
{
    if (!type)
    {
        return "---";
    }

    const { name, value } = type;

    if (name === "union")
    {

        let s = "";
        for (let i = 0; i < value.length; i++)
        {
            if (i > 0)
            {
                s += " or "
            }

            s += renderType(value[i]);
        }

        return s;
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
    else if (name === "shape" && value === "import FORM_CONFIG_PROP_TYPES from \"./FormConfigPropTypes\"")
    {
        return "Form options";
    }
    else
    {
        return name;
    }
}

function renderDescription(text)
{
    const result = text.replace(/\s+/g, " ");

    //console.log("DESC", result)
    return result || "...";
}

function endsWith(filename, s)
{
    return !s || filename.lastIndexOf(s) === filename.length - s.length;
}

function renderComponentName(displayName)
{
    if (displayName === "FormConfigProps")
    {
        return "Form Options";
    }
    return  "&lt;" + displayName + "/&gt;";
}

function renderComponent(component)
{
    // try
    // {
        let out = "";

        let fileName, content;
        if (typeof component === "function")
        {
            content = component();
            fileName = "fn()";
        }
        else
        {
            fileName = path.resolve(__dirname, component);
            content =  fs.readFileSync( fileName, "UTF-8");
        }

        if (endsWith(fileName, ".md"))
        {
            out += content
        }
        else
        {
            const info = reactDocGen.parse( content);

            out += "## " + renderComponentName(info.displayName) + DOUBLE_BREAK;
            out += info.description + DOUBLE_BREAK;


            const { props } = info;
            out += "### Props" + DOUBLE_BREAK;

            if (props)
            {

                out += " Name | Type | Description " + BREAK;
                out += "------|------|-------------" + BREAK;

                const propNames = Object.keys(props);
                propNames.sort();

                for (let k = 0; k < propNames.length; k++)
                {
                    const propName = propNames[k];

                    const { type, required, description } = props[propName];

                    if (!type)
                    {
                        throw new Error("Error in " + fileName + ": Prop " + propName + " has default value, but no propType definition");
                    }
                    out += (required ? "**" + propName + "**" + " (required)" : propName) + " | " + renderType(type) + " | " + renderDescription(description) + BREAK;
                }
            }
            else
            {
                out += info.displayName + " has no props.";
            }

            // console.log(
            //     JSON.stringify(info, null, 4)
            // );
        }
        return out;

    // }
    // catch(e)
    // {
    //     throw new Error("Error rendering component " + component + ": " + e);
    // }
}

function main()

{
    let out = "";

    for (let i = 0; i < COMPONENTS.length; i++)
    {
        const { name, components } = COMPONENTS[i];

        if (name)
        {
            // render chapter H1
            out += "# " + name + DOUBLE_BREAK;
        }

        for (let j = 0; j < components.length; j++)
        {
            const componentName = components[j];
            try
            {
                out += renderComponent(componentName);
            }
            catch(e)
            {
                console.log("Error rendering '" + componentName + "'", e);
            }
        }
    }
    fs.writeFileSync(path.resolve(__dirname, "../docs/component-reference.md"), out);
}

main();

