import assert from "power-assert"
import tmp from "tmp";
import path from "path";
import fs from "fs";
import shelljs from "shelljs";
import SimpleGit from "simple-git";

import React from "react"
import hasOpenGitChanges from "../../src/model2js/hasOpenGitChanges";


function configureRepoUser(git, cb)
{
    git.raw(
        [
            "config",
            "user.name",
            "Erika Mustermann"
        ], (err, result) => {

            if (err)
            {
                throw err;
            }

            git.raw(
                [
                    "config",
                    "user.email",
                    "test@example.org"
                ], cb
            )
        })
}


describe("hasOpenChanges", function (done) {

    let tmpDir;
    let git;
    let repoPath;
    let appPath;

    // Before all tests, we set up a temporary git repository with one commit by "Erika Mustermann <test@example.org>"
    before((done) => {

        //console.log("PREPARE");
        
        tmpDir = tmp.dirSync();
        repoPath = tmpDir.name;

        git = SimpleGit(repoPath);

        git.init(false, err => {

            if (err)
            {
                throw err;
            }

            configureRepoUser(git, (err, result) => {

                if (err)
                {
                    throw err;
                }

                appPath = path.join(repoPath, "src/main/js/apps/test");
                shelljs.mkdir(
                    "-p",
                    appPath
                );

                fs.writeFileSync(
                    path.join(appPath, "test-startup.js" ),
                    "// Dummy startup file",
                    "UTF-8"
                );

                git.add(["src/main/js/apps/test/test-startup.js"], err => {
                    if (err)
                    {
                        throw err;
                    }


                    git.commit("Commit Startup", err => {

                        done();
                    })
                })

            })


        });
    });

    // before every test we also do a "git reset --hard" on our test repo to start over
    beforeEach(
        done =>  {

            git.reset("hard", (err, result) => {
                if (err)
                {
                    throw err;
                }
                done();
            })
        }
    )
    
    after(() => {
        tmpDir.removeCallback();
    });

    it("determines open git changes within a sub directory", function (done) {

        // just resetted repo is clean
        hasOpenGitChanges(repoPath)
            .then( hasChanges => {

                assert(!hasChanges);

            })
            .then(done);
    });
    it("detects modifications", function (done) {

        // change only file in repo
        fs.writeFileSync(
            path.join(appPath, "test-startup.js"),
            "// Changed startup file",
            "UTF-8"
        );

        hasOpenGitChanges(repoPath)
            .then( hasChanges => {

                assert(hasChanges);

            })
            .then(done);
    });
    it("detects deletions", function (done) {

        // delete only file in repo
        shelljs.rm(
            path.join(appPath, "test-startup.js" )
        );

        hasOpenGitChanges(repoPath)
            .then( hasChanges => {

                assert(hasChanges);

            })
            .then(done);
    });

    it("detects renames", function (done) {

        // rename only file in repo
        shelljs.mv(
            path.join(appPath, "test-startup.js" ),
            path.join(appPath, "test-startup2.js" )
        );

        hasOpenGitChanges(repoPath)
            .then( hasChanges => {

                assert(hasChanges);

            })
            .then(done);
    });

    it("detects untracked files", function (done) {

        // add untracked file to repo
        fs.writeFileSync(
            path.join(appPath, "untracked.js"),
            "// Untracked file",
            "UTF-8"
        );

        hasOpenGitChanges(repoPath)
            .then( hasChanges => {

                assert(hasChanges);

            })
            .then(done);
    });
});
