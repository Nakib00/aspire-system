% =====================================================================
%  srsdocument.cls — Professional SRS document class
%  Structure inspired by OscarM3615/srs-template (IEEE 830 / ISO 29148),
%  restyled and adapted to: Introduction -> Overall Description -> Requirements
% =====================================================================
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{srsdocument}[2026/10/11 Professional SRS Document]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{report}}
\ProcessOptions\relax
\LoadClass[11pt,a4paper,oneside]{report}

% ---------- Core packages ----------
\RequirePackage[T1]{fontenc}
\RequirePackage[utf8]{inputenc}
\RequirePackage{mathptmx}                 % Times body text
\RequirePackage[scaled=0.92]{helvet}      % Helvetica for headings
\RequirePackage[a4paper,top=2.5cm,bottom=2.5cm,left=2.5cm,right=2.5cm,headheight=28pt]{geometry}
\RequirePackage{setspace}
\RequirePackage{parskip}
\RequirePackage{graphicx}
\RequirePackage[table]{xcolor}
\RequirePackage{array,tabularx,longtable,booktabs,makecell}
\RequirePackage{enumitem}
\RequirePackage{titlesec}
\RequirePackage{fancyhdr}
\RequirePackage{lastpage}
\RequirePackage[font=small,labelfont=bf]{caption}
\RequirePackage{float}                    % [H] keeps tables under their headings
\RequirePackage[most]{tcolorbox}
\RequirePackage[hidelinks]{hyperref}

\onehalfspacing
\setlist{itemsep=1pt,topsep=3pt}
\graphicspath{{./assets/}}

% ---------- Colours ----------
\definecolor{srsprimary}{RGB}{0,51,102}     % deep navy
\definecolor{srsaccent}{RGB}{0,112,192}
\definecolor{srshead}{RGB}{226,233,242}     % table header fill
\definecolor{srsrow}{RGB}{247,249,252}      % zebra rows
\definecolor{srsgray}{RGB}{90,90,90}

