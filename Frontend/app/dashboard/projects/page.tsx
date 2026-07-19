import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MemberProjectsScreen } from "@/components/projects/member-projects-screen"

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <MemberProjectsScreen />
    </DashboardLayout>
  )
}
