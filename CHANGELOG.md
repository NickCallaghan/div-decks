# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.4.1] - 2026-04-06

### Added

- Pre-commit hook that blocks version bumps without CHANGELOG.md updates
- CLAUDE.md development rule for changelog maintenance

### Changed

- Backfilled CHANGELOG.md with entries for v0.3.1 through v0.4.0

## [0.4.0] - 2026-04-06

### Added

- Toast notification system — save success, error feedback for all API failures
- 12 new E2E tests covering editing, save workflow, slide navigation, undo/redo
- 11 new component unit tests for dispatchSlideMessage, formatSize, formatDate

### Changed

- Refactored EditorToolbar from 537 LOC to 278 LOC — extracted GitStatusBadge, SlideNavigation, SelectedElementIndicator, shared toolbar primitives, useKeyboardShortcuts hook
- All silent `console.error` handlers replaced with user-visible toast notifications

## [0.3.5] - 2026-04-06

### Changed

- Rewrote README with problem statement, new-deck skill docs, and updated screenshot

## [0.3.4] - 2026-04-06

### Added

- Example presentation explaining how div.deck works

## [0.3.3] - 2026-04-06

### Fixed

- CLI not running via npx
- Exclude dist-server from test runner

## [0.3.2] - 2026-04-06

### Fixed

- Remove duplicate commands/new-deck.md — skill already registers /new-deck

## [0.3.1] - 2026-04-06

### Added

- `/new-deck` skill for generating div.deck-compatible slide decks
- marketplace.json for Claude Code plugin discovery

### Fixed

- Restructured new-deck plugin to match Claude Code conventions
- Normalized repository URL format

## [0.3.0] - 2026-04-06

### Added

- Export PDF button — export presentations via the browser's print dialog (Cmd+P)
- Git status integration in the editor toolbar (branch, file status)
- E2E test suite with Playwright
- CSS linting with stylelint
- Generic brand compatibility for custom-styled slide decks

### Fixed

- Presentation mode close button and escape handling
- Gradient text (`background-clip: text`) rendering correctly in PDF export

## [0.2.0] - 2026-04-02

### Added

- Atomic container support — cards, KPIs, and panels drag as units
- Generic grid child detection for atomic containers
- Expanded bridge editability to cover all visual-explainer elements
- Custom HMR for presentation file changes

### Fixed

- Handle walk-up for wrapper elements
- Drag targets for atomic containers
- Presentation mode in complex slide decks
- Simplified reorderable selector to semantic elements approach

## [0.1.2] - 2026-04-02

### Fixed

- README corrections: credit visual-explainer author, clarify deck format

## [0.1.1] - 2026-04-02

### Added

- Proper README with usage documentation

## [0.1.0] - 2026-04-02

### Added

- Initial release
- File browser for HTML slide decks in `presentations/` directory
- Visual slide editor with iframe-based rendering for style isolation
- Click-to-select, click-to-edit text elements
- Notion-style drag handles with drag-to-reorder (swap for grids, insert for lists)
- Context menu (move up/down, duplicate, delete)
- Undo/redo with 50-snapshot history
- Presentation mode — full-screen slideshow using original SlideEngine
- Keyboard shortcuts (Cmd+S save, Cmd+Z undo, arrows navigate)
- Express backend for reading/writing HTML files
- CLI entry point (`npx div-deck`)
