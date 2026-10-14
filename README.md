# Saul's Record Deck

A portfolio and resume site built as an interactive turntable. Each project is a record: press a pad to drop
the needle, read about the project on its sleeve, and open it on GitHub.

Plain HTML, CSS and JavaScript. No build step.

## Edit your content
Everything the site shows comes from `js/data.js`. Replace anything in `[brackets]` with your real details
(name, title, bio, email, LinkedIn, education, experience, your role on the team project).
To add a project, copy one of the objects in `tracks` and change its fields.
To add a downloadable resume, put `resume.pdf` next to `index.html` and set `resumePdf: "resume.pdf"`.

## Run it locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Put it online with GitHub Pages
1. Create a repository named `supremey17.github.io` (or any name).
2. Upload the contents of this folder to it.
3. In the repository, go to Settings > Pages, choose "Deploy from a branch", branch `main`, folder `/ (root)`.
4. The site appears at https://supremey17.github.io (or https://supremey17.github.io/<repo-name>).

## Files
- `index.html` page structure
- `js/data.js` your projects and resume content
- `css/base.css` colors, fonts, page layout
- `css/deck.css`, `js/deck.js` the turntable
- `css/panel.css`, `js/panel.js` the record sleeve (project details) and liner notes (resume)
