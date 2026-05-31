# Source Policy

External source policy for the LRS tester:

- Treat upstream/reference repositories as read-only unless explicitly approved.
- Use external repositories only as references for direct API test runner patterns or container packaging patterns.
- Do not copy parity/oracle tooling into the tester unless it is needed for the LRS execution path.
