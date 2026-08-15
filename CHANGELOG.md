# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-16

✨ Added
- auto-detect changelog language from commits
- add GitHub Action and CI workflow
- add CLI entry with write-to-CHANGELOG support

🐛 Fixed
- use github: install path since npm name is taken

📝 Other
- commit package-lock for reproducible CI
- add generated CHANGELOG (dogfooding ai-changelog)
- add MIT license
- add bilingual README and terminal demo
- cover parsing, grouping, versioning and fallback
