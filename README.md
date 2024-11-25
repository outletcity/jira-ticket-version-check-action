# Jira ticket fixversion check action

This action match the Jira ticket fixversion and a PR target branch.

## Inputs
## `GITHUB_TOKEN`
**Required** Github Token.

## `NOT_FOUND_MESSAGE`
Comment message when no Fixversion found in Jira issue. If empty no comment will be created.

## `JIRA_ISSUE_REGEX`
Comment message when no Fixversion found in Jira issue.

## `JIRA_URL`
**Required** Jira URL.

## `JIRA_USER`
**Required** Jira user.

## `JIRA_PASSWORD`
**Required** Jira password.


## Example usage
```
name: 'Check Fixversion'
on:
  pull_request
jobs:
  test: # make sure the action works on a clean machine without building
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: outletcity/jira-ticket-version-check-action@v1.0
        with:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
          NOT_FOUND_MESSAGE: "Keine Jira Ticket Version angegeben, bitte prüfen!"
          JIRA_ISSUE_REGEX: ".*(TUB-\d+|ROOT-\d+).*"
          JIRA_URL: "redbox.outletcity.com/jira"
          JIRA_USER: ${{secrets.JIRA_USER}}
          JIRA_PASSWORD: ${{secrets.JIRA_PASSWORD}}
```