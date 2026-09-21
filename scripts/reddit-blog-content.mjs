import fs from 'node:fs';
import path from 'node:path';

export const REDDIT_BLOG_DATA_DIR = 'data/reddit-blog-posts';
const imagePath = '/assets/brand/factory-oem-quality-2026.jpg';

export function readRedditBlogRecords(rootDir) {
  const directory = path.join(rootDir, REDDIT_BLOG_DATA_DIR);
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory)
    .filter(file => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort()
    .map(file => {
      const filePath = path.join(directory, file);
      const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(article.date ?? '')) {
        throw new Error(`${filePath}: invalid publication date`);
      }
      if (file !== `${article.date}.json`) {
        throw new Error(`${filePath}: filename does not match its publication date`);
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug ?? '')) {
        throw new Error(`${filePath}: invalid article slug`);
      }
      if (!Array.isArray(article.sections) || article.sections.length < 6) {
        throw new Error(`${filePath}: expected at least six article sections`);
      }
      if (!Array.isArray(article.redditSources) || article.redditSources.length < 2) {
        throw new Error(`${filePath}: expected at least two attributed Reddit sources`);
      }
      for (const source of article.redditSources) {
        if (!/^\/r\/[A-Za-z0-9_]+\/comments\/[A-Za-z0-9]+(?:\/[^/?#]*)*\/?$/.test(source.permalink ?? '')) {
          throw new Error(`${filePath}: invalid Reddit permalink`);
        }
      }
      return article;
    });
}

export function redditBlogRoutes(rootDir) {
  return readRedditBlogRecords(rootDir).map(article => `/insights/${article.slug}/`);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function articleBody(sections) {
  return sections.map(section => {
    const paragraphs = section.paragraphs
      .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
      .join('\n');
    const bullets = Array.isArray(section.bullets) && section.bullets.length
      ? `<ul>${section.bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';
    return `<h2>${escapeHtml(section.heading)}</h2>\n${paragraphs}${bullets}`;
  }).join('\n');
}

export function toRedditInsight(article, imageDimensions) {
  const sources = article.redditSources.map(source => {
    const author = source.author && source.author !== '[deleted]' ? `u/${source.author}` : 'deleted account';
    return [
      `https://www.reddit.com${source.permalink}`,
      `${source.title} — r/${source.subreddit}, ${author}`,
      `Community discussion cited as a qualitative topic signal (${source.score} upvotes and ${source.commentCount} comments when reviewed).`
    ];
  });

  return {
    id: `reddit-${article.date}-${article.slug}`,
    slug: article.slug,
    title: article.title,
    seoTitle: article.seoTitle,
    date: article.date,
    datePublished: article.date,
    dateModified: article.date,
    cat: 'Community-informed packaging guide',
    excerpt: article.excerpt,
    imagePath,
    imageWidth: imageDimensions.width,
    imageHeight: imageDimensions.height,
    alt: 'Packaging samples and quality review materials at GloryStarPack',
    body: articleBody(article.sections),
    decisionTable: article.decisionTable,
    consideration: article.selectionConsideration,
    questions: article.buyerQuestions,
    note: article.procurementNote,
    resources: article.relatedResources,
    discussionSignals: sources,
    sources: [
      [
        'https://www.fda.gov/cosmetics/cosmetics-guidance-documents/good-manufacturing-practice-gmp-guidelinesinspection-checklist-cosmetics',
        'FDA cosmetic GMP guidelines and inspection checklist',
        'Covers control, storage and records for raw and primary packaging materials.'
      ],
      [
        'https://www.iso.org/standard/36437.html',
        'ISO 22716:2007 cosmetic GMP overview',
        'Provides quality guidance for cosmetic production, control, storage and shipment.'
      ]
    ],
    sourceNote: 'These references provide general quality-system context. They do not establish compatibility, performance, compliance or test results for a specific package or formula. Reddit discussions are qualitative demand signals, not technical evidence or a representative survey.',
    inquiryCopy: 'Share the application or formula, capacity, material preference, closure or dispensing component, decoration, estimated quantity, destination country, target timing and any reference drawings or photos. Final specifications, MOQ, availability and testing requirements are confirmed for the selected configuration.'
  };
}
