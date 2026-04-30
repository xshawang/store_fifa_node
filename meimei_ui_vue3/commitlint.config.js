{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert"
      ]
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100]
  },
  "prompt": {
    "messages": {
      "type": "选择你要提交的类型：",
      "scope": "选择一个范围（可选）：",
      "customScope": "请输入自定义范围：",
      "subject": "填写简短的描述：",
      "body": "填写详细的描述（可选）：",
      "breaking": "列出不兼容的变更（可选）：",
      "footerPrefixesSelect": "选择关联的Issue前缀：",
      "customFooterPrefix": "输入自定义Issue前缀：",
      "footer": "输入Issue编号（如 #123）：",
      "confirmCommit": "确认提交以上信息？"
    },
    "types": [
      {
        "value": "feat",
        "name": "feat:     ✨  新功能",
        "emoji": "✨"
      },
      {
        "value": "fix",
        "name": "fix:      🐛  Bug修复",
        "emoji": "🐛"
      },
      {
        "value": "docs",
        "name": "docs:     📝  文档更新",
        "emoji": "📝"
      },
      {
        "value": "style",
        "name": "style:    💄  代码格式",
        "emoji": "💄"
      },
      {
        "value": "refactor",
        "name": "refactor: ♻️   代码重构",
        "emoji": "♻️"
      },
      {
        "value": "perf",
        "name": "perf:     ⚡️  性能优化",
        "emoji": "⚡️"
      },
      {
        "value": "test",
        "name": "test:     ✅  测试相关",
        "emoji": "✅"
      },
      {
        "value": "build",
        "name": "build:    📦️  构建系统",
        "emoji": "📦️"
      },
      {
        "value": "ci",
        "name": "ci:       🎡  CI配置",
        "emoji": "🎡"
      },
      {
        "value": "chore",
        "name": "chore:    🔨  其他更改",
        "emoji": "🔨"
      },
      {
        "value": "revert",
        "name": "revert:   ⏪️  回退提交",
        "emoji": "⏪️"
      }
    ],
    "useEmoji": true,
    "emojiAlign": "center",
    "theme": {
      "question": {
        "default": "blue",
        "chosen": "bold.cyan"
      }
    }
  }
}
