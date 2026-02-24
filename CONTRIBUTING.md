# 🤝 Contributing to LIVE RUSSIA Tester Dashboard

First off, thank you for considering contributing to the LIVE RUSSIA Tester Dashboard! It's people like you that make this project better for everyone.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members
- ❌ No harassment, trolling, or insulting comments
- ❌ No political or off-topic discussions

---

## 🎯 How Can I Contribute?

### Reporting Bugs 🐛

Before creating a bug report, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node.js version, browser)

**Example:**
```
Title: Tester form validation fails for phone numbers

Steps to reproduce:
1. Go to Testers page
2. Click "Add New Tester"
3. Enter phone number with spaces: "+1 234 567 8900"
4. Click Save

Expected: Phone number should be accepted
Actual: Error message "Invalid phone number format"

Environment: Windows 11, Node.js 18.0.0, Chrome 120
```

### Suggesting Enhancements 💡

Enhancement suggestions are tracked as GitHub issues.

**When suggesting an enhancement, include:**
- Clear, descriptive title
- Detailed description of the proposed feature
- Why this enhancement would be useful
- Possible implementation approach (optional)

### Your First Code Contribution 🎉

Unsure where to begin? Look for issues labeled:
- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues where we need community help
- `documentation` - Improvements to documentation

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/live-russia-tester-dashboard.git
cd live-russia-tester-dashboard
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/live-russia-tester-dashboard.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` - New features (e.g., `feature/add-email-notifications`)
- `bugfix/` - Bug fixes (e.g., `bugfix/fix-login-validation`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/improve-api-structure`)

---

## 💻 Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 2. Test Your Changes

```bash
# Start the development server
npm run dev

# Test in your browser
# Visit http://localhost:3000
```

**Manual testing checklist:**
- ✅ Does the feature work as expected?
- ✅ Are there any console errors?
- ✅ Does it work on different browsers?
- ✅ Is the UI responsive on mobile?
- ✅ Did you test edge cases?

### 3. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/master
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add email notification feature"
```

See [Commit Message Guidelines](#commit-message-guidelines) below.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

---

## 📝 Coding Standards

### JavaScript Style Guide

**General Rules:**
- Use `const` and `let`, avoid `var`
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic
- Use async/await instead of callbacks

**Example:**
```javascript
// ❌ Bad
function f(x) {
  var y = x * 2;
  return y;
}

// ✅ Good
function calculateDoubleValue(inputValue) {
  const doubledValue = inputValue * 2;
  return doubledValue;
}
```

### File Organization

```
project/
├── backend/
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   └── middleware/      # Express middleware
├── frontend/
│   ├── js/              # JavaScript files
│   ├── styles/          # CSS files
│   └── *.html           # HTML pages
└── database/            # Database files
```

### CSS Style Guide

- Use meaningful class names
- Follow BEM naming convention when possible
- Keep selectors simple
- Group related properties

**Example:**
```css
/* ✅ Good */
.tester-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
}

.tester-card__title {
  font-size: 1.2rem;
  font-weight: bold;
}

.tester-card__status--active {
  color: green;
}
```

### HTML Style Guide

- Use semantic HTML5 elements
- Include proper ARIA labels for accessibility
- Keep markup clean and indented
- Use meaningful IDs and classes

---

## 📨 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(testers): add email validation to tester form"

# Bug fix
git commit -m "fix(auth): resolve session timeout issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple lines
git commit -m "feat(payments): add payment export functionality

- Add CSV export button
- Implement export logic
- Add date range filter for exports"
```

---

## 🔄 Pull Request Process

### 1. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request" button
3. Select your branch
4. Fill in the PR template

### 2. PR Title Format

Use the same format as commit messages:
```
feat(testers): add bulk import functionality
```

### 3. PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Changes Made
- List of specific changes
- Another change
- One more change

## Testing
How did you test these changes?

## Screenshots (if applicable)
Add screenshots to show UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have tested my changes
- [ ] I have updated the documentation
- [ ] My changes don't break existing functionality
```

### 4. Review Process

- A maintainer will review your PR
- Address any requested changes
- Once approved, your PR will be merged!

### 5. After Merge

```bash
# Update your local repository
git checkout master
git pull upstream master

# Delete your feature branch
git branch -d feature/your-feature-name
```

---

## 🎨 UI/UX Guidelines

When contributing UI changes:

- **Consistency:** Match the existing design style
- **Responsiveness:** Test on mobile, tablet, and desktop
- **Accessibility:** Ensure proper contrast ratios and keyboard navigation
- **Performance:** Optimize images and minimize CSS/JS

---

## 🧪 Testing Guidelines

While we don't have automated tests yet, please manually test:

1. **Happy path:** Normal user flow works correctly
2. **Edge cases:** Empty inputs, very long inputs, special characters
3. **Error handling:** Proper error messages are shown
4. **Browser compatibility:** Test on Chrome, Firefox, Safari
5. **Mobile responsiveness:** Test on different screen sizes

---

## 📚 Documentation

When adding new features, update:

- `README_GITHUB.md` - If it affects installation or usage
- `GITHUB_GUIDE.md` - If it affects the GitHub workflow
- Code comments - For complex logic
- API documentation - For new endpoints

---

## 🏆 Recognition

Contributors will be:
- Listed in the project's contributors page
- Mentioned in release notes
- Given credit in the README (for significant contributions)

---

## ❓ Questions?

- Open an issue with the `question` label
- Reach out to the maintainers
- Check existing documentation

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

**Happy coding!** 🚀
