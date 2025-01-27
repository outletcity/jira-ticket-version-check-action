import {mocked} from 'jest-mock'
import {JiraConnector} from '../src/jiraConnector'
import {getInputs} from '../src/inputs'
import JiraApi from 'jira-client'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

// 1. We mock getInputs
jest.mock('../src/inputs', () => ({
  getInputs: jest.fn()
}))

// 2. We mock jira-client
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => {
    return {
      findIssue: jest.fn()
    }
  })
})

describe('JiraConnector', () => {
  const mockGetInputs = mocked(getInputs)
  const MockedJiraApi = mocked(JiraApi)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize JiraApi with the expected parameters', () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: 'test.atlassian.net',
        JIRA_USER: 'my-user',
        JIRA_PASSWORD: 'secret',
        JIRA_ISSUE_REGEX: '',
        GITHUB_TOKEN: ''
      })

      new JiraConnector() // create a new instance

      expect(MockedJiraApi).toHaveBeenCalledWith({
        protocol: 'https',
        host: 'test.atlassian.net',
        username: 'my-user',
        password: 'secret',
        apiVersion: '2',
        strictSSL: true
      })
    })
  })

  describe('getIssueCodeFromBranch', () => {
    it('should return the branch name if no JIRA_ISSUE_REGEX is set', () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        JIRA_ISSUE_REGEX: '',
        GITHUB_TOKEN: ''
      })

      const connector = new JiraConnector()
      const result = connector.getIssueCodeFromBranch(
        'feature/TEST-123-some-feature'
      )
      expect(result).toBe('feature/TEST-123-some-feature')
    })

    it('should return the first capture group match from the branch name', () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        // Example: A regex that recognizes a Jira issue in square brackets: [ABC-123]
        // Capture group (1) = ABC-123
        JIRA_ISSUE_REGEX: '\\[(ABC-\\d+)\\]',
        GITHUB_TOKEN: ''
      })

      const connector = new JiraConnector()
      const branchName = 'feature/[ABC-456]-other-thing'
      const result = connector.getIssueCodeFromBranch(branchName)
      expect(result).toBe('ABC-456')
    })

    it('should return the original branch name if there is no capture group match', () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        JIRA_ISSUE_REGEX: '\\[(ABC-\\d+)\\]',
        GITHUB_TOKEN: ''
      })

      const connector = new JiraConnector()
      const branchName = 'feature/NOJIRA-123'
      const result = connector.getIssueCodeFromBranch(branchName)
      expect(result).toBe('feature/NOJIRA-123')
    })
  })

  describe('getfixVersionFromTicket', () => {
    it('should return the found fixVersion', async () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        JIRA_ISSUE_REGEX: '',
        GITHUB_TOKEN: ''
      })

      const mockIssue = {
        fields: {
          fixVersions: [{name: '1.2.3'}]
        }
      }

      const connector = new JiraConnector()
      // Mock the return value of findIssue:
      mocked(connector['jira'].findIssue).mockResolvedValue(mockIssue)

      const fixVersion = await connector.getfixVersionFromTicket('ABC-123')
      expect(fixVersion).toBe('1.2.3')
      expect(connector['jira'].findIssue).toHaveBeenCalledWith('ABC-123')
    })

    it('should throw an error if findIssue fails', async () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        JIRA_ISSUE_REGEX: '',
        GITHUB_TOKEN: ''
      })

      const connector = new JiraConnector()
      const error = new Error('Issue not found')
      mocked(connector['jira'].findIssue).mockRejectedValue(error)

      await expect(
        connector.getfixVersionFromTicket('DEF-999')
      ).rejects.toThrow('Issue not found')
      expect(connector['jira'].findIssue).toHaveBeenCalledWith('DEF-999')
    })

    it('should return undefined if there are no fixVersions', async () => {
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        JIRA_ISSUE_REGEX: '',
        GITHUB_TOKEN: ''
      })

      const connector = new JiraConnector()
      // Return an issue without fixVersions
      mocked(connector['jira'].findIssue).mockResolvedValue({fields: {}})

      const fixVersion = await connector.getfixVersionFromTicket('GHI-111')
      expect(fixVersion).toBeUndefined()
    })
  })

  describe('isMatchedVersion', () => {
    beforeEach(() => {
      // For these tests, getInputs is irrelevant; just mock it with empty values
      mockGetInputs.mockReturnValue({
        JIRA_URL: '',
        JIRA_USER: '',
        JIRA_PASSWORD: '',
        JIRA_ISSUE_REGEX: '',
        GITHUB_TOKEN: ''
      })
    })

    it('should return true if both semver strings are equal (e.g. 1.2.3 vs 1.2.3)', () => {
      const connector = new JiraConnector()
      const result = connector.isMatchedVersion('1.2.3', 'release/1.2.3')
      expect(result).toBe(true)
    })

    it('should return false if semver strings differ (1.2.3 vs 1.2.4)', () => {
      const connector = new JiraConnector()
      const result = connector.isMatchedVersion('1.2.3', 'release/1.2.4')
      expect(result).toBe(false)
    })

    it('should return true if both semver strings are equal (e.g. 1.2.3 vs 1.2.3)', () => {
      const connector = new JiraConnector()
      const result = connector.isMatchedVersion(
        'Frontend 1.2.3',
        'release/1.2.3'
      )
      expect(result).toBe(true)
    })

    it('should return false if fixVersion does not match the branch part', () => {
      const connector = new JiraConnector()
      const result = connector.isMatchedVersion('1.3.0', 'release/1.2.9')
      expect(result).toBe(false)
    })

    it('should return true if fixVersion and targetBranch are identical (non-semver)', () => {
      const connector = new JiraConnector()
      const result = connector.isMatchedVersion('hotfix', 'hotfix')
      expect(result).toBe(true)
    })
  })
})
