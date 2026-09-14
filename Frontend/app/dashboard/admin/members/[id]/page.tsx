import { AdminMemberProfileScreen } from "@/components/admin/admin-member-profile-screen"

export default async function AdminMemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminMemberProfileScreen memberId={id} />
}
