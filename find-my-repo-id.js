require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const { graphql } = require('@octokit/graphql');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Github owner? (Silvershot) ', owner => {
  rl.question('Repository name? ', repoName => {
    console.log(repoName, owner);
    graphql(
      `
        query getRepoId($name: String!, $owner: String!) {
          repository(name: $name, owner: $owner) {
            id
          }
        }
      `,
      {
        name: repoName,
        owner: owner || 'Silvershot335',
        headers: {
          authorization: `token ${process.env.ACCESS_TOKEN}`
        }
      }
    ).then(res => {
      fs.writeFileSync('./repoid.txt', res.repository.id, {
        encoding: 'utf-8'
      });
      rl.close();
    });
  });
});
