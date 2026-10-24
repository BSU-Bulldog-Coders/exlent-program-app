import { Text } from "@react-email/components";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { EmailLayout } from "./layout";

export function AnnouncementEmail({
  title,
  body,
  className,
  url,
}: {
  title: string;
  body: string;
  className: string | null;
  url: string;
}) {
  return (
    <EmailLayout
      preview={`New announcement: ${title}`}
      heading={title}
      cta={{ label: "Open Home", href: url }}
      richContent
    >
      {className ? (
        <Text style={{ color: "#666", fontSize: "13px", margin: "0 0 16px" }}>
          For class: {className}
        </Text>
      ) : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 14px" }}>{children}</p>,
          h1: ({ children }) => <h1 style={{ fontSize: "20px", margin: "20px 0 10px" }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: "18px", margin: "18px 0 8px" }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: "16px", margin: "16px 0 8px" }}>{children}</h3>,
          a: ({ children, href }) => (
            <a href={href} style={{ color: "#2563eb", textDecoration: "underline" }}>
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "3px solid #d1d5db", color: "#4b5563", margin: "16px 0", paddingLeft: "12px" }}>
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code style={{ backgroundColor: "#f3f4f6", borderRadius: "4px", padding: "2px 4px" }}>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre style={{ backgroundColor: "#f3f4f6", borderRadius: "6px", overflow: "auto", padding: "12px" }}>
              {children}
            </pre>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </EmailLayout>
  );
}
