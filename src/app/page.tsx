"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { Users, Plus, KeyRound, Copy, Check, FolderPlus, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import SummaryMetrics from "@/components/calendar/SummaryMetrics";
import FilterBar from "@/components/calendar/FilterBar";
import CalendarMonthlyGrid from "@/components/calendar/CalendarMonthlyGrid";
import CalendarWeeklyMatrix from "@/components/calendar/CalendarWeeklyMatrix";
import AvailabilityModal from "@/components/calendar/AvailabilityModal";
import AuthModal from "@/components/auth/AuthModal";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import DevOtpBanner from "@/components/dev/DevOtpBanner";
import CreateGroupModal from "@/components/group/CreateGroupModal";
import JoinGroupModal from "@/components/group/JoinGroupModal";
import { getCurrentUserAction } from "@/actions/auth";
import {
  getAvailabilitiesAction,
  getTeamMembersAction,
  deleteAvailabilityAction,
} from "@/actions/availability";
import { getUserGroupsAction } from "@/actions/group";
import {
  SessionUser,
  AvailabilityItem,
  TeamStats,
  GroupItem,
} from "@/lib/types";
import { stripEmojis } from "@/lib/utils";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [userGroups, setUserGroups] = useState<GroupItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; role: string; email: string }>
  >([]);

  // Calendar Date & View State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"MONTHLY" | "WEEKLY">("MONTHLY");

  // Filter States
  const [selectedMemberId, setSelectedMemberId] = useState("ALL");
  const [selectedSlot, setSelectedSlot] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Data
  const [availabilities, setAvailabilities] = useState<AvailabilityItem[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    availableTodayCount: 0,
    busyTodayCount: 0,
    availabilityRateToday: 0,
    bestMeetingDay: null,
  });
  // Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [prefilledOtp, setPrefilledOtp] = useState("");
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [codeCopied, setCodeCopied] = useState(false);

  // Load current user and initial user groups
  useEffect(() => {
    const initData = async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
        if (user) {
          const groups = await getUserGroupsAction();
          setUserGroups(groups);
          if (groups.length > 0) {
            setActiveGroup(groups[0]);
          }
        }
      } catch (e) {
        console.error("Init data load error:", e);
      }
    };
    initData();
  }, []);

  // Fetch team members and availabilities whenever activeGroup, filters, or date change
  const loadAvailabilities = useCallback(async () => {
    try {
      const groupId = activeGroup?.id;

      const [res, members] = await Promise.all([
        getAvailabilitiesAction({
          groupId,
          memberId: selectedMemberId,
          timeSlot: selectedSlot,
          status: selectedStatus,
        }),
        getTeamMembersAction(groupId),
      ]);

      setAvailabilities(res.availabilities);
      setStats(res.stats);
      setTeamMembers(members);
    } catch (e) {
      console.error("Failed to load availabilities:", e);
    }
  }, [activeGroup, selectedMemberId, selectedSlot, selectedStatus]);

  useEffect(() => {
    loadAvailabilities();
  }, [loadAvailabilities]);

  // Calendar Navigation
  const handlePrevDate = () => {
    if (viewMode === "MONTHLY") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNextDate = () => {
    if (viewMode === "MONTHLY") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDayModal = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsAvailabilityOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      await deleteAvailabilityAction(id);
      loadAvailabilities();
    }
  };

  const handleOpenForgotPassword = (email: string) => {
    setIsAuthOpen(false);
    setForgotEmail(email);
    setIsForgotOpen(true);
  };

  const handleUserChanged = async (user: SessionUser | null) => {
    setCurrentUser(user);
    if (user) {
      const groups = await getUserGroupsAction();
      setUserGroups(groups);
      if (groups.length > 0) {
        setActiveGroup(groups[0]);
      } else {
        setActiveGroup(null);
      }
    } else {
      setUserGroups([]);
      setActiveGroup(null);
    }
    loadAvailabilities();
  };

  const handleCopyCode = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-16">
      {/* Top Navigation with Group Switcher */}
      <Navbar
        currentUser={currentUser}
        userGroups={userGroups}
        activeGroup={activeGroup}
        onSelectGroup={(group) => {
          setActiveGroup(group);
          setSelectedMemberId("ALL");
        }}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAvailabilityModal={() => {
          setSelectedDateStr(format(new Date(), "yyyy-MM-dd"));
          setIsAvailabilityOpen(true);
        }}
        onUserChanged={handleUserChanged}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-5">
        {/* Active Group Banner / Status Pill */}
        {activeGroup ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-5 py-3.5 text-white shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs text-white">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold sm:text-lg truncate">
                    {stripEmojis(activeGroup.name)}
                  </h2>
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap">
                    {activeGroup.memberCount} สมาชิก
                  </span>
                </div>
                <p className="text-xs text-blue-100 line-clamp-1 sm:line-clamp-none">
                  {stripEmojis(activeGroup.description) || "ปฏิทินแสดงเฉพาะสมาชิกในกลุ่มนี้เท่านั้น (Group-Scoped Matrix)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/10 sm:border-0 justify-between sm:justify-start">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 px-3 py-2 sm:py-1.5 text-xs font-semibold text-white transition-colors backdrop-blur-xs min-h-[38px] sm:min-h-0"
                title="คัดลอกรหัสกลุ่มเพื่อชวนเพื่อนร่วมทีม"
              >
                <span>รหัสกลุ่ม:</span>
                <span className="font-mono font-bold tracking-wider">{activeGroup.code}</span>
                {codeCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-70" />
                )}
              </button>

              <button
                onClick={() => setIsJoinGroupOpen(true)}
                className="rounded-xl bg-white text-blue-900 hover:bg-blue-50 active:bg-blue-100 px-3 py-2 sm:py-1.5 text-xs font-bold transition-colors shadow-xs min-h-[38px] sm:min-h-0"
              >
                + ชวนเพื่อน
              </button>
            </div>
          </div>
        ) : currentUser && userGroups.length === 0 ? (
          /* Empty State when user has no group */
          <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                คุณยังไม่ได้อยู่ในกลุ่มใด (No Group Selected)
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                ระบบถูกออกแบบให้แยกดูตารางเฉพาะกลุ่มตนเอง กรุณาสร้างกลุ่มใหม่สำหรับทีมของคุณ หรือใส่รหัสกลุ่มที่ได้รับเพื่อเริ่มใช้งาน
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
                <span>สร้างกลุ่มใหม่ (Create Group)</span>
              </button>
              <button
                onClick={() => setIsJoinGroupOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                <span>ใส่รหัสเข้าร่วมกลุ่ม (Join with Code)</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* KPI Summary Cards (Scoped to Active Group) */}
        <SummaryMetrics
          stats={stats}
          onSelectBestDay={(dateStr) => {
            setCurrentDate(new Date(dateStr));
            setSelectedDateStr(dateStr);
            setIsAvailabilityOpen(true);
          }}
        />

        {/* Filters & Control Bar */}
        <FilterBar
          currentDate={currentDate}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          onToday={handleToday}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedMemberId={selectedMemberId}
          onMemberChange={setSelectedMemberId}
          selectedSlot={selectedSlot}
          onSlotChange={setSelectedSlot}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          teamMembers={teamMembers}
        />

        {/* Matrix Views */}
        {viewMode === "MONTHLY" ? (
          <CalendarMonthlyGrid
            currentDate={currentDate}
            availabilities={availabilities}
            bestMeetingDate={stats.bestMeetingDay?.date}
            currentUser={currentUser}
            onSelectDay={handleOpenDayModal}
            onDeleteEntry={handleDeleteEntry}
          />
        ) : (
          <CalendarWeeklyMatrix
            currentDate={currentDate}
            availabilities={availabilities}
            teamMembers={teamMembers}
            currentUser={currentUser}
            bestMeetingDate={stats.bestMeetingDay?.date}
            onSelectCell={(dateStr) => handleOpenDayModal(dateStr)}
          />
        )}
      </main>

      {/* Mobile Floating Bottom Bar (< sm) */}
      <nav
        aria-label="Mobile navigation"
        className="sm:hidden fixed bottom-3 inset-x-3 z-40 flex items-center justify-between rounded-2xl bg-slate-900/95 px-3 py-2 shadow-2xl backdrop-blur-md border border-slate-700/80 text-white"
      >
        <button
          onClick={() => setViewMode(viewMode === "MONTHLY" ? "WEEKLY" : "MONTHLY")}
          className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[44px] rounded-xl text-slate-300 hover:text-white active:bg-slate-800 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[10px] mt-0.5 font-medium">
            {viewMode === "MONTHLY" ? "ดูตารางสัปดาห์" : "ดูปฏิทินเดือน"}
          </span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) {
              setIsAuthOpen(true);
            } else {
              setSelectedDateStr(format(new Date(), "yyyy-MM-dd"));
              setIsAvailabilityOpen(true);
            }
          }}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-md shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>ลงเวลา</span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) {
              setIsAuthOpen(true);
            } else {
              setIsCreateGroupOpen(true);
            }
          }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[44px] rounded-xl text-slate-300 hover:text-white active:bg-slate-800 transition-colors"
        >
          <Users className="h-4 w-4" />
          <span className="text-[10px] mt-0.5 font-medium">จัดการกลุ่ม</span>
        </button>
      </nav>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(newGroup) => {
          setUserGroups((prev) => [...prev, newGroup]);
          setActiveGroup(newGroup);
          loadAvailabilities();
        }}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onGroupJoined={(joinedGroup) => {
          setUserGroups((prev) => {
            const exists = prev.some((g) => g.id === joinedGroup.id);
            return exists ? prev : [...prev, joinedGroup];
          });
          setActiveGroup(joinedGroup);
          loadAvailabilities();
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleUserChanged}
        onOpenForgotPassword={handleOpenForgotPassword}
      />

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        onSuccess={() => {
          setIsForgotOpen(false);
          setIsAuthOpen(true);
        }}
        initialEmail={forgotEmail}
        prefillOtp={prefilledOtp}
      />

      <AvailabilityModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        currentUser={currentUser}
        initialDate={selectedDateStr}
        existingItems={availabilities}
        onSaved={loadAvailabilities}
        onOpenAuth={() => {
          setIsAvailabilityOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Development OTP Banner */}
      <DevOtpBanner
        onFillOtp={(otp) => {
          setPrefilledOtp(otp);
          setIsForgotOpen(true);
        }}
      />
    </div>
  );
}
