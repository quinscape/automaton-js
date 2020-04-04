const reactDocGen = require("react-docgen");
const fs = require("fs");
const path = require("path");

const COMPONENTS = [
    {
        name: "Automaton UI Components",
        components: [
            "../src/ui/Button.js",
            "../src/ui/CalendarField.js",
            "../src/ui/Link.js",
            "../src/ui/datagrid/IQueryGrid.js",
            "./snippets/GridExamples.md",
            "../src/ui/datagrid/Column.js",
            "./snippets/CustomFilter.md",
            "../src/ui/datagrid/RowSelector.js",
            "./snippets/RowSelectorExample.md",
            "../src/ui/tree/Tree.js",
            "./snippets/tree-navigation.md",
            "../src/ui/tree/Objects.js",
            "./snippets/tree-objects.md",
            "../src/ui/tree/IndexedObjects.js",
            "./snippets/tree-indexed.md",
            "../src/ui/tree/Folder.js",
            "../src/ui/ScrollTracker.js",
            "../src/ui/StyleSwitcher.js",
            "../src/ui/FKSelector.js",
            "../src/ui/AssociationSelector.js",
        ]
    }
];

const BREAK = "\n";
const DOUBLE_BREAK = "\n\n";

function renderType(type, shapes, propName)
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

            s += renderType(value[i], shapes, propName);
        }

        return s;
    }
    else if (name === "arrayOf")
    {
        return "Array of " + renderType(value, shapes, propName);
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

        shapes.push(newShape);

        return name;
    }
    else
    {
        return name;
    }
}

function renderDescription(text)
{
    if (!text)
    {
        return "---";
    }

    const result = text.replace(/\s+/g, " ");

    //console.log("DESC", result)
    return result || "---";
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


function propTypesTable(props, shapes, fileName)
{
    let out = " Name | Type | Description " + BREAK +
              "------|------|-------------" + BREAK;

    const propNames = Object.keys(props);
    propNames.sort();

    for (let k = 0; k < propNames.length; k++)
    {
        const propName = propNames[k];

        const { type, name, required, description } = props[propName];

        if (!type && !name)
        {
            throw new Error("Error in " + fileName + ": Prop " + propName + " has default value, but no propType definition");
        }
        out += (required ? "**" + propName + "**" + " (required)" : propName) + " | " + renderType((type|| (name === "union" ? props[propName] : { name, value: "---"})), shapes, propName) + " | " + renderDescription(description) + BREAK;
    }


    return out;
}


function renderComponent(component)
{
    // try
    // {
        let out = "";

        let shapes = [];

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
                out += propTypesTable(props, shapes, fileName);
            }
            else
            {
                out += info.displayName + " has no props.";
            }

            for (let i = 0; i < shapes.length; i++)
            {
                const {name, props} = shapes[i];

                out += "## " + name + " shape" + BREAK;
                out += propTypesTable(props, shapes, fileName);
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

