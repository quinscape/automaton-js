#!/usr/bin/env node
import path from "path"
import recursiveReadDir from "recursive-readdir"
import matchPath from "./matchPath";

const MODEL_PATH = "./src/main/webapp/WEB-INF/automaton/apps";
const APPS_INFIX = "/apps/";

function toInternalPath(fileName)
{
    const pos = fileName.indexOf(APPS_INFIX);
    if (pos < 0)
    {
        console.log("Ignore ", fileName, " for now");
        return null;
    }

    return fileName.substr(pos + APPS_INFIX.length);
}

function getFirstSegment(path)
{
    const pos = path.indexOf("/");
    if (pos >= 0)
    {
        return path.substr(0, pos);
    }

    throw new Error("Path has no slash");
}


recursiveReadDir(MODEL_PATH, [], function (err, fileNames) {

    if (err)
    {
        console.error(err);
        process.exit(1);
    }

    for (let i = 0; i < fileNames.length; i++)
    {
        const internalPath = toInternalPath(fileNames[i])
        if (internalPath === null)
        {
            continue;
        }

        const appName = getFirstSegment(internalPath);

        const inAppPath = "." + internalPath.substr(appName.length);
        const { processName, shortName, isDomain, isComposite } = matchPath(inAppPath);

        if (isDomain)
        {
            convertDomainModel(internalPath);
        }
        else if (processName != null)
        {
            if (isComposite)
            {
                convertComposite(internalPath);
            }
            else
            {
                convertProcessExport(internalPath);
            }
        }
        else
        {
            convertMisc(internalPath);
        }


        //console.log({appName, domainName, processName, shortName, isComposite});

    }

});

function convertDomainModel(internalPath)
{
    console.log("convertDomainModel", internalPath)
}

function convertComposite(internalPath)
{
    console.log("convertComposite", internalPath)
}

function convertProcessExport(internalPath)
{
    console.log("convertProcessExport", internalPath)
}

function convertMisc(internalPath)
{
    console.log("convertMisc", internalPath)
}
