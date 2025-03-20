# Git Workflow Guide

## Overview
This document outlines the Git workflow for the SubtractProxy project.

## Branch Strategy

### Main Branch
- `main`: Production-ready code
  - Protected branch
  - Direct pushes are prohibited
  - Requires pull request review
  - Must pass CI/CD checks

### Development Branches
- Feature branches
  - Format: `feature/issue-<number>-<description>`
  - Example: `feature/issue-7-custom-filtering`
- Bugfix branches
  - Format: `bugfix/issue-<number>-<description>`
- Hotfix branches
  - Format: `hotfix/issue-<number>-<description>`

## Development Flow

1. Issue Creation
   - Create a new issue for each task
   - Add appropriate labels
   - Assign to team member

2. Branch Creation
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/issue-<number>-<description>
   ```

3. Development
   - Follow coding standards
   - Write tests in Japanese
   - Maintain 80% or higher test coverage
   - Commit messages in Japanese

4. Pull Request
   - Create PR using template
   - Link related issues
   - Request review from team members
   - Address review comments

5. Review Process
   - Code review by at least one team member
   - Check coding standards compliance
   - Verify test coverage
   - Ensure documentation is updated

6. Merge
   - Squash and merge to main
   - Delete feature branch after merge

## Commit Messages

Format:
```
<type>: <description>

- 詳細な変更内容1
- 詳細な変更内容2

Issue #<number>
```

Types:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: リファクタリング
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

Example:
```
feat: カスタムフィルタリングルールの実装

- フィルタリングルールの型定義を追加
- フィルタリングサービスの実装
- テストの追加

Issue #7
```

## Branch Protection Rules

### Main Branch Protection
- Require pull request reviews before merging
- Require status checks to pass before merging
- Include administrators in restrictions
- Require linear history
- Require signed commits

### Pull Request Requirements
- At least one approving review
- All discussions resolved
- All status checks passing
- Up-to-date with main branch

## CI/CD Integration

### Continuous Integration
- Run on pull requests
- Lint checks
- Unit tests
- Test coverage report
- Build verification

### Continuous Deployment
- Automated deployment to staging
- Manual approval for production
- Deployment status checks

## Best Practices

1. Keep branches short-lived
2. Regular rebasing with main
3. Squash commits before merge
4. Write descriptive commit messages
5. Link issues and pull requests
6. Regular cleanup of merged branches

## Tools and Commands

### Branch Management
```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/issue-<number>-<description>

# Update feature branch
git fetch origin
git rebase origin/main

# Push changes
git push origin feature/issue-<number>-<description>
```

### Branch Cleanup
```bash
# Delete local branch
git branch -d <branch-name>

# Delete remote branch
git push origin --delete <branch-name>
```

### GitHub CLI
```bash
# Create pull request
gh pr create --title "<title>" --body "<description>"

# Check pull request status
gh pr status

# Review pull request
gh pr review [<number>] --approve
```
