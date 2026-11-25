# Wiki workflow

The project wiki is written as Markdown files in the **`wiki/`** folder of this repository, so every wiki
change is reviewed in a pull request like code. The GitHub Wiki (`aspire-system.wiki.git`) is the published copy.

## One-time setup (repository owner)

1. GitHub → repository **Settings → Features** → tick **Wikis**.
2. Open the **Wiki** tab and click **Create the first page** (save anything; it is overwritten later).
3. Clone the wiki next to the project:

```bash
git clone https://github.com/Nakib00/aspire-system.wiki.git ../aspire-wiki
```

## Changing the wiki (everyone)

1. Create a branch: `git switch -c docs/<what-you-change>`.
2. Edit files in `wiki/`. One page = one file named `Title-With-Dashes.md`. Link pages with `[Text](Page-Name)`.
3. Commit with `docs: ...`, push, open a pull request, get a review.
4. After the merge, the owner publishes (below).

## Publishing (after merge)

```bash
git switch main && git pull
rm -rf ../aspire-wiki/*.md
cp wiki/*.md ../aspire-wiki/
cd ../aspire-wiki
git add -A
git commit -m "docs: sync wiki from main"
git push
```

(`_Sidebar.md` and `Home.md` are special pages: sidebar on every page, and the landing page.)

## Page list

See `wiki/_Sidebar.md`. Start from `wiki/Home.md`.

## Rules

* Every page starts with a `#` title and says who it is for.
* Prefer tables and short lists; explain **why**, not only what.
* Do not paste secrets, real passwords or personal data.
* If you change setup, the database or the API, update the matching page in the same pull request.
* Diagrams use Mermaid code blocks (GitHub renders them).
