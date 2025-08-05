#!/bin/bash
# Push Pharmacy Project to GitHub
# Run this script after updating your Personal Access Token permissions

echo "🚀 Pushing Pharmacy Scheduling System to GitHub..."
echo "=================================================="

# Check current status
echo "Current repository configuration:"
git remote -v
echo ""

echo "Commits ready to push:"
git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline -5
echo ""

# Push main branch first
echo "📤 Pushing main branch..."
if git push -u origin main; then
    echo "✅ Main branch pushed successfully"
else
    echo "❌ Failed to push main branch"
    echo "Please ensure:"
    echo "1. Your Personal Access Token has 'repo' scope"
    echo "2. You have write access to the repository"
    echo "3. Your username and token are correct"
    exit 1
fi

echo ""

# Push development branch
echo "📤 Pushing development branch..."
if git push -u origin development; then
    echo "✅ Development branch pushed successfully"
else
    echo "❌ Failed to push development branch"
    exit 1
fi

echo ""

# Push tags
echo "📤 Pushing stable backup tags..."
if git push origin --tags; then
    echo "✅ Tags pushed successfully"
else
    echo "❌ Failed to push tags"
fi

echo ""
echo "🎉 SUCCESS! Your pharmacy project is now on GitHub:"
echo "   https://github.com/TheJimmerJammer123/pharmacy-scheduling-system"
echo ""
echo "📊 What was pushed:"
echo "   ✅ Main branch with stable code"
echo "   ✅ Development branch with latest improvements"
echo "   ✅ Stable backup tag: $(git tag -l | grep stable)"
echo "   ✅ All 8 subagent files"
echo "   ✅ Complete documentation and configuration"