import {getInputs} from './inputs'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import {Octokit} from '@octokit/core'
import {Api} from '@octokit/plugin-rest-endpoint-methods/dist-types/types'
import {PaginateInterface} from '@octokit/plugin-paginate-rest'
import {WebhookPayload} from '@actions/github/lib/interfaces'

export class PullRequestConnector {
  context: Context
  octokit: Octokit &
    Api & {
      paginate: PaginateInterface
    }

  constructor() {
    const {GITHUB_TOKEN} = getInputs()
    this.octokit = github.getOctokit(GITHUB_TOKEN)
    const {context} = github
    this.context = context
  }

  get pullRequest(): WebhookPayload['pull_request'] {
    const {pull_request} = this.context.payload
    return pull_request
  }

  get sourceBranch(): string | undefined {
    return this.pullRequest?.head.ref
  }

  get targetBranch(): string | undefined {
    return this.pullRequest?.base.ref
  }

  /**
   * @throws {Error}
   */
  async writeComment(): Promise<void> {
    const {NOT_FOUND_MESSAGE} = getInputs()

    if (!NOT_FOUND_MESSAGE) {
      return
    }

    const prNumber = this.pullRequest?.number

    if (prNumber === undefined) {
      throw new Error('This action should only run on PR')
    }

    await this.octokit.rest.issues.createComment({
      ...this.context.repo,
      issue_number: prNumber,
      body: NOT_FOUND_MESSAGE
    })
    console.log('Comment: ', NOT_FOUND_MESSAGE)
  }
}
