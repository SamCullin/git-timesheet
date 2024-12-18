# Contributing to Git Timesheet

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Git Timesheet. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include details about your configuration and environment

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the JavaScript/TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch from `main`
3. Make your changes
4. Run tests and linting
5. Push to your fork
6. Submit a Pull Request

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/samcullin/git-timesheet.git
cd git-timesheet

# Install dependencies
bun install

# Run tests
bun test

# Run linting
bun run lint

# Start development server
bun run dev
```

## Project Structure

```
git-timesheet/
├── packages/
│   ├── cli/           # Command line interface
│   ├── vcs/          # Version control system integrations
│   └── reporter/     # Report generation modules
├── dist/             # Compiled output
└── tests/            # Test files
```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * 🐛 `:bug:` when fixing a bug
    * ✨ `:sparkles:` when adding a new feature
    * 📝 `:memo:` when writing docs
    * 🔧 `:wrench:` when updating configuration files

### JavaScript/TypeScript Styleguide

* Use Biome for formatting
* Prefer `const` over `let`
* Use meaningful variable names
* Document complex logic with comments
* Use TypeScript types appropriately
* Follow the principle of single responsibility
* Write pure functions when possible
* Use async/await over raw promises

### Testing Styleguide

* Test file names should match the module they test with a `.test.ts` suffix
* Use descriptive test names that explain the expected behavior
* Follow the Arrange-Act-Assert pattern
* Mock external dependencies appropriately
* Keep tests focused and atomic
* Include both positive and negative test cases

### Documentation Styleguide

* Use Markdown for documentation
* Keep documentation up to date with code changes
* Include examples where appropriate
* Document both what and why
* Keep line length to a maximum of 80 characters for better readability

## Additional Notes

### Issue and Pull Request Labels

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Improvements or additions to documentation
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed
* `question` - Further information is requested

## License
By contributing, you agree that your contributions will be licensed under its MIT License.