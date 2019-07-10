const SimpleGit = require("simple-git");

/**
 * Resolves to true if the given git repository has open changes within the given path.
 *
 * @param {String} repoPath     git repository path
 * @param {String} [path]       optional path within the git repository (default is the apps directory = "src/main/js/apps")
 * 
 * @return {Promise<boolean|*>}
 */
export default function hasOpenGitChanges(repoPath, path = "src/main/js/apps")
{
    const git = SimpleGit(repoPath);

    return new Promise((resolve, reject) => {

        git.status((err, result) => {
            if (err)
            {
                reject(err);
            }
            else
            {

                let changes = result.files
                    .map(
                        f => f.path
                    );


                if (path)
                {
                     changes = changes.filter(
                        p => p.indexOf(path) === 0
                    );
                }


                //console.log("Open Changes in " + repoPath + ": " + changes);

                resolve(changes.length > 0);
            }
        })
    })
}
