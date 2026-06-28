import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Edit, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface QuestionData {
  id: string;
  teacher: string;
  question: string;
  answer: string;
  tags: string[];
  date: string;
}

interface QuestionCardProps {
  data: QuestionData;
  onEdit: (data: QuestionData) => void;
  onDelete: (id: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ data, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`group overflow-hidden transition-all duration-300 border-border/40 bg-card/65 backdrop-blur-md hover:bg-card/90 ${
      isExpanded 
        ? "shadow-lg shadow-primary/5 ring-1 ring-primary/20 scale-[1.01]" 
        : "shadow-sm hover:shadow-md hover:border-primary/20"
    }`}>
      <CardHeader 
        className="p-5 cursor-pointer select-none" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1">
            {/* Header tags & Teacher info */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                <User size={12} />
                {data.teacher}
              </span>
              {data.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="font-normal text-muted-foreground bg-muted/60 border border-border/30 rounded-full px-2.5 py-0"
                >
                  <Tag size={10} className="mr-1 inline" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Question Text */}
            <h3 className="text-[17px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
              {data.question}
            </h3>
          </div>

          {/* Expand Icon */}
          <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-muted/40 text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80 transition-all duration-200">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </CardHeader>

      {/* Answer content (collapsible) */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden border-t border-border/20 ${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <CardContent className="p-5 space-y-4 bg-muted/20">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={data.answer} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-border/10 pt-3 text-xs text-muted-foreground">
            {data.date && <span className="mr-auto text-[11px] font-mono opacity-60">来源: {data.date}</span>}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(data);
              }}
              className="h-8 text-primary hover:text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
            >
              <Edit size={13} />
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("确定要删除这个问题吗？")) {
                  onDelete(data.id);
                }
              }}
              className="h-8 text-destructive hover:text-destructive-foreground hover:bg-destructive flex items-center gap-1"
            >
              <Trash2 size={13} />
              删除
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
