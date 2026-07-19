"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type Category, type Topic } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
} from "@/components/form-controls";

type CatForm = { name_en: string; name_gu: string; kind: "grammar" | "vocabulary"; sort_order: number; is_active: boolean };
type TopicForm = { name_en: string; name_gu: string; sort_order: number; is_active: boolean };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [catEditing, setCatEditing] = useState<string | "new" | null>(null);
  const [catForm, setCatForm] = useState<CatForm>({ name_en: "", name_gu: "", kind: "grammar", sort_order: 0, is_active: true });
  const [topicEditing, setTopicEditing] = useState<{ categoryId: string; topicId: string | "new" } | null>(null);
  const [topicForm, setTopicForm] = useState<TopicForm>({ name_en: "", name_gu: "", sort_order: 0, is_active: true });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: cats }, { data: tops }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("topics").select("*").order("sort_order"),
    ]);
    setCategories((cats as (Category & { sort_order: number; is_active: boolean })[]) ?? []);
    setTopics((tops as (Topic & { sort_order: number; is_active: boolean })[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveCategory() {
    setError(null);
    const payload = { ...catForm, name_gu: catForm.name_gu.trim() || null };
    const supabase = supabaseBrowser();
    const { error } =
      catEditing === "new"
        ? await supabase.from("categories").insert(payload)
        : await supabase.from("categories").update(payload).eq("id", catEditing!);
    if (error) return setError(error.message);
    setCatEditing(null);
    load();
  }

  async function saveTopic() {
    if (!topicEditing) return;
    setError(null);
    const payload = {
      ...topicForm,
      name_gu: topicForm.name_gu.trim() || null,
      category_id: topicEditing.categoryId,
    };
    const supabase = supabaseBrowser();
    const { error } =
      topicEditing.topicId === "new"
        ? await supabase.from("topics").insert(payload)
        : await supabase.from("topics").update(payload).eq("id", topicEditing.topicId);
    if (error) return setError(error.message);
    setTopicEditing(null);
    load();
  }

  async function removeCategory(category: Category) {
    if (!confirm(`Delete category "${category.name_en}" and ALL its topics?`)) return;
    await supabaseBrowser().from("categories").delete().eq("id", category.id);
    load();
  }

  async function removeTopic(topic: Topic) {
    if (!confirm(`Delete topic "${topic.name_en}"? Its questions stay but lose the topic tag.`)) return;
    await supabaseBrowser().from("topics").delete().eq("id", topic.id);
    load();
  }

  const catFields = (
    <div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-6">
      <label className="text-sm font-medium text-slate-900 lg:col-span-2">
        Name (English)
        <input className={inputCls} value={catForm.name_en}
          onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })} />
      </label>
      <label className="text-sm font-medium text-slate-900 lg:col-span-2">
        Name (ગુજરાતી)
        <input className={inputCls} value={catForm.name_gu}
          onChange={(e) => setCatForm({ ...catForm, name_gu: e.target.value })} />
      </label>
      <label className="text-sm font-medium text-slate-900">
        Kind
        <select className={inputCls} value={catForm.kind}
          onChange={(e) => setCatForm({ ...catForm, kind: e.target.value as CatForm["kind"] })}>
          <option value="grammar">Grammar</option>
          <option value="vocabulary">Vocabulary</option>
        </select>
      </label>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-sm text-slate-900">
          <input type="checkbox" checked={catForm.is_active}
            onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })} />
          Active
        </label>
        <button className={primaryBtn} onClick={saveCategory} disabled={!catForm.name_en.trim()}>Save</button>
        <button className={secondaryBtn} onClick={() => setCatEditing(null)}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Categories & Topics"
        action={
          <button
            className={primaryBtn}
            onClick={() => {
              setCatEditing("new");
              setCatForm({ name_en: "", name_gu: "", kind: "grammar", sort_order: (categories.length + 1) * 1, is_active: true });
            }}>
            + Add Category
          </button>
        }
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {catEditing === "new" && <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">{catFields}</div>}

      <div className="space-y-3">
        {categories.map((category) => {
          const catTopics = topics.filter((t) => t.category_id === category.id);
          const isOpen = open === category.id;
          return (
            <div key={category.id} className="rounded-xl bg-white shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setOpen(isOpen ? null : category.id)}
                  className="flex flex-1 items-center gap-3 text-left">
                  <span className="text-slate-900">{isOpen ? "▾" : "▸"}</span>
                  <span className="font-semibold text-slate-800">{category.name_en}</span>
                  {category.name_gu && <span className="text-slate-900">{category.name_gu}</span>}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-900">
                    {catTopics.length} topics
                  </span>
                  <ActiveBadge active={(category as Category & { is_active: boolean }).is_active ?? true} />
                </button>
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => {
                    const c = category as Category & { sort_order: number; is_active: boolean };
                    setCatEditing(category.id);
                    setCatForm({
                      name_en: c.name_en,
                      name_gu: c.name_gu ?? "",
                      kind: c.kind,
                      sort_order: c.sort_order ?? 0,
                      is_active: c.is_active ?? true,
                    });
                  }}>
                  Edit
                </button>
                <button className="text-sm text-red-600 hover:underline" onClick={() => removeCategory(category)}>
                  Delete
                </button>
              </div>

              {catEditing === category.id && (
                <div className="border-t border-slate-100 p-4">{catFields}</div>
              )}

              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3">
                  {catTopics.map((topic) => (
                    <div key={topic.id} className="flex items-center gap-3 border-b border-slate-50 py-2">
                      <span className="flex-1 text-sm">
                        {topic.name_en}
                        {topic.name_gu && <span className="ml-2 text-slate-900">{topic.name_gu}</span>}
                      </span>
                      <ActiveBadge active={(topic as Topic & { is_active: boolean }).is_active ?? true} />
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          const t = topic as Topic & { sort_order: number; is_active: boolean };
                          setTopicEditing({ categoryId: category.id, topicId: topic.id });
                          setTopicForm({
                            name_en: t.name_en,
                            name_gu: t.name_gu ?? "",
                            sort_order: t.sort_order ?? 0,
                            is_active: t.is_active ?? true,
                          });
                        }}>
                        Edit
                      </button>
                      <button className="text-sm text-red-600 hover:underline" onClick={() => removeTopic(topic)}>
                        Delete
                      </button>
                    </div>
                  ))}

                  {topicEditing?.categoryId === category.id ? (
                    <div className="mt-3 grid grid-cols-2 items-end gap-3 lg:grid-cols-5">
                      <label className="text-sm font-medium text-slate-900 lg:col-span-2">
                        Topic (English)
                        <input className={inputCls} value={topicForm.name_en}
                          onChange={(e) => setTopicForm({ ...topicForm, name_en: e.target.value })} />
                      </label>
                      <label className="text-sm font-medium text-slate-900 lg:col-span-2">
                        Topic (ગુજરાતી)
                        <input className={inputCls} value={topicForm.name_gu}
                          onChange={(e) => setTopicForm({ ...topicForm, name_gu: e.target.value })} />
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-sm text-slate-900">
                          <input type="checkbox" checked={topicForm.is_active}
                            onChange={(e) => setTopicForm({ ...topicForm, is_active: e.target.checked })} />
                          Active
                        </label>
                        <button className={primaryBtn} onClick={saveTopic} disabled={!topicForm.name_en.trim()}>Save</button>
                        <button className={secondaryBtn} onClick={() => setTopicEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-2 text-sm font-medium text-red-600 hover:underline"
                      onClick={() => {
                        setTopicEditing({ categoryId: category.id, topicId: "new" });
                        setTopicForm({ name_en: "", name_gu: "", sort_order: catTopics.length + 1, is_active: true });
                      }}>
                      + Add topic
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
