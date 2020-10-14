const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require("path");


// intput params
const url = core.getInput('url');
const username = core.getInput('username');
const password = core.getInput('password');
const contentId = core.getInput('contentId');
const label = core.getInput('label');
const labelOverwrite = core.getInput('labelOverwrite');
const filePattern = core.getInput('filePattern');


async function run() {

    // define headers
    const headers = {
        'X-Atlassian-Token': 'nocheck',
        'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
        'Content-Type': 'application/json'
    };

    // delete old files
    const attachments = await (await fetch(url + "/rest/api/content/" + contentId + "/child/attachment", { method: 'GET', headers: headers })).json();

    for (const attachment of attachments.results) {
        const labels = await (await fetch(url + "/rest/api/content/" + attachment.id + "/label", { method: 'GET', headers: headers })).json();

        if (labels.results.length > 0 && labels.results[0].name == label) {
            await fetch(url + "/rest/api/content/" + attachment.id, { method: 'DELETE', headers: headers });
            console.log("Attachment " + attachment.name + " has been deleted.")
        }
    };

    // upload files
    const globber = await glob.create(filePattern)

    for await (const file of globber.globGenerator()) {
        console.log("Upload " + file);

        const fd = new FormData();
        fd.append('file', fs.readFileSync(file), path.basename(file));

        fetch(url + '/rest/api/content/' + contentId + '/child/attachment', {
            method: 'POST',
            headers: { 'X-Atlassian-Token': 'nocheck', 'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64') },
            body: fd
        })
            .then(res => res.json())
            .then(json => {


                // create body
                const arrLabel = label.split(",");

                const body = [];

                for(var lbl of arrLabel) {
                    body.push({ 
                        "prefix" : "global",
                        "name" : lbl.trim(),
                    });
                }

                // make REST cal
                const attachmentId = json.results[0].id;

                fetch(url + '/rest/api/content/' + attachmentId + '/label', { method: 'POST', headers: headers, body: JSON.stringify(body) })
                    .then(res => res.json())
                    .then(json => console.log(json))
                    .catch(err => core.setFailed(err));

            })
            .catch(err => core.setFailed(err));
    }
}


try {
    run();
} catch (error) {
    core.setFailed(error);
}