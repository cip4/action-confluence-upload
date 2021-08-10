const core = require('@actions/core');
const confluence = require('./Confluence')

// intput params
const url = core.getInput('url');
const username = core.getInput('username');
const password = core.getInput('password');
const contentId = core.getInput('contentId');
const labels = core.getInput('label').split(",");
const filePattern = core.getInput('filePattern');

const co = new confluence(username, password, url);
co.attachments(contentId, filePattern, labels)
