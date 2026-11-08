# Beecome Through Play

The website for **Beecome Through Play**: play therapy, workshops and parenting tips in Centurion.
Playroom design: her own colours (teal, aqua, wreath greens, white), her logo and her line-art bee.

## ✍️ Writing a blog post

1. Open **write.html** on the website (it isn't in the menu, so bookmark it).
2. Fill in a title and your text. The preview on the right shows how it will look.
3. Press **Publish on GitHub**. GitHub opens with your post filled in.
4. Press the green **Commit changes…** button, then **Commit changes** again.
5. About two minutes later the post is on the blog.

**Adding a cover picture:** on GitHub open `src/posts/images` → **Add file** → **Upload files** → drop the photo in →
**Commit changes**. Then type the photo's file name (e.g. `sleep.jpg`) in the *Cover picture* box.

**Editing or removing a post:** open `src/posts` on GitHub, click the post, then the ✏️ pencil (edit) or the **…** menu
(delete), and commit. To hide a post without deleting it, add `draft: true` between the `---` lines at the top.

## The questionnaire

`questionnaire.html` sends answers into the existing Google Form (*Strengths and Difficulties Questionnaire*),
so they still arrive under **Responses** in Google Forms. If a question on the Google Form changes, its
"entry" number must be updated in `src/content/questionnaire.js`.

## Changing contact details

WhatsApp, email, Facebook, Instagram, memberships and locations are in `src/content/site.js`.

## For whoever maintains the site

```bash
npm install
node scripts/build.mjs   # builds the site into dist/ (also works opened straight from the folder)
```

GitHub Actions (`.github/workflows/pages.yml`) runs the same build on every change and publishes `dist/` to
GitHub Pages.

| Path | What |
| --- | --- |
| `src/pages/*.html` | Page content |
| `src/posts/*.md` | Blog posts (each becomes `post-<name>.html`) |
| `src/content/` | Contact details and the questionnaire's Google Form field numbers |
| `src/css/base.css` | Layout and components |
| `src/themes/playroom/` | Colours, shapes, home hero, page art and footer art |
| `src/js/` | Menu, Display settings (colours, text size), questionnaire, blog writer, bee animations |

Checked with checkcraft on every page: 0 errors, 0 warnings (light, dark, phone, tablet, 200% text).
