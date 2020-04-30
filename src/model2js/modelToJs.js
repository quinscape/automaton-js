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
        console.log(internalPath);
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
        let content ="";

        //render the import statment for all files
        content = convertImportStatment(jsonData,content)

        let fileConfig = null;

        if (isDomain) {
            fileConfig= convertDomainModel(jsonData, shortName,content);
        }
        else if (processName != null) {

            if (isComposite) {
                fileConfig=convertComposite(jsonData, processName, shortName,content);
            } else {
                fileConfig=convertProcessExport(jsonData, processName, shortName,content);
            }
        }
        else {
            fileConfig=convertMisc(jsonData, shortName,content);
        }

        //console.log({appName, processName,shortName, isComposite});
        fs.writeFile(fileConfig.path, fileConfig.content, (err) => {
            if (err) console.log("\x1b[41m",err,"\x1b[0m") ;
        })
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

function convertImportStatment({importDeclarations},content){
    try {
        content += renderImportStatements(importDeclarations);
    }catch (err) {
        console.error("\x1b[41m", `Error: something wrong`,err, "\x1b[0m")
    }
    return content
}

function convertDomainModel({domain }, shortName,content) {
    const path = `${shortPath}/domain/${shortName}.js`
    try {
        content += renderDomainScript(domain)

    } catch(err){
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }
    return {
        path,
        content
    };
}

function convertComposite({export: componentName, composite, extraConstants }, processName, shortName,content) {
    const path = `${shortPath}/processes/${processName}/composites/${shortName}.js`
    try {
        if (extraConstants) {
            content += renderExtraConstantsScript(extraConstants)
        }

        if (composite) {
            content += renderCompositeScript(composite, shortName)
        }
        content += `export default ${componentName}`;

    } catch (err) {
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }
    return {
        path,
        content: content
    };
}

function convertProcessExport({processExports, query }, processName, shortName,content) {
    let path ='' ;
    try {
        if (query) {
            path = `${shortPath}/processes/${processName}/queries/${shortName}.js`
            content += renderQueryScript(query)
        }
        else {
            path = `${shortPath}/processes/${processName}/${shortName}.js`
            content += renderProcessExportScript(processExports)
        }
    } catch (err) {
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }

    return {
        path,
        content
    };
}

function convertMisc({userScope, query }, shortName,content) {
    let path ='';

    try {
        if (query) {
            path = `${shortPath}/queries/${shortName}.js`
            content += renderQueryScript(query)
        }
        else if(userScope) {
            path = `${shortPath}/${shortName}.js`
            content += renderUserScopeScript(userScope)
        }
        else {
            throw new Error("queries or user scope are undefined")
        }
    }catch (err) {
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }

    return {
        path,
        content
    };
}
