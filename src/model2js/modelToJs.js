#!/usr/bin/env node
import path from "path"
import recursiveReadDir from "recursive-readdir"
import matchPath from "../matchPath";
import {
    renderImportStatements,
    renderDomainScript,
    renderQueryScript,
    renderUserScopeScript,
    renderProcessExportScript,
    renderCompositeScript,
    renderExtraConstantsScript} from "./handleModelToJs"

const fs = require('fs');
const MODEL_PATH = "./src/main/webapp/WEB-INF/automaton/apps";
const APPS_INFIX = "/apps/";

function toInternalPath(fileName) {
    const pos = fileName.indexOf(APPS_INFIX);
    if (pos < 0) {
        return null;
    }

    return fileName.substr(pos + APPS_INFIX.length);
}

function getFirstSegment(path) {
    const pos = path.indexOf("/");
    if (pos >= 0) {
        return path.substr(0, pos);
    }

    throw new Error("Path has no slash");
}


/**
 * Replaces the OS specific file separator characters in the given path with
 * @param p         path with OS-specific separators
 * @returns {*} path with slashes
 */
function handleSlashes(p) {
    return p.replace(new RegExp("\\" + path.sep, "g"), "/")
}

recursiveReadDir(MODEL_PATH, ["!*.json"], function (err, fileNames) {

    if (err) {
        console.error(err);
        process.exit(1);
    }

    for (let i = 0; i < fileNames.length; i++) {
        const internalPath = toInternalPath(handleSlashes(fileNames[i]))
        if (internalPath === null) {
            continue;
        }

        const appName = getFirstSegment(internalPath);

        const inAppPath = "." + internalPath.substr(appName.length);
        const {processName, shortName, isDomain, isComposite} = matchPath(inAppPath);

        createProjectFolders(processName)

        let fileName = fileNames[i]
        let fileData = fs.readFileSync(fileName, "utf8");
        let jsonData = JSON.parse(fileData);

        if (isDomain) {
            convertDomainModel(jsonData, shortName);
        } else if (processName != null) {

            if (isComposite) {
                convertComposite(jsonData, processName, shortName);
            } else {
                convertProcessExport(jsonData, processName, shortName);
            }
        } else {
            convertMisc(jsonData, shortName);
        }
        //console.log({appName, domainName, processName, shortName, isComposite});
        console.log({appName, processName, shortName, isComposite});
    }

});

const shortPath = './src/main/js/apps/model-to-js'

function createProjectFolders(processName) {
    if (!fs.existsSync(`${shortPath}/domain`)) {
        fs.mkdirSync(`${shortPath}/domain`)
    }
    if (!fs.existsSync(`${shortPath}/queries`)) {
        fs.mkdirSync(`${shortPath}/queries`)
    }

    if (processName != null) {
        if (!fs.existsSync(`${shortPath}/processes`)) {
            fs.mkdirSync(`${shortPath}/processes`)
        }
        if (!fs.existsSync(`${shortPath}/processes/${processName}`)) {
            fs.mkdirSync(`${shortPath}/processes/${processName}`)
            fs.mkdirSync(`${shortPath}/processes/${processName}/composites`)
            fs.mkdirSync(`${shortPath}/processes/${processName}/queries`)
        }
    }
}

function convertDomainModel({ importDeclarations, domain }, shortName) {
    let scripts = "";
    scripts += renderImportStatements(importDeclarations)
    scripts += renderDomainScript(domain);
    
    fs.writeFile(`${shortPath}/domain/${shortName}.js`, scripts, (err) => {
        if (err) throw err;
    })
}

function convertComposite({ importDeclarations, export: componentName, composite, extraConstants }, processName, shortName) {
    let scripts = "";
    scripts += renderImportStatements(importDeclarations)

    if (extraConstants) { scripts += renderExtraConstantsScript(extraConstants) }

    if (composite) { scripts += renderCompositeScript(composite, shortName) };
    
    scripts += `export default ${componentName}`

    fs.writeFile(`${shortPath}/processes/${processName}/composites/${shortName}.js`, scripts, (err) => {
        if (err) throw err;
    })
}

function convertProcessExport({ importDeclarations, processExports, query }, processName, shortName) {
    let scripts = "";
    scripts += renderImportStatements(importDeclarations)

    if (query) {
        scripts += renderQueryScript(query)
        fs.writeFile(`${shortPath}/processes/${processName}/queries/${shortName}.js`, scripts, (err) => {
            if (err) throw err;
        })
    }
    else {
        scripts += renderProcessExportScript(processExports)
        fs.writeFile(`${shortPath}/processes/${processName}/${shortName}.js`, scripts, (err) => {
            if (err) throw err;
        })
    }
}

function convertMisc({ importDeclarations, userScope, query }, shortName) {
    let scripts = "";
    scripts += renderImportStatements(importDeclarations)

    if (query) { 
        scripts += renderQueryScript(query) 
        fs.writeFile(`${shortPath}/queries/${shortName}.js`, scripts, (err) => {
            if (err) throw err;
        })
    }
    else if(userScope) {
        scripts += renderUserScopeScript(userScope)
        fs.writeFile(`${shortPath}/${shortName}.js`, scripts, (err) => {
            if (err) throw err;
        })
    };
}
