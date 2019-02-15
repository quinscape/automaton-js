
const reactDocGen = require("react-docgen");
const fs = require("fs");
const path = require("path");
const jsdocToJSON = require("./jsdocToJSON");

const COMPONENTS = [
    {
        name: "General",
        components: [
            "../src/i18n.js",
        ]
    }
];


function docPages(config)
{
    for (let pathName in config)
    {
        if (config.hasOwnProperty(pathName))
        {
            let out = "";
            config[pathName].forEach( fn => out += fn());

            console.log("Writing page " + pathName);
            fs.writeFileSync( path.join(__dirname, pathName), out);
        }
    }
}


function jsDocSection(docs, section)
{
    return function()
    {
        const { name } = section;


        return `
          ### ${name}
        
        `;
    }
}


function componentSection(sections)
{
    return function()
    {

    };
}

function h1(heading)
{
    return function () {

        return "# " + heading;
    }
}

function h2(heading)
{
    return function () {

        return "## " + heading;
    }
}

function markdown(pathName)
{
    return function () {
        return fs.readFileSync(path.join(__dirname, pathName), "UTF-8");
    }
}

const CREATE_DOCS_PAGES = docs => docPages({
    "../docs/index.md" : [
        markdown("./snippets/intro.md")
    ],
    "../docs/api-ref.md" : [
        jsDocSection(docs, {})
    ],
    "../docs/components.md" : [componentSection([

    ])],
});



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
        return "Form Config Props";
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

function main({docs})

{
    fs.writeFileSync(path.join(__dirname, "./jsdoc.json"), JSON.stringify(docs, null, 4), "UTF-8");

    CREATE_DOCS_PAGES(docs);
}


jsdocToJSON().then(main);


