#!/bin/bash
# Pre-commit hook: run tests before allowing git commit.

STDIN=$(cat)
COMMAND=$(echo "$STDIN" | jq -r '.tool_input.command')

# Only run for git commit commands
if ! echo "$COMMAND" | grep -q 'git.*commit'; then
  exit 0
fi

# Run tests
cd "$CLAUDE_PROJECT_DIR" || exit 0
npx vitest run --reporter=dot > /tmp/divdeck-test-output.txt 2>&1
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
  TEST_OUTPUT=$(cat /tmp/divdeck-test-output.txt)
  jq -n --arg reason "Tests failed — commit blocked." '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  rm -f /tmp/divdeck-test-output.txt
  exit 0
fi

rm -f /tmp/divdeck-test-output.txt
exit 0
