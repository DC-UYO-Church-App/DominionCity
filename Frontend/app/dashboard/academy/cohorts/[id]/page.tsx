import { AcademyCohortScreen } from "@/components/academy/academy-cohort-screen"

export default async function AcademyCohortPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AcademyCohortScreen cohortId={id} />
}
