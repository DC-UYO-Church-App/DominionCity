import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MemberActivitiesScreen } from "@/components/activities/member-activities-screen"

export default function ActivitiesPage() {
  return (
    <DashboardLayout>
      <MemberActivitiesScreen />
    </DashboardLayout>
  )
}
