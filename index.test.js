const attachment = require('./attachments')
const process = require('process');
const cp = require('child_process');
const path = require('path');

test('dummy test', async () => {
  await expect(attachment()).rejects.toThrow('Not implemented');
});