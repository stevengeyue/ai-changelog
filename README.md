# ai-changelog

### Stop writing release notes. Let the AI do it.

```
$ npx ai-changelog --lang zh --write
✦ Analyzing git history (v1.0.0..HEAD, 12 commits)...
✦ Provider: deepseek · Suggested version: 1.1.0 (minor)

## [1.1.0] - 2026-08-15

💥 Breaking Changes
- Drop Node 16 support, require Node 18+

✨ Added
- Support DeepSeek / Anthropic / Ollama LLM providers
- Automatic fallback to the rule engine when no API key is set

🐛 Fixed
- Fix duplicated header when using --write on an existing CHANGELOG.md

✓ Wrote CHANGELOG.md (12 commits → 6 bullets)
```

**ai-changelog** turns the raw git history between two refs (usually the last tag and HEAD) into a polished, human-readable changelog — powered by the LLM of your choice, or by a built-in rule engine when you don't have an API key at all.

![terminal demo](docs/terminal-demo.svg)

[![CI](https://github.com/stevengeyue/ai-changelog/actions/workflows/ci.yml/badge.svg)](https://github.com/stevengeyue/ai-changelog/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/ai-changelog)](https://www.npmjs.com/package/ai-changelog)
[![Node](https://img.shields.io/badge/Node-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

## ✨ Highlights

| | |
| --- | --- |
| ⚡ **Zero setup** | `npx ai-changelog` — no install, no config file |
| 🤖 **Your favorite LLM** | OpenAI, DeepSeek, Anthropic, Ollama, or any OpenAI-compatible endpoint |
| 🧩 **Works without a key** | Built-in rule engine kicks in automatically — the tool never bricks |
| 📦 **Smart versioning** | Detects breaking changes and suggests major/minor/patch |
| 🌍 **Bilingual** | English and Simplified Chinese output |
| 🤖 **Agent-friendly** | Outputs clean markdown ready for release notes, PRs, or your docs |
| 🔧 **CI-ready** | GitHub Action included — post changelogs to Releases automatically |

## 🚀 Quick start

Run it in any git repository:

```bash
npx ai-changelog
```

That's it. It finds the last tag (or walks to the first commit), reads the commits, and prints a changelog.

Want Chinese output and to update your `CHANGELOG.md` in one shot?

```bash
npx ai-changelog --lang zh --write
```

## 🧠 LLM providers

ai-changelog talks to any OpenAI-compatible chat API plus Anthropic. It auto-detects the provider from your environment:

| Provider | Env var | Default model |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-chat` |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-3-5-haiku-latest` |
| Ollama (local) | `OLLAMA_HOST` (optional) | `qwen2.5:7b` |
| Custom | `--base-url` + any key | `--model` |

Example with DeepSeek:

```bash
export DEEPSEEK_API_KEY=sk-...
npx ai-changelog --provider deepseek --lang zh
```

Example with a local Ollama model (no cloud, no cost):

```bash
npx ai-changelog --provider ollama --model qwen2.5:7b --base-url http://localhost:11434/v1
```

> 🔑 **No API key?** Just run it. If no key is found (or the LLM call fails), ai-changelog falls back to a deterministic rule engine that still produces a clean, grouped changelog. You only lose the LLM's summarization flair.

## 📦 Smart versioning

ai-changelog analyzes your commits and suggests the next semver bump:

| Signal | Suggested bump |
| --- | --- |
| `!` or `BREAKING CHANGE` | **major** |
| `feat` | **minor** |
| `fix` / `perf` / other | **patch** |

It reads the version from your last tag (e.g. `v1.2.3`) and proposes the next one. Override anytime with `--set-version 2.0.0`.

## 🖥️ CLI reference

```text
Usage: ai-changelog [options]

Options:
  --repo <path>        git repository path (default: current directory)
  --from <ref>         base git ref (default: latest tag)
  --to <ref>           head git ref (default: HEAD)
  --provider <name>    openai | deepseek | anthropic | ollama | auto (default: auto)
  --model <name>       LLM model name
  --api-key <key>      API key (or use <PROVIDER>_API_KEY env var)
  --base-url <url>     custom OpenAI-compatible base URL
  --lang <lang>        en | zh (default: en)
  --format <format>    terminal | md | json (default: terminal)
  --set-version <v>    explicit version for the title (e.g. 1.2.0)
  --write              prepend the new section to CHANGELOG.md
  --no-llm             force the built-in rule engine
  -h, --help           display help
```

## 🤖 GitHub Action

Add automated release notes to every push or release:

```yaml
name: Generate Release Notes

on:
  release:
    types: [created]

jobs:
  changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: stevengeyue/ai-changelog@main
        id: gen
        with:
          provider: deepseek
          lang: zh
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
      - uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.gen.outputs.changelog }}
```

## 🏗️ How it works

1. **Collect** — git commits between the base ref (latest tag by default) and HEAD.
2. **Parse** — Conventional Commits (`feat(scope): desc`, `!`, `BREAKING CHANGE`) plus plain messages.
3. **Generate** — ask the LLM to group commits into Added / Changed / Fixed / Removed / Breaking with user-visible impact; fall back to the rule engine on any failure.
4. **Emit** — terminal, markdown, or JSON. Optionally prepend to `CHANGELOG.md`.

## 🧪 Development

```bash
npm install
npm run check   # typecheck
npm test        # vitest
npm run build   # tsc -> dist
node dist/cli.js --no-llm   # try it locally
```

## 🗺️ Roadmap

- [ ] Detect changelog language from the repository's dominant commit language
- [ ] GitHub App bot that comments on PRs with generated release notes
- [ ] Template customization (custom group names, emoji toggles)
- [ ] Diff-aware summaries: include `--stat` context for large changes

## 📄 License

[MIT](LICENSE) © ai-changelog contributors
