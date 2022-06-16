#!/usr/bin/env node
import path from "path"
import recursiveReadDir from "recursive-readdir"
import matchPath from "../matchPath";
import fs from  "fs"

/**
 * import all functions that responsible for convert the Json content to Js content and also validation function
 */
import {
    renderImportStatements,
    renderDomainScript,
    renderQueryScript,
    renderUserScopeScript,
    renderSessionScopeScript,
    renderProcessExportScript,
    renderStateScript,
    renderExtraConstantsScript,
    modelSchemaValidation,
    renderCopyRights} from "./handleModelToJs";

const MODEL_PATH = "./src/main/webapp/WEB-INF/automaton/apps";
const APPS_INFIX = "/apps/";
const shortPath = './src/main/js/apps/model-to-js'

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

/**
 * delete main folder always before start a new process using Self-Invoking Function
 */
let deleteFolderRecursive;

(deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).map((fileName) => {
            let curPath = path + "/" + fileName

            if (fs.lstatSync(curPath).isDirectory()) {

                /**
                 * delete subdirectory
                 */
                deleteFolderRecursive(curPath)
            } else {
                /**
                 * delete file
                 */
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

        /**
         *
         * @param {string} processName - the name of each process.
         * @param {string} shortName - the name of the file.
         * @param {boolean} isDomain - check if the path origin from domain or not.
         * @param {boolean} isQuery - check if the path origin from query or not.
         * @param {boolean} isState - check if the path origin from state or not.
         */
        const {processName, shortName, isDomain,isQuery,isState} = matchPath(inAppPath);

        /**
         * create the folders of the project before we start the model2js process
         */
        createProjectFolders(processName)

        let fileName = fileNames[i]
        let fileData = fs.readFileSync(fileName, "utf8");

        /**
         * convert the content to Json
         * @type {any}
         */
        let jsonData = JSON.parse(fileData);

        /**
         * empty variable that will hold all the result of the model2js process
         * @type {string} js content
         */
        let content ="";

        /**
         * expect validation for the Json schema before we start the model2js process
         * @type {boolean} jsonData - hold the json content
         */
        const isSchemaValid = modelSchemaValidation(jsonData)
        if(!isSchemaValid){
            continue
        }
        
        /**
         *render the copy rights statement and it is done for all files
         * @type {string} copy rights
         */
        content = convertCopyRights(jsonData,content)

        /**
         * render the import statements and it is done for all files
         * @type {string} import statement
         */
        content = convertImportStatment(jsonData,content)

        /**
         * represent the rest content and the path of the js content that come after the copy right and import statements
         * @type {null}
         */
        let fileConfig = null;

        if (isDomain) {
            /**
             * expect the js result for all Json files exist in domain folder
             * @type {path: string} path - the path that represent where the domain-js file should create
             * @type {content} content - the js content that come from Json file that found in domain folder
             */
            fileConfig= convertDomainModel(jsonData, shortName,content);
        }
        else if (processName != null) {

            if (isState) {
                /**
                 * expect the js result for all Json files exist in state folder
                 * @type {path: string} path - the path that represent where the state-js file should create
                 * @type {content} content - the js content that come from Json file that found in state folder
                 */
                fileConfig = convertState(jsonData, processName, shortName,content)
            }
            else if (isQuery) {
                /**
                 * expect the js result for all Json files exist in query folder
                 * @type {path: string} path - the path that represent where the query-js file should create
                 * @type {content} content - the js content that come from Json file that found in query folder
                 */
                fileConfig = convertQuery(jsonData, processName, shortName,content)
            }
            else {
                /**
                 * expect the js result for the process json file
                 * @type {path: string} path - the path that represent where the process-js file should create
                 * @type {content} content - the js content that come from process-Json file
                 */
                fileConfig=convertProcessExport(jsonData, processName, shortName,content);
            }
        }
        else {
            /**
             * expect the js result for each json file that is not from state,domain,query or process
             * @type {{path: string, content}}
             */
            fileConfig=convertMisc(jsonData, shortName,content);
        }

        console.log({appName, processName,shortName,isQuery,isState});
        /**
         * represent the final step of the model2js process which is write and create the js file.
         */
        fs.writeFile(fileConfig.path, fileConfig.content, (err) => {
            if (err) console.log("\x1b[41m",err,"\x1b[0m") ;
        })
    }
});

