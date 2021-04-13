import { promises as fs } from "fs"
import path from "path"
import { parse as doctrineParse, unwrapComment } from "doctrine"
import { parse as reactDocGenParse } from "react-docgen"

import config from "../automaton-js-doc.config"
import Group from "./Group";
import { loadSnippets, processMarkdownSnippets } from "./markdown";
import loadSource from "./loader";
import { filterPageDefaults } from "./docs-filter";
import undefinedsToNull from "./undefinedsToNull";


let docsData;

function resolveImport(moduleAST, doc)
{
    const name = doc.local;

    const {body} = moduleAST.program;

    for (let i = 0; i < body.length; i++)
    {
        const n = body[i];
        if (n.type === "ImportDeclaration")
        {
            const specifier = n.specifiers.find(specifier => specifier.local.name === name);

            if (specifier)
            {
                const imported = specifier.type === "ImportDefaultSpecifier" ? "default" : specifier.imported.name;
                const {source} = n;

                return {imported, source: source.value, doc};
            }
        }
    }
    throw new Error("Could not resolve import: " + name);
}


let doDebugLog = true;

function parseJsDoc(text)
{

    const unwrapped = unwrapComment("/**\n" + text + "\n*/")

    return undefinedsToNull(doctrineParse(unwrapped, {}));
}


function resolveRelative(base, rel)
{
    return path.resolve(path.dirname(base), rel)
}


function slashPath(sourcePath)
{
    if (path.sep === "/")
    {
        return sourcePath;
    }
    else if (path.sep === "\\")
    {
        return sourcePath.replace(/\\/g, "/");
    }
    throw new Error("Unsupported path seperator: " + path.sep);
}


function getProjectRelativeSourcePath(path)
{
    const safePath = slashPath(path);
    const pos = safePath.indexOf("src/");
    if (pos < 0)
    {
        throw new Error("Not a src path: " + path)
    }
    return safePath.substr(pos) + ".js";
}


function findExport(dependencyAST, name)
{
    const isDefault = name === "default";

    return dependencyAST.program.body.find(
        n => {
            if (isDefault && n.type === "ExportDefaultDeclaration")
            {
                return true;
            }

            if (!isDefault && n.type === "ExportNamedDeclaration")
            {
                const {declaration} = n;

                if (declaration.type === "VariableDeclaration")
                {
                    if (declaration.declarations[0].id.name === name)
                    {
                        return true;
                    }
                }
                else if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration")
                {
                    if (declaration.id.name === name)
                    {
                        return true;
                    }
                }

            }

            return false;
        }
    );
}


function findDeclByName(dependencyAST, localName)
{
    const decl = dependencyAST.program.body.find(n => {
        if (n.type === "VariableDeclaration")
        {
            return n.declarations[0].id.name === localName;
        }
        else if (n.type === "FunctionDeclaration" || n.type === "ClassDeclaration")
        {
            return n.id.name === localName;
        }
        else if (n.type === "ExportNamedDeclaration")
        {
            const { declaration } = n;
            const name = declaration.type === "VariableDeclaration" ? declaration.declarations[0].id.name : declaration.id.name;
            return  name === localName;
        }
        return false;
    });

    if (decl.type === "ExportNamedDeclaration")
    {
        return n.declaration;
    }
    return decl;
}


function findDeclarationOfExport(dependencyAST, exportDecl)
{
    let origDecl;
    let localName;
    if (exportDecl.declaration.type === "Identifier")
    {
        localName = exportDecl.declaration.name;
        origDecl = findDeclByName(dependencyAST, localName);
    }
    else
    {
        if (exportDecl.declaration.type === "CallExpression")
        {
            return {
                origDecl: null,
                localName: null
            };
        }
        origDecl = exportDecl.declaration;
        localName = exportDecl.declaration.type === "VariableDeclaration" ? exportDecl.declaration.declarations[0].id.name : exportDecl.declaration.id.name;
    }

    return {
        origDecl,
        localName
    }
}


function getLocationOfDecl(decl)
{
    return decl.type === "VariableDeclaration" ?
        decl.declarations[0].loc :
        decl.loc;
}


