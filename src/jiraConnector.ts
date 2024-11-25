import JiraApi from 'jira-client'
import {getInputs} from './inputs'

export class JiraConnector {
  private jira: JiraApi

  constructor() {
    const {JIRA_URL, JIRA_USER, JIRA_PASSWORD} = getInputs()

    this.jira = new JiraApi({
      protocol: 'https',
      host: JIRA_URL,
      username: JIRA_USER,
      password: JIRA_PASSWORD,
      apiVersion: '2',
      strictSSL: true
    })
  }

  getIssueCodeFromBranch(branchName: string): string {
    const {JIRA_ISSUE_REGEX} = getInputs()
    if (JIRA_ISSUE_REGEX) {
      const customRegex = new RegExp(JIRA_ISSUE_REGEX)
      const issueKey = branchName.match(customRegex)
      return issueKey && issueKey[1] ? issueKey[1] : branchName
    }
    return branchName
  }

  async getfixVersionFromTicket(issueKey: string): Promise<string> {
    try {
      const issue = await this.jira.findIssue(issueKey)
      return issue?.fields?.fixVersions[0]?.name
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private extractSemver(input: string): string | null {
    const semverRegex = /(?:^|[^0-9.])(\d+\.\d+\.\d+)(?:$|[^0-9.])/
    const match = input.match(semverRegex)
    return match ? match[0] : null
  }

  isMatchedVersion(fixVersion: string, targetBranch: string): boolean {
    const fixVersionSemver = this.extractSemver(fixVersion)
    const targetBranchSemver = this.extractSemver(targetBranch)

    if (fixVersionSemver && targetBranchSemver) {
      return fixVersionSemver === targetBranchSemver
    }

    if (!fixVersion.includes('/')) {
      const branchParts = targetBranch.split('/')
      if (branchParts.length === 2) {
        return fixVersion === branchParts[1]
      }
    }

    return fixVersion === targetBranch
  }
}
