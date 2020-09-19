const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const TrackUsage = require("babel-plugin-track-usage/data");
const TrackUsagePlugin = require("babel-plugin-track-usage");
const recursive = require("recursive-readdir");

const babel = require("@babel/core");

function endsWidth(file, suffix)
{
    return file.lastIndexOf(suffix) === file.length - suffix.length;
}


function extractTranslations(usages)
{
    let translations = [];

    for (let module in usages)
    {
        if (usages.hasOwnProperty(module))
        {
            const callMap = usages[module].calls;

            for (let call in callMap)
            {
                if (callMap.hasOwnProperty(call))
                {
                    const data = callMap[call];

                    translations = translations.concat(
                        data.map(a => a[0])
                    )
                }
            }
        }
    }

    translations.sort();

    return {
        keys: translations.map(t => ({
            name: t,
            source: "automaton-js"
        }))
    };
}


recursive("src", [], function (err, files) {

    // import project .babelrc
    const babelOpts = fsExtra.readJsonSync(
        path.join(__dirname, "../.babelrc"),
        "UTF-8"
    );

    // add our plugin 
    babelOpts.plugins.unshift(
        [
            TrackUsagePlugin,
            {
                "sourceRoot": "src/",
                "trackedFunctions": {
                    "I18N": {
                        "module": "./i18n",
                        "fn" : "",
                        "varArgs": true
                    }
                },
                "debug": false
            }
        ]
    )

    // delete lib/
    fsExtra.removeSync(path.join(__dirname, "../lib"))

    // transpile files
    for (let i = 0; i < files.length; i++)
    {
        const file = files[i];
        if (endsWidth(file, ".js"))
        {

            const filename = path.join(__dirname, "../", file);
            const code = fs.readFileSync(filename, "UTF-8");

            const transpiled = babel.transform(code, {
                filename,
                ... babelOpts
            });

            const target = "lib" + file.substr(3)

            //console.log("TRANSPILE", file, "to ", target);

            fsExtra.outputFileSync(target, transpiled.code, "UTF-8");

        }
    }
    const { usages } = TrackUsage.get();
    const translations = extractTranslations(usages);


    const output = path.join(__dirname, "../lib/translations.json");
    fs.writeFileSync(output, JSON.stringify(translations, null, 4), "UTF-8")
});