async function resolveDocs(indexPath, moduleAST, docs, groups)
{
    for (let i = 0; i < docs.length; i++)
    {
        const doc = docs[i];
        const { name } = doc;

        const imp = resolveImport(moduleAST, doc);

        const { imported, source } = imp;

        doc.source = getProjectRelativeSourcePath(resolveRelative(indexPath, source));
        doc.group = determineType(doc);


        let code = null, dependencyAST = null;
        if (!groups || groups.indexOf(doc.group) >= 0)
        {
            const sourcePath = resolveRelative(indexPath, source) + ".js";
            ({code, moduleAST: dependencyAST} = await loadSource(sourcePath));

            let reactDocGen = null;
            if (doc.group === Group.COMPONENT)
            {
                try
                {
                    reactDocGen = undefinedsToNull(reactDocGenParse(code));
                } catch (e)
                {
                    console.log("ReactDoc parse error on file " + sourcePath, e);
                }
            }
            else
            {
                reactDocGen = null;
            }

            doc.description = null;
            doc.reactDocGen = reactDocGen;



            const exportDecl = findExport(dependencyAST, imported);

            if (!exportDecl)
            {
                console.log("No exportDecl for", name);
            }


            if (exportDecl)
            {
                const isDefaultExport = exportDecl.type === "ExportDefaultDeclaration";
                // process comments directly on export
                if (isDefaultExport)
                {
                    if (exportDecl.leadingComments && exportDecl.leadingComments.length)
                    {
                        doc.description = parseJsDoc(exportDecl.leadingComments[0].value);

                        const {start, end} = exportDecl.loc

                        doc.start = start.line;
                        doc.end = end.line;
                    }
                }
                else
                {
                    if (exportDecl.leadingComments && exportDecl.leadingComments.length)
                    {
                        doc.description = parseJsDoc(exportDecl.leadingComments[0].value);

                        const {start, end} = exportDecl.loc

                        doc.start = start.line;
                        doc.end = end.line;
                    }
                }

                // find original declaration
                const { origDecl, localName } = findDeclarationOfExport(dependencyAST, exportDecl);

                //console.log('localName', localName);

                if (origDecl)
                {
                    if (!doc.description)
                    {
                        // description on default export has precedence over the one on the declaration
                        if (origDecl.leadingComments && origDecl.leadingComments.length)
                        {
                            doc.description = parseJsDoc(origDecl.leadingComments[0].value);
                        }
                    }

                    const { start, end } = getLocationOfDecl(origDecl)

                    doc.start = start.line;
                    doc.end = end.line;

                    //console.log(origDecl.type, doc.name)
                    if (origDecl.type === "ClassDeclaration")
                    {
                        const {body} = origDecl.body;

                        doc.members = [];

                        for (let j = 0; j < body.length; j++)
                        {
                            const {type, key, leadingComments} = body[j];

                            if (key && leadingComments && leadingComments.length)
                            {
                                doc.members.push({
                                    type,
                                    name: key.name,
                                    description: parseJsDoc(leadingComments[0].value),
                                    decorators: body[j].decorators && body[j].decorators.length ?
                                        body[j].decorators.map(d => d.expression.name) :
                                        []
                                })
                            }
                        }
                    }

                    if (origDecl.type === "VariableDeclaration" && origDecl.declarations[0].init.type === "ObjectExpression")
                    {

                        const {properties} = origDecl.declarations[0].init;

                        doc.members = [];

                        for (let j = 0; j < properties.length; j++)
                        {
                            const {value: {type}, key, leadingComments} = properties[j];

                            if (key && leadingComments && leadingComments.length)
                            {
                                doc.members.push({
                                    type,
                                    name: key.name,
                                    description: parseJsDoc(leadingComments[0].value)
                                })
                            }
                        }
                    }

                    if (doc.group === Group.COMPONENT)
                    {
                        const expr = dependencyAST.program.body.find(n => n.type === "ExpressionStatement");

                        if (
                            expr && expr.expression.type === "AssignmentExpression" &&
                            expr.expression.left.type === "MemberExpression" &&
                            expr.expression.left.object.type === "Identifier" &&
                            expr.expression.left.property.type === "Identifier" &&
                            expr.expression.right.type === "Identifier" &&
                            expr.expression.left.object.name === localName)
                        {

                            const subName = expr.expression.right.name;
                            const exportedName = expr.expression.left.property.name;

                            //console.log("REACTDOC", exportedName, subName)
                        }
                    }
                }

                if (doc.description)
                {
                    const categoryTag = doc.description.tags.find(t => t.title === "category");
                    doc.category = categoryTag ? categoryTag.description : null;
                }
                else
                {
                    doc.category = null;
                }
            }
        }
    }

    docs.sort((a, b) => {
        return a.name.localeCompare(b.name);

    })

    //console.log("DOCS", getData())

    return docs;
}


