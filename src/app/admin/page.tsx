'use client';

import { MentorDashboard } from '@/components/admin/MentorDashboard';

export default function AdminPage() {
  const adminId = Number(process.env.NEXT_PUBLIC_ADMIN_ID || 0);
  return <MentorDashboard adminId={adminId} />;
}