/**
 * represent a name
 * @param {string} processName - the name of each process.
 */
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
            fs.mkdirSync(`${shortPath}/processes/${processName}/states`)
            fs.mkdirSync(`${shortPath}/processes/${processName}/queries`)
        }
    }
}

/**
 *represent the function that add the copyrights js script to the content.
 * @param {string} copyRights - the json part of the copyrights from JsonData.
 * @param {string } content - represent the actual stand of the content.
 * @returns {content: string} - return the content updated with the copyrights js part.
 */
function convertCopyRights ({copyRights}, content) {
    try {
        content += renderCopyRights(copyRights)
    } catch (err) {
        console.error("\x1b[41m", `Error: something wrong`,err, "\x1b[0m")
    }
    return content
}

/**
 *represent the function that add the import statement js script to the content.
 * @param {string} importDeclarations - the json part of the import statement from JsonData.
 * @param {string} content - represent the actual stand of the content.
 * @returns {content: string} - return the content updated with the import statement js part.
 */
function convertImportStatment({importDeclarations},content){
    try {
        content += renderImportStatements(importDeclarations);
    }catch (err) {
        console.error("\x1b[41m", `Error: something wrong`,err, "\x1b[0m")
    }
    return content
}

/**
 *represent the function that add the domain js script to the content.
 * @param {string} domain - the json part of the domain from JsonData.
 * @param {string} shortName - the name of the file.
 * @param {string} content - represent the actual stand of the content.
 * @returns {{path: string, content: string}} - return the content updated with the domain js part.
 */
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

/**
 *represent the function that add the state js script to the content.
 * @param {string} state - the json part of the state from JsonData.
 * @param {string} extraConstants - the json part of the extra-constants from JsonData.
 * @param {string} processName - the name of each process.
 * @param {string} shortName - the name of the file.
 * @param {string} content - represent the actual stand of the content.
 * @returns {{path: string, content}} - return the content updated with the state js part.
 */
function convertState ({state, extraConstants}, processName, shortName,content) {
    const path = `${shortPath}/processes/${processName}/states/${shortName}.js`
    try {
        if (extraConstants) {
            content += renderExtraConstantsScript(extraConstants)
        }

        content += renderStateScript(state)

    } catch (err) {
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }
    return {
        path,
        content
    }
}

/**
 *represent the function that add the query js script to the content.
 * @param {string} query - the json part of the query from JsonData.
 * @param {string} processName - the name of each process.
 * @param {string} shortName - the name of the file.
 * @param {string} content - represent the actual stand of the content.
 * @returns {{path: string, content}} - return the content updated with the query js part.
 */
function convertQuery({query}, processName, shortName,content) {
    const path = `${shortPath}/processes/${processName}/queries/${shortName}.js`
    try {
        content += renderQueryScript(query)

    } catch (err) {
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }

    return {
        path,
        content
    };
}

/**
 *represent the function that add the process js script to the content.
 * @param {string} processExports - the json part of the process from JsonData.
 * @param {string} query - the json part of the query from JsonData.
 * @param {string} processName - the name of each process.
 * @param {string} shortName - the name of the file.
 * @param {string} content - represent the actual stand of the content.
 * @returns {{path: string, content}} - return the content updated with the process js part.
 */
function convertProcessExport({processExports, query }, processName, shortName,content) {
    const path = `${shortPath}/processes/${processName}/${shortName}.js`
    try {
        content += renderProcessExportScript(processExports)

    } catch (err) {
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
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
        console.error("\x1b[41m", `Error: ${path}`,err, "\x1b[0m")
    }

    return {
        path,
        content
    };
}
