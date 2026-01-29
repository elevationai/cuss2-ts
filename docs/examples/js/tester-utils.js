const ALLOWED_PROTOCOLS = ['http:', 'https:', 'ws:', 'wss:'];

export function extractStatusCodeFromError(error) {
  if (!error) return null;
  if (error.messageCode && typeof error.messageCode === 'string') return error.messageCode;
  if (typeof error.message === 'string') {
    const match = error.message.match(/status code:\s*([A-Z_]+)/i);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

export function validateURL(url, urlType = 'URL') {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { isValid: false, error: `${urlType} cannot be empty` };
  }
  try {
    const parsedUrl = new URL(url.trim());
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      const allowedList = ALLOWED_PROTOCOLS.map(p => p.replace(':', '://')).join(', ');
      return { isValid: false, error: `${urlType} uses unsupported protocol '${parsedUrl.protocol}'. Only ${allowedList} are supported.` };
    }
    return { isValid: true, url: parsedUrl.href };
  } catch {
    return { isValid: false, error: `${urlType} is not a valid URL format` };
  }
}

export function checkMixedContent(targetUrl) {
  if (location.protocol !== 'https:') return { hasMixedContent: false };
  try {
    const url = new URL(targetUrl);
    const isHttpTarget = url.protocol === 'http:' || url.protocol === 'ws:';
    return {
      hasMixedContent: isHttpTarget,
      currentProtocol: location.protocol,
      targetProtocol: url.protocol,
      suggestedUrl: isHttpTarget
        ? targetUrl.replace(/^(ws|http):/, url.protocol === 'ws:' ? 'wss:' : 'https:')
        : targetUrl,
    };
  } catch {
    return { hasMixedContent: false };
  }
}

export function generateOAuthUrl(wsUrl) {
  if (!wsUrl) return '';
  try {
    const hasProtocol = /^(ws|wss|http|https):\/\//.test(wsUrl);
    const normalizedUrl = hasProtocol ? wsUrl : `http://${wsUrl}`;
    const url = new URL(normalizedUrl);
    let httpScheme;
    if (url.protocol === 'wss:') httpScheme = 'https:';
    else if (url.protocol === 'ws:') httpScheme = 'http:';
    else httpScheme = url.protocol;
    return `${httpScheme}//${url.host}/oauth/token`;
  } catch {
    return '';
  }
}
