const core = require('@actions/core');
const attachments = require("./attachments");


// intput params
const url = core.getInput('url');
const username = core.getInput('username');
const password = core.getInput('password');
const contentId = core.getInput('contentId');
const labels = core.getInput('label').split(",");
const filePattern = core.getInput('filePattern');

await attachments(
    username,
    password,
    url,
    contentId,
    filePattern,
    labels
).catch(err => core.setFailed(err))
