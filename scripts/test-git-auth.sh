#!/bin/bash
# Test Git Authentication Script for Pharmacy Project

echo "🔐 Testing Git Authentication..."
echo "================================"

# Check current configuration
echo "Current Git configuration:"
echo "Repository: $(git remote get-url origin)"
echo "Username: $(git config user.name)"
echo "Email: $(git config user.email)"
echo ""

# Test connection
echo "Testing connection to GitHub..."
if git ls-remote origin &>/dev/null; then
    echo "✅ SUCCESS: Git authentication is working!"
    echo ""
    
    # Show current branch status
    echo "Current branch status:"
    git status --short
    echo ""
    
    # Show commits ready to push
    echo "Commits ready to push:"
    git log --oneline origin/development..HEAD
    echo ""
    
    echo "✅ Ready to push with: git push origin development"
else
    echo "❌ FAILED: Git authentication not working"
    echo ""
    echo "Please check:"
    echo "1. Personal Access Token is correctly entered"
    echo "2. Token has 'repo' permissions"
    echo "3. Username matches your GitHub username"
    echo ""
    echo "For help: cat scripts/test-git-auth.sh"
fi