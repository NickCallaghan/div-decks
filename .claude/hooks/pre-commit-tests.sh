#!/bin/bash
# Pre-commit hook: run lint, format check, and tests before allowing git commit.

STDIN=$(cat)
COMMAND=$(echo "$STDIN" | jq -r '.tool_input.command')

# Only run for git commit commands
if ! echo "$COMMAND" | grep -q 'git.*commit'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Run ESLint
npx eslint . > /tmp/divdeck-lint-output.txt 2>&1
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  jq -n --arg reason "Lint failed — commit blocked. Run 'npm run lint' to see errors." '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  rm -f /tmp/divdeck-lint-output.txt
  exit 0
fi
rm -f /tmp/divdeck-lint-output.txt

# Run Stylelint
npx stylelint "src/**/*.css" > /tmp/divdeck-csslint-output.txt 2>&1
CSSLINT_EXIT=$?

if [ $CSSLINT_EXIT -ne 0 ]; then
  jq -n --arg reason "CSS lint failed — commit blocked. Run 'npm run lint:css' to see errors." '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  rm -f /tmp/divdeck-csslint-output.txt
  exit 0
fi
rm -f /tmp/divdeck-csslint-output.txt

# Run Prettier check
npx prettier --check "src/**/*.{ts,tsx}" "e2e/**/*.ts" "server/**/*.ts" > /tmp/divdeck-fmt-output.txt 2>&1
FMT_EXIT=$?

if [ $FMT_EXIT -ne 0 ]; then
  jq -n --arg reason "Formatting failed — commit blocked. Run 'npx prettier --write .' to fix." '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  rm -f /tmp/divdeck-fmt-output.txt
  exit 0
fi
rm -f /tmp/divdeck-fmt-output.txt

# Run tests
npx vitest run --reporter=dot > /tmp/divdeck-test-output.txt 2>&1
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
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
