import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { canAccessSystemSettings } from '@/lib/roles'
import { SystemSettings } from '@/features/system-settings'

export const Route = createFileRoute('/_authenticated/system-settings')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!canAccessSystemSettings(auth.user?.role)) {
      throw redirect({
        to: '/403',
      })
    }
  },
  component: SystemSettings,
})
