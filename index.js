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
const labels = core.getInput('label').split(",");
const filePattern = core.getInput('filePattern');

const checkStatus = response => {
    if (response.ok) {
        // response.status >= 200 && response.status < 300
        return response;
    } else {
        const message = `HTTP Error Response: ${response.status} ${response.statusText}`;
        console.trace(message);
        core.setFailed(message);
    }
}

async function run() {

    // define headers
    const headers = {
        'X-Atlassian-Token': 'nocheck',
        'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
        'Content-Type': 'application/json'
    };

    // delete old files
    const attachments = await (await fetch(url + "/rest/api/content/" + contentId + "/child/attachment", { method: 'GET', headers: headers })).json();
    if (attachments.message) {
        return core.setFailed(attachments.message);
    }

    for (const attachment of attachments.results) {
        const resp = await (await fetch(url + "/rest/api/content/" + attachment.id + "/label", { method: 'GET', headers: headers })).json();
        if (resp.message) {
            return core.setFailed(resp.message);
        }
        
        const labelsAttachment = [];

        for(const result of resp.results) {
            labelsAttachment.push(result.name)
        }

        if (labelsAttachment.length > 0 && labelsAttachment.every(v => labels.includes(v))) {
            await fetch(url + "/rest/api/content/" + attachment.id, { method: 'DELETE', headers: headers })
                .then(res => checkStatus(res));
            await fetch(url + "/rest/api/content/" + attachment.id + "?status=trashed", { method: 'DELETE', headers: headers })
                .then(res => checkStatus(res));
            console.log("Attachment " + attachment.name + " has been deleted.")
        }
    }

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
            .then(res => checkStatus(res))
            .then(res => res.json())
            .then(json => {


                // create body
                const body = [];

                for(var label of labels) {
                    body.push({ 
                        "prefix" : "global",
                        "name" : label.trim(),
                    });
                }

                // make REST cal
                const attachmentId = json.results[0].id;

                fetch(url + '/rest/api/content/' + attachmentId + '/label', { method: 'POST', headers: headers, body: JSON.stringify(body) })
                    .then(res => res.json())
                    .then(json => console.log(json))
            })
    }
}


try {
    run();
} catch (error) {
    core.debug(error.stack);
    core.setFailed(error);
}
