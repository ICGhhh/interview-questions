import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathBlockProps {
  math: string;
  block: boolean;
}

const MathBlock: React.FC<MathBlockProps> = ({ math, block }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          throwOnError: false,
          displayMode: block,
        });
      } catch (e) {
        console.error("KaTeX rendering error", e);
        // Fallback if KaTeX failed
        containerRef.current.innerHTML = block
          ? `<div class="font-serif italic text-center py-2 text-primary/80 overflow-x-auto whitespace-nowrap bg-muted/30 rounded p-3 my-2 border border-border/50">${math}</div>`
          : `<code class="font-serif italic px-1 text-primary/90">${math}</code>`;
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className={block ? "block w-full overflow-x-auto" : "inline-block"} />;
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Helper to parse inline formats: bold **, code ``, and inline math $
  const parseInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // First split by inline math $
    const mathParts = text.split(/(\$[^\$]+\$)/g);
    const elements: React.ReactNode[] = [];

    mathParts.forEach((part, index) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const mathContent = part.slice(1, -1);
        elements.push(<MathBlock key={`math-${index}`} math={mathContent} block={false} />);
      } else {
        // Parse bold and inline code inside regular text
        // Split by bold (**...**) and inline code (`...`)
        const subParts = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        subParts.forEach((subPart, subIndex) => {
          if (subPart.startsWith("**") && subPart.endsWith("**")) {
            elements.push(
              <strong key={`bold-${index}-${subIndex}`} className="font-bold text-foreground">
                {subPart.slice(2, -2)}
              </strong>
            );
          } else if (subPart.startsWith("`") && subPart.endsWith("`")) {
            elements.push(
              <code
                key={`code-${index}-${subIndex}`}
                className="px-1.5 py-0.5 rounded bg-muted/60 text-destructive text-sm font-mono border border-border/30"
              >
                {subPart.slice(1, -1)}
              </code>
            );
          } else {
            elements.push(<span key={`text-${index}-${subIndex}`}>{subPart}</span>);
          }
        });
      }
    });

    return elements;
  };

  // 1. Split by block math $$
  const parts = content.split(/(\$\$(?:[^\$]|\$[^\$])+\$\$)/g);

  const blockElements: React.ReactNode[] = [];

  parts.forEach((part, partIdx) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const mathContent = part.slice(2, -2).trim();
      blockElements.push(<MathBlock key={`block-math-${partIdx}`} math={mathContent} block={true} />);
    } else {
      // 2. Parse regular markdown blocks (headings, lists, code blocks, paragraphs)
      const lines = part.split("\n");
      let inList = false;
      let listItems: React.ReactNode[] = [];
      let listType: "ul" | "ol" = "ul";

      const flushList = (key: string) => {
        if (listItems.length > 0) {
          const Tag = listType;
          blockElements.push(
            <Tag
              key={key}
              className={
                listType === "ul"
                  ? "list-disc pl-6 my-2 space-y-1 text-muted-foreground/90"
                  : "list-decimal pl-6 my-2 space-y-1 text-muted-foreground/90"
              }
            >
              {listItems}
            </Tag>
          );
          listItems = [];
          inList = false;
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith("### ")) {
          flushList(`list-before-h3-${partIdx}-${i}`);
          blockElements.push(
            <h3 key={`h3-${partIdx}-${i}`} className="text-lg font-semibold text-foreground mt-4 mb-2 tracking-wide border-b border-border/40 pb-1">
              {parseInline(trimmed.slice(4))}
            </h3>
          );
        } else if (trimmed.startsWith("#### ")) {
          flushList(`list-before-h4-${partIdx}-${i}`);
          blockElements.push(
            <h4 key={`h4-${partIdx}-${i}`} className="text-md font-medium text-foreground mt-3 mb-1">
              {parseInline(trimmed.slice(5))}
            </h4>
          );
        } else if (trimmed.startsWith("## ")) {
          flushList(`list-before-h2-${partIdx}-${i}`);
          blockElements.push(
            <h2 key={`h2-${partIdx}-${i}`} className="text-xl font-bold text-foreground mt-5 mb-3 border-l-4 border-primary pl-3">
              {parseInline(trimmed.slice(3))}
            </h2>
          );
        }
        // Horizontal rule
        else if (trimmed === "---") {
          flushList(`list-before-hr-${partIdx}-${i}`);
          blockElements.push(<hr key={`hr-${partIdx}-${i}`} className="my-4 border-border/40" />);
        }
        // Unordered lists
        else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          if (inList && listType !== "ul") {
            flushList(`list-type-change-${partIdx}-${i}`);
          }
          inList = true;
          listType = "ul";
          listItems.push(
            <li key={`li-${partIdx}-${i}`} className="leading-relaxed">
              {parseInline(trimmed.slice(2))}
            </li>
          );
        }
        // Ordered lists (e.g. 1. )
        else if (/^\d+\.\s/.test(trimmed)) {
          if (inList && listType !== "ol") {
            flushList(`list-type-change-${partIdx}-${i}`);
          }
          inList = true;
          listType = "ol";
          const contentStart = trimmed.indexOf(" ") + 1;
          listItems.push(
            <li key={`li-${partIdx}-${i}`} className="leading-relaxed">
              {parseInline(trimmed.slice(contentStart))}
            </li>
          );
        }
        // Empty lines
        else if (!trimmed) {
          flushList(`list-empty-${partIdx}-${i}`);
        }
        // Paragraphs
        else {
          flushList(`list-before-p-${partIdx}-${i}`);
          blockElements.push(
            <p key={`p-${partIdx}-${i}`} className="my-2.5 leading-relaxed text-muted-foreground/90">
              {parseInline(line)}
            </p>
          );
        }
      }

      // Flush any trailing lists
      flushList(`list-end-${partIdx}`);
    }
  });

  return <div className="markdown-body space-y-1 text-[15px]">{blockElements}</div>;
};
