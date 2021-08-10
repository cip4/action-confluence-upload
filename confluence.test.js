const Confluence = require('./Confluence')

test('dummy test', async () => {
  await expect(new Confluence().attachments()).rejects.toThrow('Not implemented');
});

test('attach README to sandbox page', async () => {
  const confluence = new Confluence(
      process.env.ATLASSIAN_USER,
      process.env.ATLASSIAN_PASSWORD,
      'https://cip4.atlassian.net/wiki'
  );
  await confluence.attachments(1377338047, 'README.MD', ['test-snapshot','snapshot']);
})