% ---------- Document metadata ----------
\newcommand{\projectname}[1]{\def\@projectname{#1}}
\newcommand{\docversion}[1]{\def\@docversion{#1}}
\newcommand{\docid}[1]{\def\@docid{#1}}
\newcommand{\organization}[1]{\def\@organization{#1}}
\newcommand{\preparedby}[1]{\def\@preparedby{#1}}
\newcommand{\preparedfor}[1]{\def\@preparedfor{#1}}
\newcommand{\docstatus}[1]{\def\@docstatus{#1}}
\newcommand{\logo}[1]{\def\@logo{#1}}
\projectname{Project Name}\docversion{1.0}\docid{SRS-000}
\organization{Organization}\preparedby{Author}\preparedfor{Client / Course}
\docstatus{Draft}\def\@logo{}
\newcommand{\theproject}{\@projectname}
\newcommand{\theversion}{\@docversion}
\newcommand{\thedocid}{\@docid}
\newcommand{\thedocstatus}{\@docstatus}

% ---------- Headings (sans-serif, navy) ----------
\titleformat{\chapter}[display]
  {\sffamily\bfseries\color{srsprimary}}
  {\large\MakeUppercase{\chaptertitlename}\ \thechapter}
  {4pt}
  {\Huge}[{\color{srsaccent}\titlerule[1.2pt]}]
\titlespacing*{\chapter}{0pt}{-10pt}{18pt}
\titleformat{\section}{\sffamily\Large\bfseries\color{srsprimary}}{\thesection}{0.8em}{}
\titleformat{\subsection}{\sffamily\large\bfseries\color{srsprimary}}{\thesubsection}{0.8em}{}
\titleformat{\subsubsection}{\sffamily\normalsize\bfseries}{\thesubsubsection}{0.8em}{}
\setcounter{secnumdepth}{3}
\setcounter{tocdepth}{2}

% ---------- Header / footer ----------
\fancypagestyle{srs}{%
  \fancyhf{}
  \fancyhead[L]{\sffamily\footnotesize\color{srsgray}Software Requirements Specification\\\textbf{\@projectname}}
  \fancyhead[R]{\sffamily\footnotesize\color{srsgray}\@docid\\Version \@docversion}
  \fancyfoot[L]{\sffamily\footnotesize\color{srsgray}\@organization}
  \fancyfoot[C]{\sffamily\footnotesize\color{srsgray}\@docstatus}
  \fancyfoot[R]{\sffamily\footnotesize\color{srsgray}Page \thepage\ of \pageref*{LastPage}}
  \renewcommand{\headrulewidth}{0.4pt}
  \renewcommand{\footrulewidth}{0.4pt}}
\fancypagestyle{plain}{\pagestyle{srs}}   % chapter opening pages too
\pagestyle{srs}

% ---------- Title page ----------
\renewcommand{\maketitle}{%
\begin{titlepage}
  \hypersetup{pageanchor=false}
  \sffamily
  {\color{srsprimary}\rule{\textwidth}{3pt}}\par
  \vspace{0.3cm}
  \ifx\@logo\@empty\else\includegraphics[height=2.2cm]{\@logo}\par\vspace{0.8cm}\fi
  \begin{flushright}
    {\color{srsgray}\large\MakeUppercase{\@organization}}\par
    \vspace{2.5cm}
    {\color{srsprimary}\fontsize{32}{38}\selectfont\bfseries Software Requirements\\Specification\par}
    \vspace{0.8cm}
    {\color{srsaccent}\rule{0.45\textwidth}{1.5pt}}\par
    \vspace{0.8cm}
    {\LARGE\bfseries \@projectname\par}
  \end{flushright}
  \vfill
  \renewcommand{\arraystretch}{1.5}
  \begin{tabular}{@{}>{\bfseries\color{srsprimary}}l l@{}}
    Document ID   & \@docid \\
    Version       & \@docversion \\
    Status        & \@docstatus \\
    Prepared by   & \begin{tabular}[t]{@{}l@{}}\@preparedby\end{tabular} \\
    Prepared for  & \@preparedfor \\
    Date          & \@date \\
  \end{tabular}
  \par\vspace{1cm}
  {\color{srsprimary}\rule{\textwidth}{3pt}}
\end{titlepage}
\hypersetup{pageanchor=true}}

% ---------- Professional table helpers ----------
% \srstablehead{A & B & C}  -> shaded bold header row
\newcommand{\srstablehead}[1]{\rowcolor{srshead}\sffamily\bfseries #1 \\ \midrule}
\newcommand{\revision}[4]{#1 & #2 & #3 & #4 \\ \hline}
\setlength{\tabcolsep}{6pt}
\renewcommand{\arraystretch}{1.25}
\newcolumntype{L}[1]{>{\raggedright\arraybackslash}p{#1}}

% =====================================================================
%  USER STORY (functional requirement) — formal requirement card
%  \begin{userstory}{FR-01}{Title}{High}{Source / Related}
%    \storyas{...}\storywant{...}\storyso{...}
%    \begin{confirmation} \item ... \end{confirmation}
%  \end{userstory}
% =====================================================================
\newtcolorbox{userstory}[4]{%
  enhanced, breakable,
  colback=white, colframe=srsprimary!70, boxrule=0.5pt, arc=0pt,
  left=8pt, right=8pt, top=6pt, bottom=6pt,
  before skip=10pt, after skip=10pt,
  colbacktitle=srshead, coltitle=srsprimary,
  fonttitle=\sffamily\small\bfseries,
  title={#1\quad #2\hfill
         \mdseries Priority: \textbf{#3}\quad|\quad Traces to: \textbf{#4}}}
\newcommand{\storyas}[1]{\noindent\textbf{As a} #1,\\}
\newcommand{\storywant}[1]{\noindent\textbf{I want} #1,\\}
\newcommand{\storyso}[1]{\noindent\textbf{so that} #1.\par\smallskip}
\newenvironment{confirmation}
  {\noindent{\sffamily\small\bfseries\color{srsprimary}CONFIRMATION (Acceptance Criteria)}%
   \begin{enumerate}[label=\textbf{C\arabic*.},leftmargin=2.2em]}
  {\end{enumerate}}

% ---------- Guidance notes (delete when writing) ----------
\newtcolorbox{guidance}{%
  colback=srsrow, colframe=srsaccent, boxrule=0pt, leftrule=3pt, arc=0pt,
  left=6pt, right=6pt, top=3pt, bottom=3pt, fontupper=\small\itshape\color{srsgray}}

\endinput
