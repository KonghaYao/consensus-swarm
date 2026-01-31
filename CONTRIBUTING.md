# Contributing to Consensus

Thank you for your interest in contributing to Consensus! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community

## Getting Started

### Prerequisites

- Node.js >= 20 (use `.nvmrc` for version management)
- pnpm >= 10
- Bun (for runtime)
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/consensus.git
   cd consensus
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Copy environment template:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` and add your API keys

6. Start development servers:
   ```bash
   pnpm dev:all
   ```

## Development Workflow

### Branch Strategy

- `main` - Stable production code
- `refactor/*` - Refactoring changes
- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes and follow coding standards

3. Type check your code:
   ```bash
   pnpm type-check
   ```

4. Format your code:
   ```bash
   pnpm format
   ```

5. Test your changes:
   ```bash
   pnpm test
   ```

6. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: add agent configuration export feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `chore:` - Maintenance tasks

7. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

8. Create a Pull Request

### Pull Request Guidelines

- Fill in the PR template
- Link related issues
- Ensure all CI checks pass
- Request review from maintainers
- Respond to review feedback

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Avoid `any` types
- Use proper type annotations
- Follow existing code patterns

### React

- Use functional components with hooks
- Follow React 19 best practices
- Keep components small and focused
- Use proper prop types

### Backend

- Follow LangGraph patterns
- Use proper error handling
- Validate inputs with Zod schemas
- Keep functions pure where possible

### Styling

- Use Tailwind CSS utility classes
- Follow existing component patterns
- Maintain consistency with ShadCN components

### Documentation

- Update relevant documentation
- Add JSDoc comments for public APIs
- Keep README.md up to date
- Update CHANGELOG.md for user-facing changes

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Writing Tests

- Write unit tests for utility functions
- Test components with React Testing Library
- Mock external dependencies
- Aim for high code coverage

## Project Structure

```
consensus/
├── server/          # Backend (Bun + Hono + LangGraph)
│   ├── src/
│   │   ├── agent/   # Agent logic and graph
│   │   ├── config/  # Agent configurations
│   │   ├── routes/  # API routes
│   │   └── utils/   # Utility functions
├── frontend/        # Frontend (React + Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       └── lib/
└── docs/            # Additional documentation
```

## Adding New Agents

1. Create config in `server/src/config/agents/`
2. Export `AgentConfig` object
3. Follow the existing agent pattern
4. Update documentation

## Adding New Tools

1. Register in `server/src/agent/tools/registry.ts`
2. Add boolean flag to `AgentConfig.tools`
3. Document tool behavior
4. Add tests if applicable

## Questions or Issues?

- Check existing [GitHub Issues](https://github.com/your-org/consensus/issues)
- Create a new issue with the `question` label
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
