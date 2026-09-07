import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_ROOT = path.resolve(import.meta.dirname, '../docs');
const PUBLIC_ROOT = path.join(DOCS_ROOT, 'public');
const INDEX_PATH = path.join(DOCS_ROOT, 'index.html');
const CANONICAL_URL = 'https://alph0x.github.io/';
const SHARE_IMAGE_URL = `${CANONICAL_URL}images/portfolio-share.png`;
const TITLE = 'Alfredo E. Pérez Leal — iOS Lead & Software Architect';
const DESCRIPTION = 'Alfredo E. Pérez Leal is an iOS Lead and Software Architect building mobile payment products from Buenos Aires, Argentina.';

const contentOf = (html, selector) => {
  const attribute = selector.startsWith('link') ? 'href' : 'content';
  const name = selector.match(/(?:name|property|rel)="([^"]+)"/)?.[1];
  const matcher = new RegExp(`<${selector.startsWith('link') ? 'link' : 'meta'}(?=[^>]+(?:name|property|rel)="${name}")(?=[^>]+${attribute}="([^"]+)")[^>]+>`, 'i');
  return html.match(matcher)?.[1]?.replaceAll('&amp;', '&');
};

describe('portfolio metadata', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  it('publishes one consistent search and social identity', () => {
    expect(html).toMatch(/<html lang="en">/i);
    expect(contentOf(html, 'meta name="description"')).toBe(DESCRIPTION);
    expect(contentOf(html, 'link rel="canonical"')).toBe(CANONICAL_URL);
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);

    const required = {
      'og:type': 'website',
      'og:url': CANONICAL_URL,
      'og:title': TITLE,
      'og:description': DESCRIPTION,
      'og:image': SHARE_IMAGE_URL,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': 'Illustrated portfolio card for Alfredo E. Pérez Leal',
      'og:locale': 'en_US',
      'og:site_name': 'Alfredo E. Pérez Leal Portfolio',
      'twitter:card': 'summary_large_image',
      'twitter:title': TITLE,
      'twitter:description': DESCRIPTION,
      'twitter:image': SHARE_IMAGE_URL,
      'twitter:image:alt': 'Illustrated portfolio card for Alfredo E. Pérez Leal',
    };

    expect(Object.keys(required)).toHaveLength(15);
    for (const [property, value] of Object.entries(required)) {
      expect(contentOf(html, `meta property="${property}"`) ?? contentOf(html, `meta name="${property}"`)).toBe(value);
    }

    const socialKeys = [...html.matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[^"]+)"\s+content="[^"]+">/g)]
      .map((match) => match[1])
      .sort();
    expect(socialKeys).toEqual(Object.keys(required).sort());
  });

  it('uses only approved public facts in Person JSON-LD', () => {
    const jsonLd = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i)?.[1];
    expect(jsonLd).toBeTruthy();

    const person = JSON.parse(jsonLd);
    expect(person).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Alfredo E. Pérez Leal',
      jobTitle: 'iOS Lead & Software Architect',
      url: CANONICAL_URL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Buenos Aires',
        addressCountry: 'AR',
      },
      sameAs: ['https://github.com/alph0x'],
    });
  });

  it('keeps Spanish snippets explicitly marked and the manifest coherent', () => {
    expect(html).toContain('<span lang="es">Español</span>');
    expect(html).toContain('<button class="chat-chip" lang="es"');

    const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC_ROOT, 'manifest.json'), 'utf8'));
    expect(manifest.name).toBe('Alfredo E. Pérez Leal Portfolio');
    expect(manifest.short_name).toBe('Alfredo Pérez');
    expect(manifest.description).toBe(DESCRIPTION);
    expect(manifest.theme_color).toBe('#f5f0e1');
    expect(manifest.background_color).toBe('#f5f0e1');
  });

  it('ships one budgeted share image from the served public directory', () => {
    const shareImage = path.join(PUBLIC_ROOT, 'images', 'portfolio-share.png');
    expect(fs.existsSync(shareImage)).toBe(true);
    expect(fs.statSync(shareImage).size).toBeLessThanOrEqual(500 * 1024);

    const signature = fs.readFileSync(shareImage).subarray(0, 24);
    expect(signature.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(signature.readUInt32BE(16)).toBe(1200);
    expect(signature.readUInt32BE(20)).toBe(630);
  });
});
