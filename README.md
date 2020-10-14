# Confluence Upload Action
This action can be used to upload and label an artifact in Confluence.

## Usage

```yml
- name: Confluence Upload
  uses: cip4/action-confluence-upload@main
  with:
    # Confluence Server URL
    url: 'https://confluence.cip4.org'
    
    # Username of Confluence Service Account which is used to update the artifact
    username: ${{ secrets.CONFLUENCE_USER }}
    
    # Password of Confluence Service Account which is used to update the artifact
    password: ${{ secrets.CONFLUENCE_PASSWORD }}
    
    # The pageId of the target confluence page
    contentId: 15663320
    
    # The attachements label on confluence - comma separated. (Same labels are going to be replaced during upload)
    label: 'my-label,label-2'
    
    # The glob pattern identifying the files to be uploaed
    filePattern: '**/*.txt'
```
