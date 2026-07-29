const url = process.env.FINERACT_URL || '';
const allowed = process.env.E2E_TARGET === 'isolated-ci' && process.env.ALLOW_TRANSACTIONAL_E2E === 'true';
const blocked = ['demo.mifos.community','apis.mifos.community','oauth.mifos.community','2fa.mifos.community','oidc.mifos.community','elephant.mifos.community'];
let host = '';
try { host = new URL(url).hostname; } catch {}
if (!allowed) throw new Error('Transactional E2E requires E2E_TARGET=isolated-ci and ALLOW_TRANSACTIONAL_E2E=true');
if (!host || blocked.some(x => host === x || host.endsWith('.' + x))) throw new Error(`Refusing transactional E2E against blocked/shared host: ${host || url}`);
if (!['127.0.0.1','localhost','fineract'].includes(host)) throw new Error(`Transactional CI target must be local/isolated, got ${host}`);
console.log(`[guard] isolated transactional target accepted: ${url}`);
