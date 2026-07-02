import React, { useState, useEffect } from "react";
import { Search, Plus, Download, Upload, Moon, Sun, RotateCcw, Filter, X } from "lucide-react";
import defaultQuestions from "./data/questions.json";
import { QuestionCard } from "./components/QuestionCard";
import type { QuestionData } from "./components/QuestionCard";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function App() {
  // --- States ---
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  
  // Form State
  const [formTeacher, setFormTeacher] = useState("");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formTags, setFormTags] = useState("");

  // Mobile Filter Sheet State
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // --- Load Data ---
  useEffect(() => {
    // 1. Google Font Preconnects
    const pc1 = document.createElement("link");
    pc1.rel = "preconnect";
    pc1.href = "https://fonts.googleapis.com";
    document.head.appendChild(pc1);

    const pc2 = document.createElement("link");
    pc2.rel = "preconnect";
    pc2.href = "https://fonts.gstatic.com";
    pc2.setAttribute("crossorigin", "anonymous");
    document.head.appendChild(pc2);

    // 2. Google Font Outfit & Noto Sans SC
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap";
    document.head.appendChild(fontLink);

    return () => {
      document.head.removeChild(pc1);
      document.head.removeChild(pc2);
      document.head.removeChild(fontLink);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("interview_questions");
    if (saved) {
      try {
        setQuestions(JSON.parse(saved));
      } catch (e) {
        setQuestions(defaultQuestions);
      }
    } else {
      setQuestions(defaultQuestions);
    }

    // Load Theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  // --- Save Data ---
  const saveQuestions = (newQuestions: QuestionData[]) => {
    setQuestions(newQuestions);
    localStorage.setItem("interview_questions", JSON.stringify(newQuestions));
  };

  // --- Theme Toggle ---
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // --- Dialog Handlers ---
  const openAddDialog = () => {
    setEditingQuestion(null);
    setFormTeacher("");
    setFormQuestion("");
    setFormAnswer("");
    setFormTags("");
    setDialogError("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: QuestionData) => {
    setEditingQuestion(question);
    setFormTeacher(question.teacher);
    setFormQuestion(question.question);
    setFormAnswer(question.answer);
    setFormTags(question.tags.join(", "));
    setDialogError("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacher.trim() || !formQuestion.trim() || !formAnswer.trim()) {
      setDialogError("请填写老师名称、提问问题和回答内容！");
      return;
    }

    const processedTags = formTags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (editingQuestion) {
      // Update
      const updated = questions.map(q => 
        q.id === editingQuestion.id 
          ? { 
              ...q, 
              teacher: formTeacher.trim(), 
              question: formQuestion.trim(), 
              answer: formAnswer.trim(), 
              tags: processedTags,
              date: q.date === "默认数据" ? "已编辑" : q.date
            }
          : q
      );
      saveQuestions(updated);
    } else {
      // Create
      const newQuestion: QuestionData = {
        id: "q-" + Date.now(),
        teacher: formTeacher.trim(),
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        tags: processedTags.length > 0 ? processedTags : ["自定义"],
        date: new Date().toLocaleDateString("zh-CN", { year: 'numeric', month: '2-digit' })
      };
      saveQuestions([newQuestion, ...questions]);
    }

    closeDialog();
  };

  const handleDeleteQuestion = (id: string) => {
    const filtered = questions.filter(q => q.id !== id);
    saveQuestions(filtered);
  };

  const handleResetToDefault = () => {
    if (window.confirm("确定要重置回默认的 4 个基础提问吗？你自定义添加的问题将会丢失！")) {
      saveQuestions(defaultQuestions);
      setSelectedTeacher("All");
      setSelectedTag("All");
      setSearchTerm("");
    }
  };

  // --- Export / Import ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview-questions-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.every(q => q.id && q.teacher && q.question && q.answer && Array.isArray(q.tags))) {
          saveQuestions(parsed);
          alert(`导入成功！共导入了 ${parsed.length} 个问题。`);
        } else {
          alert("文件格式不正确，必须是一个包含合规问题对象的数组。");
        }
      } catch (err) {
        alert("文件读取解析失败，请确保是正确的 JSON 文件。");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset
  };

  // --- Filters & Stats ---
  const allTeachers = Array.from(new Set(questions.map(q => q.teacher)));
  const allTags = Array.from(new Set(questions.flatMap(q => q.tags)));

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.teacher.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTeacher = selectedTeacher === "All" || q.teacher === selectedTeacher;
    const matchesTag = selectedTag === "All" || q.tags.includes(selectedTag);

    return matchesSearch && matchesTeacher && matchesTag;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-zinc-950" 
        : "bg-slate-50 text-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-50 via-slate-50 to-zinc-100"
    }`}>
      
      {/* Background glowing circles (for glassmorphism feel) */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20">
              问
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">面试提问知识库</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">保研学术常识 & 导师交流高频问题整理</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Import / Export Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              title="导出当前问题列表为 JSON"
              className="h-9 border-border/40 bg-background/40 hover:bg-background/80"
            >
              <Download size={15} className="sm:mr-1.5" />
              <span className="hidden sm:inline">导出数据</span>
            </Button>
            
            <label className="cursor-pointer">
              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background/40 hover:bg-background/80 shadow-sm h-9 px-3 sm:mr-1.5 gap-1.5">
                <Upload size={15} />
                <span className="hidden sm:inline">导入数据</span>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 border-border/40 bg-background/40 hover:bg-background/80 rounded-md"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </Button>

            {/* Add New Button */}
            <Button 
              size="sm" 
              onClick={openAddDialog}
              className="h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-medium shadow-md shadow-primary/10 ml-1.5"
            >
              <Plus size={16} className="mr-1" />
              <span>新增</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 relative">
        
        {/* --- HERO / STATS PANEL --- */}
        <section className="mb-6 rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-xl font-bold">学术保研复习看板</h2>
            <p className="text-sm text-muted-foreground">多端同步：未来如需更新，发给 AI 直接在代码端发布，多设备实时同步！</p>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-10 text-center">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-primary">{questions.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">问题总数</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-primary">{allTeachers.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">涉及导师</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-primary">{allTags.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">知识分类</div>
            </div>
          </div>
        </section>

        {/* --- CONTROLS: SEARCH & RESET --- */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={17} />
            <Input
              type="text"
              placeholder="搜索提问、回答或老师姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-full border-border/40 bg-card/60 backdrop-blur-md focus-visible:ring-1 focus-visible:ring-primary"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedTeacher("All");
                setSelectedTag("All");
              }}
              className="h-10 border-border/40 bg-card/60 w-1/2 sm:w-auto text-sm"
            >
              清空筛选
            </Button>
            <Button
              variant="ghost"
              onClick={handleResetToDefault}
              className="h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-1/2 sm:w-auto text-sm border border-border/20 bg-background/20"
              title="重置到默认提取的4个基础问题"
            >
              <RotateCcw size={15} className="mr-1.5" />
              恢复默认
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="h-10 border-border/40 bg-card/60 md:hidden p-2 flex items-center justify-center"
            >
              <Filter size={17} />
            </Button>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* --- SIDEBAR FILTERS (DESKTOP) --- */}
          <aside className="md:col-span-1 space-y-6 hidden md:block">
            {/* Filter by Teacher */}
            <div className="border border-border/30 rounded-xl bg-card/45 backdrop-blur-md p-4 space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground flex items-center justify-between">
                <span>过滤导师</span>
                {selectedTeacher !== "All" && (
                  <button onClick={() => setSelectedTeacher("All")} className="text-[11px] text-primary hover:underline">清除</button>
                )}
              </h3>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTeacher("All")}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedTeacher === "All"
                      ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/10"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  全部导师 ({questions.length})
                </button>
                {allTeachers.map(t => {
                  const count = questions.filter(q => q.teacher === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTeacher(t)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all truncate flex items-center justify-between ${
                        selectedTeacher === t
                          ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/10"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{t}</span>
                      <span className="text-[11px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Tag */}
            <div className="border border-border/30 rounded-xl bg-card/45 backdrop-blur-md p-4 space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground flex items-center justify-between">
                <span>知识分类</span>
                {selectedTag !== "All" && (
                  <button onClick={() => setSelectedTag("All")} className="text-[11px] text-primary hover:underline">清除</button>
                )}
              </h3>
              <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTag("All")}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    selectedTag === "All"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/20"
                  }`}
                >
                  全部 ({questions.length})
                </button>
                {allTags.map(tag => {
                  const count = questions.filter(q => q.tags.includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${
                        selectedTag === tag
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/20"
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] opacity-60 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* --- MOBILE FILTER PANEL --- */}
          {showMobileFilters && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden p-4 flex items-center justify-center">
              <div className="border border-border/40 rounded-2xl bg-card p-6 w-full max-w-sm space-y-5 shadow-2xl relative">
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>

                <h3 className="text-md font-bold flex items-center gap-1.5">
                  <Filter size={16} />
                  筛选面板
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">选择导师</label>
                    <select 
                      value={selectedTeacher}
                      onChange={(e) => setSelectedTeacher(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border/50 bg-background px-3 text-sm"
                    >
                      <option value="All">全部导师 ({questions.length})</option>
                      {allTeachers.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">知识分类</label>
                    <select 
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border/50 bg-background px-3 text-sm"
                    >
                      <option value="All">全部分类 ({questions.length})</option>
                      {allTags.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowMobileFilters(false)} 
                  className="w-full bg-primary text-primary-foreground mt-2"
                >
                  确定
                </Button>
              </div>
            </div>
          )}

          {/* --- CARDS CONTAINER (MD: COL-SPAN-3) --- */}
          <div className="md:col-span-3 space-y-4">
            
            {/* Filter Indicators */}
            {(selectedTeacher !== "All" || selectedTag !== "All") && (
              <div className="flex flex-wrap items-center gap-2 text-xs py-1">
                <span className="text-muted-foreground">当前筛选条件:</span>
                {selectedTeacher !== "All" && (
                  <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-primary rounded-md px-2.5 py-0.5">
                    导师: {selectedTeacher}
                    <X size={11} className="cursor-pointer hover:text-foreground" onClick={() => setSelectedTeacher("All")} />
                  </Badge>
                )}
                {selectedTag !== "All" && (
                  <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-primary rounded-md px-2.5 py-0.5">
                    分类: {selectedTag}
                    <X size={11} className="cursor-pointer hover:text-foreground" onClick={() => setSelectedTag("All")} />
                  </Badge>
                )}
                <button 
                  onClick={() => { setSelectedTeacher("All"); setSelectedTag("All"); }}
                  className="text-primary hover:underline hover:text-primary/85 font-medium ml-1"
                >
                  清除所有
                </button>
              </div>
            )}

            {/* List of cards */}
            {filteredQuestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4.5">
                {filteredQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    data={q}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border/40 rounded-2xl bg-card/25 p-8 space-y-3">
                <p className="text-muted-foreground font-medium">没有找到匹配的问题</p>
                <p className="text-xs text-muted-foreground/60">尝试更改搜索关键词或重置筛选条件</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setSearchTerm(""); setSelectedTeacher("All"); setSelectedTag("All"); }}
                  className="mt-2 border-border/40"
                >
                  重置筛选
                </Button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* --- ADD/EDIT MODAL DIALOG --- */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          <div className="border border-border/40 rounded-2xl bg-card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200 bg-card/95">
            <button 
              onClick={closeDialog}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div>
              <h2 className="text-lg font-bold">
                {editingQuestion ? "编辑提问信息" : "添加面试提问问题"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                支持标准的 Markdown 及 LaTeX 数学公式（行内公式用 `$ ... $`，独立公式块用 `$$ ... $$`）
              </p>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">提问导师 / 所组</label>
                <Input
                  type="text"
                  placeholder="例如：王晓琴 微电子所"
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="bg-background border-border/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">面试具体问题</label>
                <Input
                  type="text"
                  placeholder="例如：什么是内存墙"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  className="bg-background border-border/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">问题解答 (支持 Markdown & 公式)</label>
                <textarea
                  placeholder="在此写入详细的解答。例如使用 **粗体**，或公式：\n$$\nP_{total} = P_{dynamic} + P_{static}\n$$"
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm font-sans focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">专业标签 / 分类 (用逗号隔开)</label>
                <Input
                  type="text"
                  placeholder="例如：模拟IC, 电源管理, LDO"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="bg-background border-border/50 h-10"
                />
              </div>

              {dialogError && (
                <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                  {dialogError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/10">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeDialog}
                  className="border-border/40"
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary text-primary-foreground shadow-sm shadow-primary/10 px-5"
                >
                  保存提问
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="border-t border-border/30 py-6 mt-16 text-center text-xs text-muted-foreground bg-background/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} 面试提问知识库. All rights reserved.</p>
          <p className="opacity-75">由 Antigravity 强力构建 • 适配手机与电脑 • 支持 LaTeX 公式渲染</p>
        </div>
      </footer>

    </div>
  );
}
