import QuestionForm from "../question-form";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Edit Question</h1>
      <QuestionForm questionId={id} />
    </div>
  );
}
