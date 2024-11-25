import * as core from '@actions/core'
import {PullRequestConnector} from './pullRequestConnector'
import {JiraConnector} from './jiraConnector'

async function run(): Promise<void> {
  try {
    const pullRequestConnector = new PullRequestConnector()
    const jiraConnector = new JiraConnector()

    const {sourceBranch, targetBranch} = pullRequestConnector

    if (sourceBranch && targetBranch) {
      const issueKey = jiraConnector.getIssueCodeFromBranch(sourceBranch)
      const fixVersion = await jiraConnector.getfixVersionFromTicket(issueKey)

      if (!fixVersion) {
        await pullRequestConnector.writeComment()
        console.log('Fix version in Jira not found')
        process.exit(0)
      }

      if (!jiraConnector.isMatchedVersion(fixVersion, targetBranch)) {
        console.log(`Fixversion not matched: ${fixVersion} and ${targetBranch}`)
        process.exit(1)
      }
      console.log(`Fixversion matched: ${fixVersion} and ${targetBranch}`)
    }

    process.exit(0)
  } catch (error) {
    console.log('Error: ', (error as Error).message)
    core.setFailed((error as Error).message)
  }
}

run()
