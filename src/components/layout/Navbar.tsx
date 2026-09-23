"use client";

import { useState } from "react";
import {
  CalendarDays,
  LogOut,
  LogIn,
  Plus,
  ChevronDown,
  Users,
  Copy,
  Check,
  UserPlus,
  FolderPlus,
} from "lucide-react";
import { SessionUser, GroupItem } from "@/lib/types";
import { logoutAction } from "@/actions/auth";
import { stripEmojis } from "@/lib/utils";

interface NavbarProps {
  currentUser: SessionUser | null;
  userGroups: GroupItem[];
  activeGroup: GroupItem | null;
  onSelectGroup: (group: GroupItem) => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenAuth: () => void;
  onOpenAvailabilityModal: () => void;
  onUserChanged: (user: SessionUser | null) => void;
}

export default function Navbar({
  currentUser,
  userGroups,
  activeGroup,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenAuth,
  onOpenAvailabilityModal,
  onUserChanged,
}: NavbarProps) {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    onUserChanged(null);
  };

  const handleCopyGroupCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white sm:bg-white/85 sm:backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left Brand & Group Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                  Team Schedule Matrix
                </h1>
                <span className="hidden rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 border border-blue-100 sm:inline-block">
                  กลุ่มอิสระ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                ระบบเช็กตารางความพร้อมและคิวว่างเฉพาะกลุ่มตนเอง
              </p>
            </div>

            {/* Active Group Selector Dropdown */}
            {currentUser && (
              <div className="relative ml-0.5 sm:ml-2">
                <button
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/70 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-blue-900 shadow-2xs hover:bg-blue-100/70 transition-colors"
                >
                  <Users className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="max-w-[95px] sm:max-w-[170px] truncate font-bold text-[11px] sm:text-xs">
                    {activeGroup ? stripEmojis(activeGroup.name) : "เลือกกลุ่ม"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-blue-500 shrink-0" />
                </button>

                {showGroupDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs sm:bg-transparent"
                      onClick={() => setShowGroupDropdown(false)}
                    />
                    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white p-4 shadow-2xl border-t border-slate-200 pb-8 sm:pb-3 sm:absolute sm:inset-auto sm:left-0 sm:mt-2 sm:w-72 sm:rounded-2xl sm:border sm:p-2.5 animate-in slide-in-from-bottom-5 sm:slide-in-from-top-2 duration-200">
                      {/* Mobile Pull Handle */}
                      <div className="sm:hidden flex justify-center pb-3 pt-0.5">
                        <div className="w-12 h-1.5 rounded-full bg-slate-300" />
                      </div>

                      <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <span>กลุ่มของคุณ ({userGroups.length})</span>
                      </div>

                      {userGroups.length > 0 ? (
                        <div className="space-y-1 my-2 sm:my-1 max-h-64 sm:max-h-56 overflow-y-auto">
                          {userGroups.map((g) => {
                            const isSelected = activeGroup?.id === g.id;
                            return (
                              <button
                                key={g.id}
                                onClick={() => {
                                  onSelectGroup(g);
                                  setShowGroupDropdown(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 sm:py-2 text-left text-xs transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <p className="truncate leading-tight font-medium text-sm sm:text-xs">
                                    {stripEmojis(g.name)}
                                  </p>
                                  <p
                                    className={`text-[10px] font-mono mt-0.5 ${
                                      isSelected ? "text-blue-100" : "text-slate-400"
                                    }`}
                                  >
                                    รหัส: {g.code} ({g.memberCount} สมาชิก)
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                                    isSelected
                                      ? "bg-blue-700 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {g.userRole}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl my-1">
                          คุณยังไม่ได้อยู่ในกลุ่มใด
                        </div>
                      )}

                      <div className="pt-2 mt-1 border-t border-slate-100 grid grid-cols-2 gap-2 sm:gap-1.5">
                        <button
                          onClick={() => {
                            setShowGroupDropdown(false);
                            onOpenCreateGroup();
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 sm:py-1.5 text-xs sm:text-[11px] font-semibold text-slate-700 active:bg-blue-100 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <FolderPlus className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-600" />
                          <span>สร้างกลุ่ม</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowGroupDropdown(false);
                            onOpenJoinGroup();
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 sm:py-1.5 text-xs sm:text-[11px] font-semibold text-slate-700 active:bg-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <UserPlus className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-indigo-600" />
                          <span>ใส่รหัสเข้าร่วม</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Group Code pill with Copy */}
          {activeGroup && (
            <div
              onClick={handleCopyGroupCode}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/90 px-2.5 py-1.5 text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs"
              title="คลิกเพื่อคัดลอกรหัสกลุ่มให้เพื่อนร่วมทีม"
            >
              <span className="text-[10px] text-slate-400">รหัสกลุ่ม:</span>
              <span className="font-mono font-bold text-slate-800">
                {activeGroup.code}
              </span>
              {codeCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </div>
          )}


          {/* Availability Logging button */}
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth();
              } else {
                onOpenAvailabilityModal();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs shadow-blue-600/30 hover:bg-blue-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">แจ้งวันว่าง / ลา</span>
            <span className="sm:hidden">ลงเวลา</span>
          </button>

          {/* User profile / login */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 border border-slate-200">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden 2xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </p>
                  <span className="inline-block text-[10px] font-medium text-blue-600">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                title="ออกจากระบบ (Sign out)"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
