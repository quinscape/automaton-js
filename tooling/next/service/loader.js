import { promises as fs } from "fs";
import { parse } from "@babel/parser";


const cache = {};
function parseCode(code)
{
    return parse(code, {
        // parse in strict mode and allow module declarations
        sourceType: "module",

        plugins: [
            // enable jsx syntax
            "jsx",
            "classProperties",
            "decorators-legacy"
        ]
    });
}


export default async function loadSource(path)
{
    const cached = cache[path];
    if (cached)
    {
        return cached;
    }

    const code = await fs.readFile(path, "utf8");
    const moduleAST = parseCode(code);

    const result = {
        code,
        moduleAST
    };

    cache[path] = result;

    return  result
}
