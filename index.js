const express = require('express');
const cors = require('cors');
const util = require('util');
const cRequest = require('request');
const bodyParser = require('body-parser');
const request = util.promisify(cRequest);
const { graphql } = require('@octokit/graphql');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const weatherURL =
  'http://api.openweathermap.org/data/2.5/forecast?units=imperial';

app.get('/', async (req, res) => {
  const { repository } = await graphql(
    `
      query lastIssues($owner: String!, $repo: String!, $num: Int = 3) {
        repository(owner: $owner, name: $repo) {
          issues(last: $num) {
            edges {
              node {
                title
                body
                createdAt
              }
            }
          }
        }
      }
    `,
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      headers: {
        authorization: `token ${process.env.ACCESS_TOKEN}`
      }
    }
  );
  const result = repository.issues.edges.map(edge => ({
    title: edge.node.title,
    body: edge.node.body,
    createdAt:
      new Date(edge.node.createdAt).toDateString() +
      ' ' +
      new Date(edge.node.createdAt).toLocaleTimeString()
  }));
  res.json(result);
});

app.post('/', async (req, res) => {
  try {
    await graphql(
      `
        mutation createIssue ($repoId: String!, $title: String!) {
          createIssue(input: { repositoryId: $repoId, title: $title }) {
            issue {
              id
            }
          }
        }
      `,
      {
        repoId: process.env.REPO_ID,
        title: req.body.title,
        headers: {
          authorization: `token ${process.env.ACCESS_TOKEN}`
        }
      }
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});

app.get('/weather/:city', async (req, res) => {
  console.log(process.env);
  const result = await request(
    weatherURL +
      '&q=' +
      req.params.city +
      '&appid=' +
      process.env.WEATHER_API_KEY
  );
  res.json(JSON.parse(result.body));
});

app.listen(process.env.PORT || 4000, () => {
  console.log('Listening on port 4000');
});
