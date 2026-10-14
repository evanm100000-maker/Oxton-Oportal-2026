import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Normalizes a URL so that it is always an absolute http/https URL suitable for an href.
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed) || /^discord\.gg\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  // If it contains a slash or domain pattern, prefix https://
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Renders any string into React elements where URLs and markdown links [Label](url)
 * are rendered as clickable, openable <a> links that open in a new tab.
 *
 * @param {string} text - The input text containing links or markdown links.
 * @param {object} options - Custom style options.
 * @returns {React.ReactNode}
 */
export function renderTextWithLinks(text, options = {}) {
  if (!text || typeof text !== 'string') return text;

  const {
    linkColor = '#38bdf8',
    showIcon = true,
    underline = true,
    style = {}
  } = options;

  // Regex patterns
  // 1. Markdown link: [Label](url)
  const MARKDOWN_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+|discord\.gg\/[^\s)]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s)]*)\)/g;

  // 2. Direct raw URL: https://... or http://... or www.... or discord.gg/...
  // Uses trailing punctuation stripping to keep trailing periods, commas, or parentheses out of the URL.
  const RAW_URL_REGEX = /((?:https?:\/\/|www\.|discord\.gg\/)[^\s<>"'()]+(?:\([^\s<>"'()]+\)|[^\s<>"'().,:;?!\]]))/gi;

  const result = [];
  let lastIndex = 0;
  let mdMatch;

  // Helper to parse raw URLs from plain string segments
  const parseRawUrlsInto = (str, keyPrefix) => {
    let rawLastIndex = 0;
    let urlMatch;
    const regex = new RegExp(RAW_URL_REGEX);

    while ((urlMatch = regex.exec(str)) !== null) {
      if (urlMatch.index > rawLastIndex) {
        result.push(str.substring(rawLastIndex, urlMatch.index));
      }

      const rawUrl = urlMatch[1];
      const href = normalizeUrl(rawUrl);

      result.push(
        <a
          key={`${keyPrefix}-raw-${urlMatch.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            color: linkColor,
            textDecoration: underline ? 'underline' : 'none',
            textUnderlineOffset: '3px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            wordBreak: 'break-all',
            cursor: 'pointer',
            transition: 'color 0.15s ease, opacity 0.15s ease',
            ...style
          }}
          className="hover:opacity-80"
          title={`Open ${href} in new tab`}
        >
          <span>{rawUrl}</span>
          {showIcon && <ExternalLink size={12} style={{ display: 'inline', flexShrink: 0, opacity: 0.85 }} />}
        </a>
      );

      rawLastIndex = regex.lastIndex;
    }

    if (rawLastIndex < str.length) {
      result.push(str.substring(rawLastIndex));
    }
  };

  while ((mdMatch = MARKDOWN_REGEX.exec(text)) !== null) {
    if (mdMatch.index > lastIndex) {
      parseRawUrlsInto(text.substring(lastIndex, mdMatch.index), `pre-${mdMatch.index}`);
    }

    const label = mdMatch[1];
    const rawUrl = mdMatch[2];
    const href = normalizeUrl(rawUrl);

    result.push(
      <a
        key={`md-${mdMatch.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          color: linkColor,
          textDecoration: underline ? 'underline' : 'none',
          textUnderlineOffset: '3px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          wordBreak: 'break-word',
          cursor: 'pointer',
          transition: 'color 0.15s ease, opacity 0.15s ease',
          ...style
        }}
        className="hover:opacity-80"
        title={`Open ${href} in new tab`}
      >
        <span>{label}</span>
        {showIcon && <ExternalLink size={13} style={{ display: 'inline', flexShrink: 0, opacity: 0.85 }} />}
      </a>
    );

    lastIndex = MARKDOWN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parseRawUrlsInto(text.substring(lastIndex), `tail-${lastIndex}`);
  }

  return result.length > 0 ? result : text;
}
