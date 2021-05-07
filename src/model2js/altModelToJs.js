import path from "path"
import recursiveReadDir from "recursive-readdir"
import matchPath from "../matchPath";
import fs from  "fs"
import {
    renderImportStatements,
    renderDomainScript,
    renderQueryScript,
    renderUserScopeScript,
    renderSessionScopeScript,
    renderProcessExportScript,
    renderCompositeScript,
    renderExtraConstantsScript,
    modelSchemaValidation} from "./altHandleModelToJs";

const MODEL_PATH = "./src/main/webapp/WEB-INF/automaton/apps";
const APPS_INFIX = "/apps/";
const shortPath = './src/main/js/apps/alt-model-to-js'

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

//delete main folder always before start the process
let deleteFolderRecursive;

(deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).map((fileName) => {
            let curPath = path + "/" + fileName

            if (fs.lstatSync(curPath).isDirectory()) {
                //delete subdirectory
                deleteFolderRecursive(curPath)
            } else {
                //delete file
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
})(shortPath)

recursiveReadDir(MODEL_PATH, ["!*.json","**/lisa-web/meta"], function (err, fileNames) {

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

        //start schema validation
        const isSchemaValid = modelSchemaValidation(jsonData)
        if(!isSchemaValid){
            continue
        }

        //render the import statment for all files
        content = convertImportStatment(jsonData,content)
        //render the rest content for all files
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
            if (err) console.log("\x1b[36m",err,"\x1b[0m") ;
        })
    }
});

//for error cyan color
function createProjectFolders(processName) {

    if (!fs.existsSync(`${shortPath}`)) {
        fs.mkdirSync(`${shortPath}`)
    }
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
        console.error("\x1b[36m", `Error: something wrong`,err, "\x1b[0m")
    }
    return content
}

function convertDomainModel({domain }, shortName,content) {
    const path = `${shortPath}/domain/${shortName}.js`
    try {
        content += renderDomainScript(domain)

    } catch(err){
        console.error("\x1b[36m", `Error: ${path}`,err, "\x1b[0m")
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
        console.error("\x1b[36m", `Error: ${path}`,err, "\x1b[0m")
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
        console.error("\x1b[36m", `Error: ${path}`,err, "\x1b[0m")
    }

    return {
        path,
        content
    };
}

function convertMisc({userScope, query, sessionScope }, shortName,content) {
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
        else if(sessionScope) {
            path = `${shortPath}/${shortName}.js`
            content += renderSessionScopeScript(sessionScope)
        }
        else {
            throw new Error("queries or user scope are undefined")
        }
    }catch (err) {
        console.error("\x1b[36m", `Error: ${path}`,err, "\x1b[0m")
    }

    return {
        path,
        content
    };
}