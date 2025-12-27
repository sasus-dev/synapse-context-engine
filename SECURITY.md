# Security Policy

## 🛡️ Project Status

Synapse Context Engine (SCE) is currently in **alpha research status** (v0.2.1-alpha). While we take security seriously, this project is not yet recommended for production use with sensitive data.

## 🔐 Supported Versions

| Version | Support Status |
| ------- | -------------- |
| 0.2.x   | ✅ Active development |
| 0.1.x   | ⚠️ Security fixes only |
| < 0.1.0 | ❌ Not supported |

## 🚨 Reporting a Vulnerability

**DO NOT** open public issues for security vulnerabilities.

Instead, please report security issues privately:

### Preferred Method: GitHub Security Advisories
1. Go to the [Security tab](https://github.com/sasus-dev/synapse-context-engine/security)
2. Click "Report a vulnerability"
3. Fill out the form with details

### Alternative: Email
Email: [Your security contact email]

Subject line: `[SECURITY] SCE Vulnerability Report`

### What to Include

Please provide:
- **Description**: Clear explanation of the vulnerability
- **Impact**: What an attacker could achieve
- **Steps to Reproduce**: Detailed reproduction steps
- **Affected Versions**: Which versions are impacted
- **Suggested Fix**: If you have ideas (optional)
- **Disclosure Timeline**: Your expectations for public disclosure

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix & Disclosure**: Depends on severity (typically 30-90 days)

---

## 🎯 Security Considerations

### Current Architecture

SCE operates primarily in **local-first** environments:
- Web: Runs in browser with no backend
- Desktop: Tauri app with local file system access
- Data: Stored locally (no cloud sync by default)

### Known Limitations

#### 1. Graph Injection Attacks
**Risk**: Malicious nodes or edges could be injected through user input  
**Status**: Basic sanitization implemented  
**Mitigation**: Input validation on entity creation

#### 2. Memory Exhaustion
**Risk**: Large graphs could cause memory issues  
**Status**: No hard limits enforced  
**Mitigation**: Monitor graph size, implement pruning

#### 3. Adversarial Activation Patterns
**Risk**: Carefully crafted queries could trigger unintended memory retrieval  
**Status**: Under research  
**Mitigation**: Activation thresholds provide some protection

#### 4. Local Storage Security
**Risk**: Sensitive data stored in browser localStorage/IndexedDB  
**Status**: No encryption at rest  
**Mitigation**: Users should not store sensitive data in alpha version

#### 5. Desktop File System Access
**Risk**: Tauri app has limited file system access  
**Status**: Scope-limited by Tauri permissions  
**Mitigation**: Review `src-tauri/tauri.conf.json` permissions

---

## 🔬 Security Research Welcome

As an AI safety-focused project, we **welcome security research** including:

### In Scope
- ✅ Memory manipulation attacks
- ✅ Adversarial query patterns
- ✅ Graph poisoning techniques
- ✅ Contradiction injection
- ✅ Privacy leakage through graph structure
- ✅ Resource exhaustion attacks
- ✅ Hebbian learning exploitation

### Out of Scope
- ❌ Social engineering
- ❌ Physical attacks
- ❌ Attacks requiring local system compromise
- ❌ Third-party dependencies (report to upstream)

### Responsible Disclosure
We follow a **coordinated disclosure** model:
1. Report vulnerability privately
2. Work with us on a fix
3. Public disclosure after patch release
4. Recognition in security advisory (if desired)

---

## 🏆 Security Acknowledgments

We recognize security researchers who help improve SCE:

### Hall of Fame
*No reports yet — be the first!*

---

## 🛠️ Security Best Practices

### For Users

**Web Version:**
- Don't store sensitive/personal data during alpha
- Use incognito mode for testing with real data
- Clear browser storage after sessions

**Desktop Version:**
- Review file permissions before building
- Don't grant unnecessary system access
- Keep application updated

**Development:**
- Don't commit API keys or credentials
- Use environment variables for sensitive config
- Review dependencies regularly (`npm audit`)

### For Contributors

- Run `npm audit` before submitting PRs
- Sanitize all user inputs
- Validate graph operations
- Document security implications of changes
- Use TypeScript strict mode
- Avoid `eval()` and `Function()` constructors

---

## 🔄 Security Updates

Security patches will be:
- Released as priority updates
- Documented in release notes
- Announced in repository discussions
- Tagged with `security` label

Subscribe to [repository releases](https://github.com/sasus-dev/synapse-context-engine/releases) to stay informed.

---

## 📚 Additional Resources

### AI Safety & Security
- [Adversarial Robustness Toolbox](https://adversarial-robustness-toolbox.org/)
- [AI Safety Reading List](https://aisafety.info/)
- [OWASP Machine Learning Security](https://owasp.org/www-project-machine-learning-security-top-10/)

### Graph Security
- [Graph Database Security Best Practices](https://neo4j.com/docs/operations-manual/current/security/)
- [Knowledge Graph Attacks](https://arxiv.org/abs/2010.12872)

---

## 📞 Contact

- **Security Issues**: Use GitHub Security Advisories (preferred)
- **General Security Questions**: [GitHub Discussions](https://github.com/sasus-dev/synapse-context-engine/discussions)
- **Maintainer**: Lasse "Sasu" Sainia - [sasus.dev](https://sasus.dev)

---

**Thank you for helping keep SCE and the community safe!** 🛡️