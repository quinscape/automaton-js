import config from "./config"
import {
    toJS,
    set,
    runInAction
} from "mobx"


const wasCalled = {};


export function serverSync(name, scope, uri)
{
    //console.log("serverSync", { scope, uri });
    try
    {

        const {csrfToken} = config;

        const json = JSON.stringify(
            toJS(scope)
        );

        const calledOnce = wasCalled[name];

        //console.log("lastSync", calledOnce, "JSON", json);

        if (!calledOnce)
        {
            wasCalled[name] = true;

            //console.log("Ignoring first sync");
        }
        else
        {
            return fetch(
                window.location.origin + uri,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "text/plain",

                        // spring security enforces every POST request to carry a csrf token as either parameter or header
                        [csrfToken.header]: csrfToken.value
                    },
                    body: json
                }
            )
                .then(response => response.json())
                .then(
                    ({error}) => {
                        if (error)
                        {
                            return Promise.reject(error);
                        }
                    }
                );
        }
    }
    catch (e)
    {
        console.error("Error in serverSync", e);
    }
}


export function storageSync(name, scope, storage)
{
    const json = JSON.stringify(
        toJS(scope)
    );

    storage.setItem("automaton-" + name, json);
}


export function syncFromStorage(name, scope, storage)
{
    //console.log("syncFromStorage", {name, scope, storage});

    const json = storage.getItem("automaton-" + name);
    if (json)
    {
        const obj = JSON.parse(json);
        return syncFrom(name, scope, obj)
    }
    return false;
}


export function syncFrom(name, scope, obj)
{
    if (obj && typeof obj === "object")
    {
        runInAction(() => {
            for (let name in obj)
            {
                if (obj.hasOwnProperty(name))
                {
                    set(scope, name, obj[name]);
                }
            }
        });
        return true;
    }
    return false;
}

