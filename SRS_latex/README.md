# Building the SRS in VS Code

This folder is configured to build the SRS with VS Code and LaTeX Workshop. The PDF preview opens in a VS Code tab, and saving a `.tex` file rebuilds the PDF automatically.

## One-time setup

### 1. Install a LaTeX distribution

LaTeX Workshop is the VS Code interface; it does not include LaTeX itself. Install a distribution that provides both `pdflatex` and `latexmk`:

- **Windows:** Install [MiKTeX](https://miktex.org/download). Open MiKTeX Console, check for updates, and enable installation of missing packages when prompted. If `latexmk` is missing, install the `latexmk` package using MiKTeX Console.
- **macOS:** Install [MacTeX](https://www.tug.org/mactex/), which includes TeX Live and `latexmk`.
- **Linux:** Install TeX Live and `latexmk` using your distribution's package manager. On Debian/Ubuntu, for example, install `texlive-latex-extra`, `latexmk`, and `texlive-fonts-recommended`. If compilation reports a missing LaTeX package, install the corresponding TeX Live package.

After installation, restart VS Code so it can find the LaTeX commands. In a new terminal, `pdflatex --version` and `latexmk -v` should both work. If either command is not recognized, add the distribution's binary folder to `PATH`, then restart VS Code.

### 2. Install the VS Code extension

Open this `SRS_latex` folder in VS Code. When prompted, install the recommended **LaTeX Workshop** extension (`James-Yu.latex-workshop`). The recommendation is saved in `.vscode/extensions.json` for the whole team.

## Build and preview

1. Open `main.tex`.
2. Press **Ctrl+Alt+B** (Windows/Linux) or **Cmd+Option+B** (macOS), or run **LaTeX Workshop: Build LaTeX project** from the Command Palette.
3. LaTeX Workshop builds using `latexmk` and `pdfLaTeX`. The PDF opens in a VS Code editor tab.
4. Save any `.tex` file to rebuild automatically. To see the PDF beside the source, drag its tab to the right-hand editor group, or use **View → Editor Layout → Split Right**.

The generated PDF and temporary build files go in `.latex-workshop/`. This folder is ignored by Git; do not add generated files to source control.

## Editing the document

- Update title-page metadata and the guidance-box toggle in `main.tex`.
- Edit content in `prelims/`, `chapters/`, and `appendices/`.
- Keep these folders and `srsdocument.cls` together with `main.tex`; the document uses relative `\input{...}` paths and a project-local class.
- The PDF preview supports SyncTeX: Ctrl-click a location in the PDF to jump to the corresponding source.

If a build fails, open **View → Output**, choose **LaTeX Workshop** in the Output panel, and read the first error. Confirm both `pdflatex` and `latexmk` are installed and available on `PATH`.
