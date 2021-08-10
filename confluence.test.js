const Confluence = require('./Confluence')

test('attach README to sandbox page', async () => {
  const confluence = new Confluence(
      process.env.ATLASSIAN_USER,
      process.env.ATLASSIAN_TOKEN,
      'https://cip4.atlassian.net/wiki'
  );
  await confluence.attachments(1377338047, 'README.MD', ['test-snapshot','snapshot']);
})