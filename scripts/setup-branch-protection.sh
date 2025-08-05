#!/bin/bash
# Setup Branch Protection Rules for Pharmacy Scheduling System
# This script configures GitHub branch protection rules for safe development

set -e

REPO_NAME="TheJimmerJammer123/pharmacy-scheduling-system"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

echo "🛡️ Setting up Branch Protection Rules"
echo "======================================="

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Function to set up branch protection
setup_branch_protection() {
    local branch=$1
    local protection_level=$2
    
    echo "🔒 Setting up protection for '$branch' branch (level: $protection_level)"
    
    case $protection_level in
        "strict")
            # Strict protection for main branch
            gh api \
                --method PUT \
                -H "Accept: application/vnd.github.v3+json" \
                "/repos/$REPO_NAME/branches/$branch/protection" \
                --field required_status_checks='{"strict":true,"contexts":["Quality Gates & Security Checks","Frontend Tests & Build","Docker Integration Tests","Security & Dependency Audit"]}' \
                --field enforce_admins=true \
                --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
                --field restrictions=null \
                --field allow_force_pushes=false \
                --field allow_deletions=false
            ;;
        "moderate")
            # Moderate protection for development branch
            gh api \
                --method PUT \
                -H "Accept: application/vnd.github.v3+json" \
                "/repos/$REPO_NAME/branches/$branch/protection" \
                --field required_status_checks='{"strict":false,"contexts":["Quality Gates & Security Checks","Frontend Tests & Build"]}' \
                --field enforce_admins=false \
                --field required_pull_request_reviews='{"dismiss_stale_reviews":false,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
                --field restrictions=null \
                --field allow_force_pushes=false \
                --field allow_deletions=false
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo "✅ Branch protection configured for '$branch'"
    else
        echo "❌ Failed to configure branch protection for '$branch'"
        return 1
    fi
}

# Main branch - strict protection
echo "📋 Configuring main branch protection..."
setup_branch_protection "main" "strict"
echo ""

# Development branch - moderate protection  
echo "📋 Configuring development branch protection..."
setup_branch_protection "development" "moderate"
echo ""

# Create CODEOWNERS file if it doesn't exist
echo "👥 Setting up CODEOWNERS file..."
if [ ! -f ".github/CODEOWNERS" ]; then
    mkdir -p .github
    cat > .github/CODEOWNERS << 'EOF'
# Pharmacy Scheduling System - Code Owners

# Global code owners
* @TheJimmerJammer123

# Frontend code
/frontend/ @TheJimmerJammer123

# Docker and infrastructure
docker-compose.yml @TheJimmerJammer123
/supabase/ @TheJimmerJammer123
/.github/ @TheJimmerJammer123

# Documentation and configuration
CLAUDE.md @TheJimmerJammer123
README.md @TheJimmerJammer123

# Critical files that need extra review
/scripts/ @TheJimmerJammer123
/.env.example @TheJimmerJammer123
EOF
    echo "✅ CODEOWNERS file created"
else
    echo "✅ CODEOWNERS file already exists"
fi

# Create pull request template
echo "📝 Setting up pull request template..."
if [ ! -f ".github/pull_request_template.md" ]; then
    mkdir -p .github
    cat > .github/pull_request_template.md << 'EOF'
## 🏥 Pharmacy Scheduling System - Pull Request

### 📋 **Change Summary**
<!-- Describe what this PR does and why -->

### 🔧 **Type of Change**
<!-- Mark with an `x` -->
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🧪 Test improvement

### 🧪 **Testing**
<!-- Describe how you tested this change -->
- [ ] Frontend tests pass (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Docker services start successfully (`docker compose up -d`)
- [ ] Manual testing completed
- [ ] API endpoints tested (if applicable)

### 🛡️ **Security & Safety**
<!-- Security considerations -->
- [ ] No sensitive data exposed in code
- [ ] Environment variables properly handled
- [ ] No hardcoded credentials or secrets
- [ ] Database access follows RLS policies
- [ ] Employee data protection maintained

### 📋 **Checklist**
<!-- Complete before requesting review -->
- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] CLAUDE.md updated (if architecture changes)
- [ ] Git commit messages are descriptive

### 🚀 **Deployment Impact**
<!-- Consider deployment implications -->
- [ ] No database migrations required
- [ ] No environment variable changes
- [ ] No breaking API changes
- [ ] Backward compatible
- [ ] Safe to deploy immediately

