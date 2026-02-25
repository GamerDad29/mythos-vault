import type { VaultEntityStub } from '../types';

function parseInline(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function linkifyEntities(html: string, stubs: VaultEntityStub[], currentId: string): string {
  const targets = [...stubs]
    .filter(s => s.id !== currentId)
    .sort((a, b) => b.name.length - a.name.length);
  if (targets.length === 0) return html;
  return html.replace(/((?:<[^>]*>)|([^<]+))/g, (match, _, textOnly) => {
    if (!textOnly) return match;
    let result = textOnly;
    for (const stub of targets) {
      const href = `/${stub.type.toLowerCase()}s/${stub.slug}`;
      const esc = stub.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`\\b(${esc})\\b`, 'gi'),
        `<a href="${href}" data-vault-link="true" style="color:hsl(25 100% 55%);text-decoration:underline;text-underline-offset:3px;cursor:pointer;">$1</a>`
      );
    }
    return result;
  });
}

export function stripHiddenBlocks(text: string): string {
  return text.replace(/\[HIDDEN\][\s\S]*?\[\/HIDDEN\]/gi, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function renderContent(text: string, accentColor: string, stubs: VaultEntityStub[] = [], currentId: string = ''): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  // li = linkified inline — applies inline markdown then cross-links
  const li = (t: string) => linkifyEntities(parseInline(t), stubs, currentId);

  const isSeparatorRow = (row: string) =>
    row.split('|').slice(1, -1).every(c => /^[\s:\-]+$/.test(c));

  const parseTableRow = (row: string) => {
    const parts = row.split('|');
    if (parts[0].trim() === '') parts.shift();
    if (parts[parts.length - 1].trim() === '') parts.pop();
    return parts.map(c => c.trim());
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    // Empty line
    if (!line) {
      nodes.push(<div key={k++} style={{ height: '0.4rem' }} />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      nodes.push(<div key={k++} className="forge-divider my-4" />);
      i++;
      continue;
    }

    // ## Section header
    if (line.startsWith('## ')) {
      nodes.push(
        <div key={k++} className="mt-8 mb-3">
          <p className="font-serif text-xs uppercase tracking-[0.25em]" style={{ color: accentColor }}>
            {line.slice(3).trim()}
          </p>
          <div className="forge-divider mt-1" />
        </div>
      );
      i++;
      continue;
    }

    // # Header
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      nodes.push(
        <p key={k++} className="font-serif font-bold text-lg uppercase tracking-wide mt-6 mb-2"
           style={{ color: 'hsl(15 4% 88%)' }}>
          {line.slice(2).trim()}
        </p>
      );
      i++;
      continue;
    }

    // ALL CAPS label (short section headers without ##)
    if (/^[A-Z][A-Z\s]+$/.test(line) && line.length < 40) {
      nodes.push(
        <div key={k++} className="mt-8 mb-3">
          <p className="font-serif text-xs uppercase tracking-[0.25em]" style={{ color: accentColor }}>
            {line}
          </p>
          <div className="forge-divider mt-1" />
        </div>
      );
      i++;
      continue;
    }

    // Pipe table — collect all consecutive table lines
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const dataRows = tableLines.filter(l => !isSeparatorRow(l));
      if (dataRows.length > 0) {
        const rows = dataRows.map(parseTableRow);
        nodes.push(
          <div key={k++} className="overflow-x-auto my-4">
            <table className="w-full text-center" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: ri === 0 ? `1px solid ${accentColor}44` : '1px solid hsl(15 8% 14%)' }}>
                    {row.map((cell, ci) => ri === 0 ? (
                      <th key={ci} className="font-serif text-xs uppercase tracking-wider py-2 px-2"
                          style={{ color: accentColor }}>
                        {cell}
                      </th>
                    ) : (
                      <td key={ci} className="font-sans py-2 px-2 text-sm" style={{ color: 'hsl(15 4% 78%)' }}
                          dangerouslySetInnerHTML={{ __html: li(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <div key={k++} className="my-3 pl-4" style={{ borderLeft: `2px solid ${accentColor}44` }}>
          <p className="font-display italic" style={{ color: 'hsl(15 4% 55%)', fontSize: '15px' }}
             dangerouslySetInnerHTML={{ __html: li(line.slice(2)) }} />
        </div>
      );
      i++;
      continue;
    }

    // List item (- or * followed by space, but not **bold**)
    if (/^[-*]\s+/.test(line) && !line.startsWith('**')) {
      nodes.push(
        <div key={k++} className="flex gap-2 my-1">
          <span style={{ color: accentColor, flexShrink: 0, marginTop: '2px' }}>·</span>
          <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 78%)', fontSize: '16px' }}
             dangerouslySetInnerHTML={{ __html: li(line.replace(/^[-*]\s+/, '')) }} />
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph with inline markdown
    nodes.push(
      <p key={k++} className="font-sans leading-relaxed"
         style={{ color: 'hsl(15 4% 78%)', fontSize: '17px', marginBottom: '0.5rem' }}
         dangerouslySetInnerHTML={{ __html: li(line) }} />
    );
    i++;
  }

  return nodes;
}
