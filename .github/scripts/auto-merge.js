const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  const { owner, repo } = github.context.repo;
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  let pr;
  let pull_number;

  if (github.context.eventName === 'pull_request_target') {
    pr = github.context.payload.pull_request;
    pull_number = pr.number;
  } else {
    const prs = github.context.payload.check_suite.pull_requests;
    if (!prs || prs.length === 0) {
      core.info('check_suite completed but has no related PR – exit');
      return;
    }
    pull_number = prs[0].number;
    pr = (await octokit.rest.pulls.get({ owner, repo, pull_number })).data;
  }

  core.info(`\u25B6 Evaluating PR #${pull_number} (${pr.head.ref} \u2192 ${pr.base.ref})`);

  let attempts = 0;
  while (pr.mergeable_state === 'unknown' && attempts < 10) {
    await new Promise((r) => setTimeout(r, 3000));
    pr = (await octokit.rest.pulls.get({ owner, repo, pull_number })).data;
    attempts++;
  }
  core.info(`mergeable_state = ${pr.mergeable_state}`);

  if (pr.mergeable_state === 'behind') {
    core.info('Branch behind base – updating branch \u2026');
    await octokit.rest.pulls.updateBranch({ owner, repo, pull_number });
    return;
  }

  if (['clean', 'unstable'].includes(pr.mergeable_state)) {
    await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number,
      merge_method: 'merge',
    });
    core.info('\u2705 PR merged');
    return;
  }

  const reason =
    {
      dirty: 'merge conflicts',
      blocked: 'required reviews or checks missing',
      draft: 'draft PR',
    }[pr.mergeable_state] ?? pr.mergeable_state;

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: `\u26A0\uFE0F Auto-merge skipped: ${reason}.`,
  });
  core.setFailed(`Auto-merge skipped: ${reason}`);
}

run().catch((err) => core.setFailed(err.message));
