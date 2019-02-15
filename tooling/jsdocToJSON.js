const {exec} = require("child_process");

const tempy = require("tempy");
const fs = require("fs");

const tmpFile = tempy.file({extension: "json"});

module.exports = function () {
    return new Promise((resolve, reject) => {

        exec("./node_modules/.bin/jsdoc --template ./node_modules/jsdoc-json --destination " + tmpFile + " --recurse src", (err, stdout, stderr) => {
            if (err)
            {
                console.error("ERROR", err);
                reject();
            }

            fs.readFile(tmpFile, "UTF-8", (err, result) => {

                if (err)
                {
                    reject(err)
                }
                else
                {
                    resolve(JSON.parse(result))
                }
            });
        });
    })
};




