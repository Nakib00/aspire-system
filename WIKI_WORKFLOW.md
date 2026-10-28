# Edit the GitHub Wiki from VS Code

The GitHub wiki is a separate Git repository from the ASPIRE app. The workspace file `aspire.code-workspace` opens both repositories together, while VS Code keeps their source control changes and commits separate.

## One-time setup on each computer

1. Install Git and VS Code. Sign in to GitHub in your usual Git credential manager or configure GitHub CLI authentication.
2. Open a terminal in the ASPIRE app repository root.
3. Clone the wiki beside the app repository:

   ```powershell
   git clone https://github.com/Nakib00/aspire-system.wiki.git ..\aspire-system.wiki
   ```

   This sibling location is expected by the shared workspace file. The wiki repository URL was checked and is reachable.
4. Open `aspire.code-workspace` in VS Code:

   ```powershell
   code .\aspire.code-workspace
   ```

   The Explorer and Source Control views will show both **ASPIRE App** and **ASPIRE Wiki**. If the `code` command is unavailable, use **File → Open Workspace from File...** and select `aspire.code-workspace`.

## Edit and publish wiki pages

1. In the **ASPIRE Wiki** folder, edit an existing `.md` page or create a new Markdown page. `Home.md` is the wiki home page; `_Sidebar.md` controls the sidebar when present.
2. Before starting work, pull the latest wiki changes:

   ```powershell
   git -C ..\aspire-system.wiki pull --rebase
   ```
3. Review the wiki repository in VS Code's Source Control view. Stage and commit the wiki changes there, making sure the selected repository is **ASPIRE Wiki**, not **ASPIRE App**.
4. Push the wiki commit:

   ```powershell
   git -C ..\aspire-system.wiki push
   ```

   Alternatively, use the Source Control menu for the **ASPIRE Wiki** repository to commit and sync.

Only users with permission to edit this GitHub repository's wiki can push changes. If push is rejected because someone else updated the wiki, pull/rebase again, resolve any conflicts, then push.

## Notes

- Wiki content lives in the separate `aspire-system.wiki` repository; do not put wiki pages inside the app repository.
- A wiki page is a Markdown file. GitHub displays the committed pages on the repository's Wiki tab after they are pushed.
- Changes to the app and wiki are committed and pushed independently.
- Each teammate should clone the wiki once at the expected sibling path. If it is cloned elsewhere, update the wiki folder path in `aspire.code-workspace`.
