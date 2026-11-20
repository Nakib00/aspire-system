import { fileSize, isImageName, isPdfName } from './api'
import { Icon } from './ui'

export function YouTubeEmbed({ id, title = 'Assignment video' }) {
  if (!id) return null
  return (
    <div className="video">
      <iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={title} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  )
}

/** Inline preview of an uploaded work file (image or PDF) with an open-in-new-tab link. */
export function FilePreview({ url, name }) {
  if (!url) return null
  return (
    <div className="file-preview">
      {isImageName(name) && <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={name} /></a>}
      {isPdfName(name) && <iframe src={url} title={name} />}
      <a className="file-chip" href={url} target="_blank" rel="noreferrer"><Icon name={isPdfName(name) ? 'file' : 'image'} size={16} /><span>{name}</span><Icon name="arrow" size={14} /></a>
    </div>
  )
}

/** Everything a student needs for an assignment: instructions, sample questions, video and files. */
export default function AssignmentContent({ assignment: a }) {
  return (
    <div className="assignment-content">
      <p className="instructions">{a.instructions}</p>

      {a.questions?.length > 0 && (
        <div>
          <h4>Sample questions</h4>
          <ol className="questions">
            {a.questions.map((q, i) => <li key={i}><span>{q.text}</span>{q.marks ? <em>{q.marks} marks</em> : null}</li>)}
          </ol>
        </div>
      )}

      {a.youtube_id && <div><h4>Watch first</h4><YouTubeEmbed id={a.youtube_id} title={a.title} /></div>}

      {a.attachments?.length > 0 && (
        <div>
          <h4>Materials</h4>
          <div className="attachments">
            {a.attachments.map((f) => (
              <a key={f.id} className="attachment" href={f.url} target="_blank" rel="noreferrer">
                {f.kind === 'image' ? <img src={f.url} alt={f.original_name} /> : <span className="pdf-tile"><Icon name="file" size={26} /></span>}
                <span><b>{f.original_name}</b><small>{f.kind === 'pdf' ? 'PDF' : 'Image'} · {fileSize(f.size)}</small></span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
