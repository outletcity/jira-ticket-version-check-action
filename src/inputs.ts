import * as core from '@actions/core'

interface Inputs {
  GITHUB_TOKEN: string
  JIRA_URL: string
  JIRA_USER: string
  JIRA_PASSWORD: string
  NOT_FOUND_MESSAGE?: string
  JIRA_ISSUE_REGEX?: string
}

export const getInputs = (): Inputs => {
  const GITHUB_TOKEN: string = core.getInput('GITHUB_TOKEN', {required: true})
  const NOT_FOUND_MESSAGE: string = core.getInput('NOT_FOUND_MESSAGE')
  const JIRA_URL: string = core.getInput('JIRA_URL')
  const JIRA_USER: string = core.getInput('JIRA_USER')
  const JIRA_PASSWORD: string = core.getInput('JIRA_PASSWORD')
  const JIRA_ISSUE_REGEX: string = core.getInput('JIRA_ISSUE_REGEX')

  return {
    GITHUB_TOKEN,
    NOT_FOUND_MESSAGE,
    JIRA_PASSWORD,
    JIRA_URL,
    JIRA_USER,
    JIRA_ISSUE_REGEX
  }
}
