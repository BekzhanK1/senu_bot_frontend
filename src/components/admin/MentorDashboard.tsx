'use client';

import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardTabs } from './dashboard/DashboardTabs';
import { RequestsTab } from './dashboard/RequestsTab';
import { MeetingsTab } from './dashboard/MeetingsTab';
import { EventTab } from './dashboard/EventTab';
import { UsersTab } from './dashboard/UsersTab';
import { BroadcastTab } from './dashboard/BroadcastTab';
import { ReplyModal } from './dashboard/ReplyModal';
import { useMentorDashboard } from './dashboard/useMentorDashboard';
import { SettingsTab } from './dashboard/SettingsTab';
import { ContentTab } from './dashboard/ContentTab';
import { MenuTab } from './dashboard/MenuTab';
import { MentorsTab } from './dashboard/MentorsTab';

export function MentorDashboard({ adminId }: { adminId: number }) {
  const dashboard = useMentorDashboard(adminId);

  return (
    <div className="min-h-screen pb-28 max-w-lg mx-auto">
      <DashboardHeader onBack={dashboard.handleBack} />

      <DashboardTabs tab={dashboard.tab} onTabChange={dashboard.setTab} />

      <div className="px-4 space-y-6">
        {dashboard.tab === 'requests' && (
          <RequestsTab
            loading={dashboard.loading}
            statusTab={dashboard.statusTab}
            selectedFilter={dashboard.selectedFilter}
            categoryCounters={dashboard.categoryCounters}
            visibleItems={dashboard.visibleItems}
            resolvingId={dashboard.resolvingId}
            onStatusChange={dashboard.setStatusTab}
            onRefresh={() => void dashboard.refreshAll()}
            onFilterChange={dashboard.setSelectedFilter}
            onResolve={(id) => void dashboard.handleResolveRequest(id)}
            onReply={dashboard.handleOpenReply}
            accentBar={dashboard.accentBar}
          />
        )}

        {dashboard.tab === 'meetings' && (
          <MeetingsTab
            meetings={dashboard.meetings}
            meetingsLoading={dashboard.meetingsLoading}
            meetingActionId={dashboard.meetingActionId}
            weeklyHours={dashboard.weeklyHours}
            slotMinutes={dashboard.slotMinutes}
            scheduleTimezone={dashboard.scheduleTimezone}
            scheduleLoading={dashboard.scheduleLoading}
            scheduleSaving={dashboard.scheduleSaving}
            onRefresh={() => {
              if (dashboard.tgUserId) void dashboard.loadMeetingsAndSchedule(dashboard.tgUserId);
            }}
            onConfirmMeeting={(bookingId) => void dashboard.handleConfirmMeeting(bookingId)}
            onCompleteMeeting={(bookingId) => void dashboard.handleCompleteMeeting(bookingId)}
            onWeeklyHoursChange={dashboard.setWeeklyHours}
            onSlotMinutesChange={dashboard.setSlotMinutes}
            onTimezoneChange={dashboard.setScheduleTimezone}
            onSaveSchedule={() => void dashboard.handleSaveSchedule()}
          />
        )}

        {dashboard.tab === 'event' && (
          <EventTab
            eventTitle={dashboard.eventTitle}
            eventPlace={dashboard.eventPlace}
            eventDesc={dashboard.eventDesc}
            eventSubmitting={dashboard.eventSubmitting}
            onEventTitleChange={dashboard.setEventTitle}
            onEventPlaceChange={dashboard.setEventPlace}
            onEventDescChange={dashboard.setEventDesc}
            onSubmit={() => void dashboard.handleSubmitEvent()}
          />
        )}

        {dashboard.tab === 'users' && (
          <UsersTab
            usersLoading={dashboard.usersLoading}
            users={dashboard.users}
            blockingUserId={dashboard.blockingUserId}
            adminId={dashboard.adminId}
            onToggleBlock={(targetUserId, isBlocked) => void dashboard.handleToggleBlock(targetUserId, isBlocked)}
          />
        )}

        {dashboard.tab === 'broadcast' && (
          <BroadcastTab
            broadcastText={dashboard.broadcastText}
            broadcastSubmitting={dashboard.broadcastSubmitting}
            onTextChange={dashboard.setBroadcastText}
            onSubmit={() => void dashboard.handleSubmitBroadcast()}
          />
        )}

        {dashboard.tab === 'content' && dashboard.tgUserId && (
          <ContentTab tgUserId={dashboard.tgUserId} />
        )}

        {dashboard.tab === 'menu' && dashboard.tgUserId && (
          <MenuTab tgUserId={dashboard.tgUserId} />
        )}

        {dashboard.tab === 'mentors' && dashboard.tgUserId && (
          <MentorsTab tgUserId={dashboard.tgUserId} />
        )}

        {dashboard.tab === 'settings' && (
          <SettingsTab
            settings={dashboard.appSettings}
            loading={dashboard.settingsLoading}
            saving={dashboard.settingsSaving}
            onChange={dashboard.setAppSettings}
            onRefresh={() => {
              if (dashboard.tgUserId) void dashboard.loadAppSettings(dashboard.tgUserId);
            }}
            onSave={() => void dashboard.handleSaveAppSettings()}
          />
        )}
      </div>

      <ReplyModal
        replyOpen={dashboard.replyOpen}
        replyTarget={dashboard.replyTarget}
        replyText={dashboard.replyText}
        replySending={dashboard.replySending}
        onReplyTextChange={dashboard.setReplyText}
        onClose={dashboard.handleCloseReply}
        onSubmit={() => void dashboard.handleSendReply()}
      />
    </div>
  );
}
