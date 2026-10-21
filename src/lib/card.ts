/*
 * The virtual business card: one source for the /card page and the vCard it hands out,
 * so the two can never disagree.
 */
export const card = {
  given: 'David',
  family: 'Aragort',
  role: 'Digital security specialist, digital rights advocate and Ateneo Abierto founder',
  email: 'ateneo@aragort.com',
  signal: { name: 'david.212', href: 'https://signal.me/#eu/HYYZw08LbQ7QK7askiGHW5_ufvdwcJZOQe0gYAGOHQNReaYiDqdGFJpYKP6TMxZJ' },
  linkedin: { name: 'linkedin.com/in/davidaragort', href: 'https://www.linkedin.com/in/davidaragort' },
  web: { name: 'aragort.com', href: 'https://aragort.com' },
  /** Linked where the role names it: the English page for funders, as on the printed card. */
  ateneo: { name: 'Ateneo Abierto', href: 'https://ateneo-abierto.org/funders' },
} as const;

/** RFC 6350 text escaping: backslash, comma, semicolon and newline. */
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/**
 * vCard 3.0, not 4.0: it is the version both the iOS and Android contact importers read
 * without complaint. The item.X-ABLabel pairs name each link in Apple Contacts.
 */
export function vcard(): string {
  const { given, family, role, email, signal, linkedin, web, ateneo } = card;
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(`${given} ${family}`)}`,
    `TITLE:${esc(role)}`,
    `EMAIL;TYPE=INTERNET:${email}`,
    `item1.URL:${web.href}`,
    'item1.X-ABLabel:Web',
    `item2.URL:${linkedin.href}`,
    'item2.X-ABLabel:LinkedIn',
    `item3.URL:${signal.href}`,
    'item3.X-ABLabel:Signal',
    `item4.URL:${ateneo.href}`,
    `item4.X-ABLabel:${esc(ateneo.name)}`,
    `NOTE:${esc(`Signal: ${signal.name}`)}`,
    'END:VCARD',
    '',
  ].join('\r\n');
}
