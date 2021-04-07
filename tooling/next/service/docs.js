import { promises as fs } from "fs"
import path from "path"
import { parse as doctrineParse, unwrapComment } from "doctrine"
import { parse as reactDocGenParse } from "react-docgen"

import config from "../automaton-js-doc.config"
import DocType from "./DocType";
import { loadSnippets, processMarkdownSnippets } from "./markdown";
import loadSource from "./loader";

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


function undefinedsToNull(obj)
{
    if (obj === undefined)
    {
        return null;
    }

    if (Array.isArray(obj))
    {
        if (!obj.length)
        {
            return [];
        }

        const newArray = new Array(obj.length);
        for (let i = 0; i < obj.length; i++)
        {
            const elem = obj[i];
            newArray[i] = undefinedsToNull(elem);
        }
        return newArray;
    }
    else if (obj && typeof obj === "object")
    {
        let newObj = {};
        for (let name in obj)
        {
            if (obj.hasOwnProperty(name))
            {
                newObj[name] = undefinedsToNull(obj[name]);
            }
        }
        return newObj;
    }
    return obj;
}


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


async function resolveDocs(indexPath, moduleAST, docs)
{
    for (let i = 0; i < docs.length; i++)
    {
        const doc = docs[i];
        const { name } = doc;

        const isHit = name === "graphql";

        const imp = resolveImport(moduleAST, doc);

        const { imported, source } = imp;

        doc.source = getProjectRelativeSourcePath(resolveRelative(indexPath, source));
        doc.type = determineType(doc);

        const sourcePath = resolveRelative(indexPath, source) + ".js";
        const {code, moduleAST: dependencyAST} = await loadSource(sourcePath);

        let reactDocGen = null;
        if (doc.type === DocType.COMPONENT)
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

                if (doc.type === DocType.COMPONENT)
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

                        console.log("REACTDOC", exportedName, subName)
                    }
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
    return config.docTypeOverrides[name] || (
        source.indexOf("src/ui") === 0 ? DocType.COMPONENT :
            isUpperCase(name[0]) ? DocType.CLASS :
                name.indexOf("use") === 0 ? DocType.HOOK : DocType.FUNCTION
    );
}


function getLink(type, name)
{
    switch (type)
    {
        case DocType.COMPONENT:
        case DocType.HOOK:
            return "component#" + name;
        case DocType.CLASS:
            return "class#" + name;
        case DocType.FUNCTION:
            return "misc#" + name;
        case DocType.UTIL:
            return "misc#" + name;
        default:
            throw new Error("Unhandled Type: " + type)

    }
}


function getLinks(docsArray, type)
{
    return docsArray.filter(doc => doc.type === type)
        .map(doc => doc.name);
}


function postProcess(docsArray, markdownSnippets)
{
    const docs = {};
    docsArray.forEach(doc => {
        doc.link = getLink(doc.type, doc.name)

        docs[doc.name] = doc;
    });

    return {
        docs,
        components: getLinks(docsArray, DocType.COMPONENT),
        hooks: getLinks(docsArray, DocType.HOOK),
        classes: getLinks(docsArray, DocType.CLASS),
        utils: getLinks(docsArray, DocType.UTIL),
        functions: getLinks(docsArray, DocType.FUNCTION),
        handwritten: processMarkdownSnippets(markdownSnippets)
    }
}


export async function loadDocs(indexPath)
{
    const {moduleAST} = await loadSource(indexPath);

    //console.log("FINAL CONFIG", JSON.stringify(config, null, 4))

    const namedExport = moduleAST.program.body.find(n => n.type === "ExportNamedDeclaration");

    const exported = namedExport.specifiers
        .filter(specifier => specifier.exported.name !== "AutomatonDevTools" && specifier.exported.name !== "FilterDSL")
        .map(specifier => ({
            name: specifier.exported.name,
            local: specifier.local.name,
            source: "",
            description: "",
        }));

    const docs = await resolveDocs(
        indexPath,
        moduleAST,
        exported
    )

    //logUndefined(getData());

    const snippets = await loadSnippets(docs);

    return postProcess(docs, snippets);

}


export async function getPageDefaults(dataIn)
{
    if (!docsData)
    {
        try
        {
            const path = require("path");

            const indexPath = path.resolve(process.cwd(), "../../src/index.js");

            docsData = await loadDocs(indexPath);


            await fs.writeFile(
                path.resolve(process.cwd(), "./.next/automaton-js-docs.json"),
                JSON.stringify(docsData, null, 4),
                "UTF-8"

            )
            //console.log("docsData", getData())

        } catch (e)
        {
            console.error("Error loading docsData", e)
        }
    }

    return {
        props: {
            ...dataIn,
            docs: docsData
        }
    };
}

