---
layout: docs
title: CMS Guide
next_title: File Reference
next_url: /docs/reference.html
---

Blog posts and the About page's career history are meant to be edited through **Decap CMS** (formerly Netlify CMS), a browser-based admin panel that commits changes back to this GitHub repo — no local setup, no code editing required for routine content changes. It lives at `/admin` on the live site.

<div class="docs-note">
Decap's editor UI itself needs a live GitHub OAuth login to open, so it can't be screenshotted here in an isolated docs build. Everything below reflects exactly what's configured in <code>admin/config.yml</code> — the real behavior you'll see once logged in.
</div>

## Opening it

Go to `https://nekarantanis.co.uk/admin/`, sign in with GitHub when prompted, and you'll land on a list of two collections: **Blog Posts** and **About Page**. A small "View site ↗" button is pinned to the bottom-right corner of every CMS screen (added in `admin/index.html`) so you can jump back to the live site without hunting for the tab.

## How saving works: editorial workflow

`admin/config.yml` sets `publish_mode: editorial_workflow`, which means an edit doesn't go straight to the live `main` branch the moment you save. Instead, Decap moves each entry through **Draft → In Review → Ready**, backed by a real GitHub pull request — so you can leave a post half-written, come back later, and nothing goes live until you explicitly publish it from the editor. This is the same GitHub permissions your own login already has; there's no separate CMS-only auth level.

Locally, `local_backend: { url: http://localhost:8082/api/v1 }` lets you run the CMS against `npx decap-server` for testing without hitting GitHub at all.

## Editing a blog post

Click **Blog Posts** → an existing post, or **New Blog Post**. The fields, top to bottom:

| Field | Widget | Notes |
|---|---|---|
| Title | text | |
| Date | datetime | Format locked to `YYYY-MM-DD` |
| Featured | boolean | Pins this post to the top of the Blog page instead of the grid. If left off everywhere (or checked on more than one post), the newest post wins. |
| Category | select | Fixed list — reuse an existing one where it fits, since it drives both the grid's category filter and the grouped view in this same editor. |
| Icon | **icon-picker** (custom) | See below. |
| Card summary | text | Shown only on the Blog grid card, not the post itself. |
| Tags | list | Free-form; each becomes a clickable filter pill on the Blog page. |
| Body | markdown | The first paragraph renders larger, as the lede. A Markdown `>` blockquote becomes the large pull-quote style (and gets the typewriter effect on the live page). |

The post list can be grouped by Category and pre-filtered by two tags (`view_groups` / `view_filters` in config), purely to make a long post list easier to scan while editing — this has no effect on the live site.

## Editing career history (About page)

**About Page** → **Career Roles** is a single YAML file (`_data/roles.yml`), not one file per company. Its `roles` list is nested: each entry is a **company** (with its own logo, subtitle, date range, and blurb), containing a list of **positions** held there. Every position has:

- a date range, title, and icon
- **Primary** — checked for the current/most senior role at that company, which renders as a highlighted box; leave unchecked for earlier roles at the same place, which render as a plainer sub-entry underneath
- bullets (the role's actual responsibilities/achievements) and optional tags

The `section` field on each company (`leadership` / `digital` / `research`) determines which of the About page's three jump-linked sections it appears under — it isn't automatic from anything else, so pick it deliberately when adding a new company.

## The icon picker

Both the post `icon` field and each position's `icon` field use a **custom widget** (`admin/icon-picker.js`) instead of Decap's default dropdown, registered via `CMS.registerWidget('icon-picker', ...)`. Rather than picking a name from a `<select>`, you get every icon laid out as a clickable grid — each tile shows the actual icon plus its label, so you can recognize the right one visually instead of guessing from a name:

<figure>
  <img src="/docs/assets/screenshots/cms-icon-picker.png" alt="The icon picker widget showing a grid of 41 selectable icons, with Monkey selected">
  <figcaption>The icon-picker widget — 41 icons, alphabetically ordered, click to select. (Reconstructed here from the widget's own icon set for this screenshot, since the live widget only renders inside a logged-in CMS session.)</figcaption>
</figure>

Clicking a tile calls the field's `onChange` with that icon's key (e.g. `"monkey"`), which is exactly the string stored in the post/role's front matter and passed to `{% include post-icon.html icon="monkey" %}` when the page renders — so the CMS widget and the live site are guaranteed to agree on what each name means, since `_includes/post-icon.html` and `admin/icon-picker.js` both hardcode the same set of keys pointing at the same SVG path data. **If you ever add a new icon, add it in both places** — the comment at the top of `icon-picker.js` calls this out explicitly.

## The live preview

The right-hand preview pane, by default, would render Decap's generic Markdown styling — not what the post actually looks like live. `admin/preview.js` fixes this two ways:

1. `CMS.registerPreviewStyle(...)` loads the real Google Fonts, `bootstrap.min.css`, and `custom.css` into the preview iframe — the exact stylesheets the live site uses.
2. `CMS.registerPreviewTemplate('posts', PostPreview)` replaces the default preview layout with one built from the site's *real* classnames (`section-dark-dotted`, `post-header-inner`, `post-body-inner`, etc.) rather than approximated inline styles — so a dark header block with the title renders exactly as it will on the published page, with the same fonts, spacing, and pull-quote styling.

## Media uploads

The default media folder is `uploads/`, but posts and role logos each override it to their own subfolder (`/uploads/posts`, `/uploads/logos`) via `media_folder`/`public_folder` on those specific fields — so images stay organized by type rather than all landing in one flat folder. Existing role logos happen to live directly under `uploads/` rather than `uploads/logos/`; that's fine and won't break anything, the override only changes where *new* uploads land.
