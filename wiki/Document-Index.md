# Document Index

Every analysis and design document in the repository (`diagram/` folder on `main`). All are PDFs.
Base link: https://github.com/Nakib00/aspire-system/tree/main/diagram

## Requirements

| Document | Owner | Path | Wiki page |
|----------|-------|------|-----------|
| Teacher user stories | Ataur | `diagram/user-stories/teacher_ataur_user_stories.pdf` | [User Stories](User-Stories) |
| Teacher FR/NFR (final SRS version) | Ataur | `diagram/fr-nfr/teacher_fr_nfr_ataur.pdf` | [SRS](SRS-Requirements) |

## Use cases

| Document | Owner | Path |
|----------|-------|------|
| Super Admin use case figures 1–5 | Nakib | `diagram/use_case_diagram/super_admin_nakib/Use case diagram - Figure 1…5.pdf` |
| Center Admin use case diagram + catalogue | Joy | `diagram/center_admin/Use Case Diagram.pdf` |
| Teacher use case diagram | Ataur | `diagram/use_case_diagram/teacher_ataur/Teacher_Module_UseCase_Diagram_Ataur.drawio.pdf` |
| Teacher use case narratives | Ataur | `diagram/use-case-narratives/teacher_use_case_narratives_ataur.pdf` |
| Parent use case diagram | Farhana | `diagram/use_case_diagram/parent_farhana/UseCaseDiagram_Parent_Farhana.drawio.pdf` |
| Parent use case narratives | Farhana | `diagram/use-case-narratives/UseCaseNarratives (Parent Module).pdf` |

→ [Use Cases](Use-Cases)

## Data flow diagrams

| Document | Owner | Path |
|----------|-------|------|
| Super Admin context and level 0 | Nakib | `diagram/data_flow_diagram/super_admin_nakib/Data Flow Diagrams 1.pdf`, `…2.pdf` |
| Center Admin level 0 | Joy | `diagram/center_admin/Data Flow Diagram.pdf` |
| Teacher level 0 | Ataur | `diagram/data_flow_diagram/Teacher_Ataur/DFD_Level0_Teacher_Ataur.pdf` |
| Parent level 0 | Farhana | `diagram/data_flow_diagram/parent_farhana/DFD0_Parent_Farhana.drawio.pdf` |

→ [Data Flow Diagrams](Data-Flow-Diagrams)

## State diagrams

| Document | Owner | Path |
|----------|-------|------|
| Super Admin: account, center, subject, assignment, submission, fee | Nakib | `diagram/state_diagrams/super_admin_nakib/State diagram 1…3.pdf` |
| Center Admin: fee lifecycle | Joy | `diagram/center_admin/State Diagram.pdf` |
| Parent: invoice | Farhana | `diagram/state_diagrams/parent_farhana/State Invoice (Parent Module) .drawio.pdf` |
| Parent: notification | Farhana | `diagram/state_diagrams/parent_farhana/State Notification (Parent Module).drawio.pdf` |

→ [State Diagrams](State-Diagrams)

## Design (SDS)

| Document | Owner | Path |
|----------|-------|------|
| Super Admin class diagram | Nakib | `diagram/uml_diagram/super_amidn_nakib/SuperAdmin_Class_Diagram.pdf` |
| Center Admin class diagram | Joy | `diagram/center_admin/Class Diagram.pdf` |

→ [SDS and Class Diagrams](SDS-Design)

## Known gaps in the document set

| Missing | Suggested owner |
|---------|-----------------|
| User stories for Super Admin, Center Admin, Parent, Student (proposed drafts are on [User Stories](User-Stories)) | each module owner |
| FR/NFR for Super Admin, Center Admin, Parent, Student | each module owner |
| Use case narratives for Super Admin and Center Admin | Nakib, Joy |
| Class diagrams for Teacher and Parent | Ataur, Farhana |
| Level 1 DFDs | all |
| Teacher and Parent state diagrams for attendance and grades | Ataur, Farhana |
| Student module documents | Azmann |
| `srs/` folder in the repository is empty (SRS content lives in `diagram/fr-nfr`) | team |

## Adding a document

1. Save the PDF in the matching `diagram/` sub-folder (see [Folder Structure](Folder-Structure)).
2. Name it `<topic>_<module>_<owner>.pdf`.
3. Commit with `docs: add <name>` through a pull request ([Git Workflow and Code Review](Git-Workflow-and-Code-Review)).
4. Add a row here and mention it on the relevant wiki page.
