const glob = require('@actions/glob');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require("path");

module.exports = class Confluence {

    constructor(username, password, url) {
        this.username = username;
        this.password = password;
        this.url = url;
    }

    async attachments(contentId, filePattern, labels) {
        // define headers
        const headers = {
            'X-Atlassian-Token': 'nocheck',
            'Authorization': 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64'),
            'Content-Type': 'application/json'
        };

        // delete old files
        const attachmentsResp = await (await fetch(this.url + "/rest/api/content/" + contentId + "/child/attachment", {
            method: 'GET',
            headers: headers
        }));
        if (attachmentsResp.status === 401) {
            throw new Error("Authentication failed. Check your credentials.");
        }
        const attachments = attachmentsResp.json();

        for (const attachment of attachments.results) {
            const resp = await (await fetch(this.url + "/rest/api/content/" + attachment.id + "/label", {
                method: 'GET',
                headers: headers
            })).json();

            const labelsAttachment = [];

            for (const result of resp.results) {
                labelsAttachment.push(result.name)
            }

            if (labelsAttachment.length > 0 && labelsAttachment.every(v => labels.includes(v))) {
                await fetch(this.url + "/rest/api/content/" + attachment.id, {method: 'DELETE', headers: headers});
                await fetch(this.url + "/rest/api/content/" + attachment.id + "?status=trashed", {
                    method: 'DELETE',
                    headers: headers
                });
                console.log("Attachment " + attachment.name + " has been deleted.")
            }
        }

        // upload files
        const globber = await glob.create(filePattern)

        for await (const file of globber.globGenerator()) {
            console.log("Upload " + file);

            const fd = new FormData();
            fd.append('file', fs.readFileSync(file), path.basename(file));

            return fetch(this.url + '/rest/api/content/' + contentId + '/child/attachment', {
                method: 'POST',
                headers: {
                    'X-Atlassian-Token': 'nocheck',
                    'Authorization': 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64')
                },
                body: fd
            })
                .then(res => res.json())
                .then(json => {

                    if (json.statusCode === 400) {
                        throw new Error(json.message)
                    }

                    // create body
                    const body = [];

                    for (let label of labels) {
                        body.push({
                            "prefix": "global",
                            "name": label.trim(),
                        });
                    }

                    // make REST cal
                    const attachmentId = json.results[0].id;

                    fetch(this.url + '/rest/api/content/' + attachmentId + '/label', {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(body)
                    })
                        .then(res => res.json())
                        .then(json => console.log(json));
                })
        }

    }

}