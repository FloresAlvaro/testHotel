// Baseline fixtures explicitly disable MFA; dedicated MFA regressions enable it.
process.env.MFA_ENABLED ??= 'false';
