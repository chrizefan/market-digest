import { renderDigestMarkdownFromSnapshot, type DigestSnapshot } from './render-digest-from-snapshot';

function s(v: unknown): string {
  return v == null ? '' : String(v);
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function renderDocumentMarkdownFromPayload(payload: unknown): string | null {
  const p = asObj(payload);
  if (!p) return null;

  // Back-compat: digest snapshot payload has no doc_type.
  if (p.regime || p.portfolio || p.sector_scorecard) {
    try {
      return renderDigestMarkdownFromSnapshot(payload as DigestSnapshot);
    } catch {
      /* noop */
    }
  }

  const docType = s(p.doc_type);
  if (!docType) return null;

  const dateStr = s(p.date);

  if (docType === 'research_changelog') {
    const items = Array.isArray(p.items) ? p.items : [];
    const out: string[] = [`# Research changelog${dateStr ? ` — ${dateStr}` : ''}`, ''];
    for (const it of items) {
      const o = asObj(it);
      if (!o) continue;
      out.push(
        `- **${s(o.target_document_key)}** (${s(o.status)}): ${s(o.one_line_change)} _${s(o.severity)}_`
      );
    }
    return `${out.join('\n').trim()}\n`;
  }

  if (docType === 'research_baseline_manifest') {
    const docs = Array.isArray(p.documents) ? p.documents : [];
    const out: string[] = [`# Research baseline manifest${dateStr ? ` — ${dateStr}` : ''}`, ''];
    for (const row of docs) {
      const o = asObj(row);
      if (!o) continue;
      out.push(`- ${s(o.document_key)}${s(o.phase) ? ` (${s(o.phase)})` : ''}`);
    }
    if (s(p.prior_context_note).trim()) {
      out.push('', '## Prior context', s(p.prior_context_note).trim());
    }
    return `${out.join('\n').trim()}\n`;
  }

  if (docType === 'document_delta') {
    const out: string[] = [
      `# Document delta${dateStr ? ` — ${dateStr}` : ''}`,
      '',
      `**Target:** ${s(p.target_document_key)}`,
      `**Status:** ${s(p.status)}`,
    ];
    if (s(p.skip_reason).trim()) out.push(`**Skip reason:** ${s(p.skip_reason).trim()}`);
    const ops = Array.isArray(p.ops) ? p.ops : [];
    if (ops.length) {
      out.push('', '## Ops');
      for (const op of ops) {
        const o = asObj(op);
        if (!o) continue;
        out.push(`- \`${s(o.op)}\` ${s(o.path)}${s(o.reason) ? ` — ${s(o.reason)}` : ''}`);
      }
    }
    return `${out.join('\n').trim()}\n`;
  }

  if (docType === 'deep_dive') {
    const title = s(p.title) || 'Deep Dive';
    const body = asObj(p.body) || {};
    const md = s(body.markdown);
    if (md.trim()) return md.trimEnd() + '\n';
    return `# ${title}${dateStr ? ` — ${dateStr}` : ''}\n\n_No content available._\n`;
  }

  const lines: string[] = [];
  lines.push(`# ${docType.replace(/_/g, ' ').toUpperCase()}${dateStr ? ` — ${dateStr}` : ''}`);
  lines.push('');

  const body = asObj(p.body) || {};

  if (docType === 'weekly_digest') {
    lines.push('## Executive Summary');
    lines.push(s(body.executive_summary).trim());
    lines.push('');
    lines.push('## Key Takeaway');
    lines.push(s(body.key_takeaway).trim());
    lines.push('');
    return `${lines.join('\n').trim()}\n`;
  }

  if (docType === 'monthly_digest') {
    lines.push('## Month in Review');
    lines.push(s(body.month_in_review).trim());
    lines.push('');
    lines.push('## Key Learning');
    lines.push(s(body.key_learning).trim());
    lines.push('');
    return `${lines.join('\n').trim()}\n`;
  }

  if (docType === 'rebalance_decision') {
    lines.push('## PM Notes');
    lines.push(s(body.pm_notes).trim());
    lines.push('');
    const table = (body.rebalance_table as unknown[]) || [];
    if (Array.isArray(table) && table.length) {
      lines.push('## Rebalance Table');
      lines.push('| Ticker | Current% | Recommended% | Change | Action | Urgency | Rationale |');
      lines.push('|---|---:|---:|---:|---|---|---|');
      for (const row of table) {
        const r = asObj(row) || {};
        lines.push(
          `| ${s(r.ticker)} | ${s(r.current_pct)} | ${s(r.recommended_pct)} | ${s(r.change_pct)} | ${s(r.action)} | ${s(r.urgency)} | ${s(r.rationale)} |`
        );
      }
      lines.push('');
    }
    return `${lines.join('\n').trim()}\n`;
  }

  // Generic fallback: show body JSON for debugging rather than empty.
  lines.push('## Payload');
  try {
    lines.push('```json');
    lines.push(JSON.stringify(payload, null, 2));
    lines.push('```');
  } catch {
    lines.push('_Unable to render payload._');
  }
  lines.push('');
  return `${lines.join('\n').trim()}\n`;
}

