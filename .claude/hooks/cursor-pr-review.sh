#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract the command that was run
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# Only process gh pr create commands
if [[ ! "$command" =~ ^gh\ pr\ create ]]; then
    exit 0
fi

# Extract PR URL from stdout
pr_url=$(echo "$input" | jq -r '.tool_response.stdout // ""' | grep -oE 'https://github.com/[^[:space:]]+/pull/[0-9]+' | head -1)

if [[ -z "$pr_url" ]]; then
    exit 0
fi

# Extract repo and PR number from URL
repo=$(echo "$pr_url" | sed -E 's|https://github.com/([^/]+/[^/]+)/pull/[0-9]+|\1|')
pr_number=$(echo "$pr_url" | sed -E 's|.*/pull/([0-9]+)|\1|')

echo "Requesting Claude Code review for PR #$pr_number..."

# Get the PR diff for context
pr_diff=$(gh pr diff "$pr_number" --repo "$repo" 2>/dev/null | head -500)

# Save diff to temp file for cursor-agent
diff_file=$(mktemp)
echo "$pr_diff" > "$diff_file"

# Run cursor-agent to generate review (using GPT-5.2 model)
review=$(cursor-agent --model gpt-5.2 --print "Review this PR diff and provide constructive feedback. Be concise and focus on potential issues, improvements, and good practices. Format your response in markdown." < "$diff_file" 2>/dev/null)

rm -f "$diff_file"

if [[ -z "$review" ]]; then
    echo "Failed to get review from cursor-agent"
    exit 0
fi

# Post review as a comment on the PR
gh pr comment "$pr_number" --repo "$repo" --body "## 🤖 Cursor Agent Review

$review

---
*Automated review by cursor-agent (GPT-5.2)*"

echo "Review posted to $pr_url"
exit 0
