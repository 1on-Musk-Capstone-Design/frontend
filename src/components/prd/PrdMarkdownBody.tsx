import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import styles from './PrdMarkdownBody.module.css'

type Props = {
  markdown: string
  className?: string
}

function childrenToText(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(childrenToText).join('')
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return childrenToText((children as { props?: { children?: unknown } }).props?.children)
  }
  return ''
}

export function createPrdHeadingId(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/^\d+\)\s*/, '')
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `prd-${normalized || 'section'}`
}

const mdComponents: Partial<Components> = {
  a: (props) => {
    const { href, children, node: _n, ...rest } = props
    const h = href ?? ''
    const isExternal = /^https?:\/\//i.test(h)
    return (
      <a
        href={h}
        {...rest}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    )
  },
  h2: (props) => {
    const { children, node: _n, ...rest } = props
    return (
      <h2 id={createPrdHeadingId(childrenToText(children))} {...rest}>
        {children}
      </h2>
    )
  },
  h3: (props) => {
    const { children, node: _n, ...rest } = props
    return (
      <h3 id={createPrdHeadingId(childrenToText(children))} {...rest}>
        {children}
      </h3>
    )
  },
  table: (props) => {
    const { children, node: _n, ...rest } = props
    return (
      <div className={styles.tableScroll}>
        <table {...rest}>{children}</table>
      </div>
    )
  },
}

/**
 * API에서 내려온 PRD 마크다운 — 표·체크리스트·코드 등 GFM을 문서형으로 렌더링
 */
export function PrdMarkdownBody({ markdown, className }: Props) {
  return (
    <article className={`${styles.root} ${className || ''}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={mdComponents}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