### 🔗 **Related Issues**
<!-- Link to issues this PR addresses -->
Closes #

### 📸 **Screenshots** (if applicable)
<!-- Add screenshots for UI changes -->

### 🔄 **Rollback Plan**
<!-- How to rollback if this causes issues -->
- [ ] Can be reverted with `git revert`
- [ ] Emergency rollback workflow available
- [ ] No data migration rollback needed

---
**Additional Notes:**
<!-- Any additional context or notes for reviewers -->
EOF
    echo "✅ Pull request template created"
else
    echo "✅ Pull request template already exists"
fi

# Create issue templates
echo "🎫 Setting up issue templates..."
mkdir -p .github/ISSUE_TEMPLATE

# Bug report template
if [ ! -f ".github/ISSUE_TEMPLATE/bug_report.yml" ]; then
    cat > .github/ISSUE_TEMPLATE/bug_report.yml << 'EOF'
name: 🐛 Bug Report
description: Report a bug in the Pharmacy Scheduling System
title: "[BUG] "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug! Please fill out this form as completely as possible.

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: A clear and concise description of the bug.
      placeholder: Describe the bug...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What did you expect to happen?
      placeholder: Expected behavior...
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: How can we reproduce this issue?
      placeholder: |
        1. Go to '...'
        2. Click on '....'
        3. Scroll down to '....'
        4. See error
    validations:
      required: true

  - type: dropdown
    id: component
    attributes:
      label: Component
      description: Which part of the system is affected?
      options:
        - Frontend (React/TypeScript)
        - Backend (Supabase/Database)
        - SMS Integration (Capcom6)
        - Docker Services
        - Documentation
        - Other
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How severe is this issue?
      options:
        - Low (minor issue, workaround available)
        - Medium (affects functionality but not critical)
        - High (major functionality broken)
        - Critical (system unusable, security issue)
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Describe your environment
      placeholder: |
        - OS: [e.g. Ubuntu 22.04, macOS 13.0, Windows 11]
        - Docker version: [e.g. 24.0.6]
        - Browser: [e.g. Chrome 118, Firefox 119]
        - Node.js version: [e.g. 20.8.0]
    validations:
      required: false

  - type: textarea
    id: logs
    attributes:
      label: Relevant logs
      description: Add any relevant log output or error messages
      render: shell
    validations:
      required: false
EOF
    echo "✅ Bug report template created"
fi

# Feature request template  
if [ ! -f ".github/ISSUE_TEMPLATE/feature_request.yml" ]; then
    cat > .github/ISSUE_TEMPLATE/feature_request.yml << 'EOF'
name: ✨ Feature Request
description: Suggest a new feature for the Pharmacy Scheduling System
title: "[FEATURE] "
labels: ["enhancement", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a new feature! Please provide as much detail as possible.

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: What problem does this feature solve?
      placeholder: Describe the problem or use case...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: What would you like to see implemented?
      placeholder: Describe your proposed solution...
    validations:
      required: true

  - type: dropdown
    id: component
    attributes:
      label: Component
      description: Which part of the system would this affect?
      options:
        - Frontend (React/TypeScript)
        - Backend (Supabase/Database)
        - SMS Integration (Capcom6)
        - AI Chatbot
        - Docker Services
        - Documentation
        - Other
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      description: How important is this feature?
      options:
        - Low (nice to have)
        - Medium (would improve workflow)
        - High (important for operations)
        - Critical (essential for business needs)
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: What other approaches have you considered?
      placeholder: Describe alternative solutions...
    validations:
      required: false

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Add any other context, screenshots, or mockups
      placeholder: Additional context...
    validations:
      required: false
EOF
    echo "✅ Feature request template created"
fi

# Repository settings summary
echo ""
echo "📊 Branch Protection Summary"
echo "============================"
echo "✅ Main branch: Strict protection with required reviews"
echo "✅ Development branch: Moderate protection for active development"
echo "✅ Required status checks configured for CI/CD pipeline"
echo "✅ CODEOWNERS file created for automatic review assignments"
echo "✅ Pull request template created"
echo "✅ Issue templates created (bug reports, feature requests)"
echo ""
echo "🎉 Branch protection setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Commit and push the new GitHub configuration files"
echo "2. Create a pull request to test the protection rules"
echo "3. Verify that CI/CD workflows run automatically"
echo "4. Test emergency rollback procedures"
echo ""
echo "🔒 Your repository is now protected with industry-standard safety measures!"