function isUpperCase(name)
{
    return name[0] === name[0].toLocaleUpperCase();
}


function determineType(doc)
{
    const {name, source} = doc;
    return config.groupOverrides[name] || (
        source.indexOf("src/ui") === 0 ? Group.COMPONENT :
            isUpperCase(name[0]) ? Group.CLASS :
                name.indexOf("use") === 0 ? Group.HOOK : Group.FUNCTION
    );
}

const categoryPages = {
    websocket: "websocket",
    domain: "domain",
    declarative: "declarative-api",
    config: "config",
    schema: "schema",
    process: "process",
    iquery: "iquery",
}

function getLink(type, name, category)
{
    switch (type)
    {
        case Group.COMPONENT:
        case Group.HOOK:
            return "component#" + name;
        case Group.CLASS:
            return "class#" + name;
        case Group.FUNCTION:
            return (categoryPages[category] || "misc") + "#" + name;
        case Group.UTIL:
            return (categoryPages[category] || "misc") + "#" + name;
        default:
            throw new Error("Unhandled Type: " + type)

    }
}


function getLinks(docsArray, type)
{
    return docsArray.filter(doc => doc.group === type)
        .map(doc => doc.name);
}


function postProcess(docsArray, markdownSnippets)
{
    const docs = {};
    docsArray.forEach(doc => {
        doc.link = getLink(doc.group, doc.name, doc.category)
        delete doc.local;

        docs[doc.name] = doc;
    });

    return {
        docs,
        components: getLinks(docsArray, Group.COMPONENT),
        hooks: getLinks(docsArray, Group.HOOK),
        classes: getLinks(docsArray, Group.CLASS),
        utils: getLinks(docsArray, Group.UTIL),
        functions: getLinks(docsArray, Group.FUNCTION),
        handwritten: processMarkdownSnippets(markdownSnippets)
    }
}


export async function loadDocs(indexPath, groups)
{
    const {moduleAST} = await loadSource(indexPath);

    //console.log("FINAL CONFIG", JSON.stringify(config, null, 4))

    const namedExport = moduleAST.program.body.find(n => n.type === "ExportNamedDeclaration");

    const exported = namedExport.specifiers
        .filter(specifier => specifier.exported.name !== "AutomatonDevTools" )//&& specifier.exported.name !== "FilterDSL")
        .map(specifier => ({
            name: specifier.exported.name,
            local: specifier.local.name,
            source: "",
            description: "",
        }));

    const docs = await resolveDocs(
            indexPath,
            moduleAST,
            exported,
            groups
        )
    //logUndefined(getData());
    const snippets = await loadSnippets(docs);
    return postProcess(docs, snippets);

}


export async function getDocsData(groups = false)
{
    if (!docsData)
    {
        const path = require("path");

        const indexPath = path.resolve(process.cwd(), "../../src/index.js");

        //console.log("Load ", indexPath);

        docsData = await loadDocs(indexPath, groups);

        //console.log("docsData", getData())

        const logPath = path.resolve(process.cwd(), "./.next/automaton-js-docs.json");
        try
        {
            await fs.writeFile(
                logPath,
                JSON.stringify(docsData, null, 4),
                "utf8"
            )
        }
        catch(e)
        {
            throw new Error("Error writing data log to " + logPath + ": " + e);
        }

    }
    return docsData;
}


export async function getPageDefaults(dataIn, groups = false, category = false, markdowns = [])
{

    const defaults = {
        props: {
            ...dataIn,
            docs: await getDocsData(groups)
        }
    };

    return filterPageDefaults(defaults, groups, category, markdowns);
}


