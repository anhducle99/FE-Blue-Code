import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/BottomTabBar';
import api from '../services/api';
import auth from '../services/auth';
import { connectSocket, getSocket } from '../services/socket';
import type { CallLog, DepartmentOption, FloorAccountOption } from '../types';

interface HomePageProps {
  onLogout: () => void;
}

type NoticeState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

type OutgoingCallStatus = 'Đang chờ' | 'Đã xác nhận' | 'Từ chối' | 'Không liên lạc được' | 'Đã hủy';

interface ConfirmOutgoingCallModalProps {
  isOpen: boolean;
  targetName: string;
  fromDept: string;
  incidentLocation: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface OutgoingCallStatusModalProps {
  isOpen: boolean;
  callId?: string | null;
  targets: string[];
  fromDept: string;
  onClose: () => void;
}

function normalize(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function isSameCallList(prev: CallLog[], next: CallLog[]) {
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i += 1) {
    if (
      prev[i].id !== next[i].id ||
      prev[i].callId !== next[i].callId ||
      prev[i].status !== next[i].status ||
      prev[i].fromUser !== next[i].fromUser ||
      prev[i].toUser !== next[i].toUser ||
      prev[i].message !== next[i].message ||
      prev[i].imageUrl !== next[i].imageUrl ||
      prev[i].createdAt !== next[i].createdAt ||
      prev[i].acceptedAt !== next[i].acceptedAt ||
      prev[i].rejectedAt !== next[i].rejectedAt
    ) {
      return false;
    }
  }

  return true;
}

function hasNewPendingCall(prev: CallLog[], next: CallLog[]) {
  const previousIds = new Set(prev.map((call) => call.callId));
  return next.some((call) => !previousIds.has(call.callId));
}

function makeDepartmentKey(name: string) {
  return `${name}_${name}`;
}

function HomePage({ onLogout }: HomePageProps) {
  const navigate = useNavigate();
  const user = auth.getUser();
  const hasSession = auth.isAuthenticated() && !!user;

  const [pendingCalls, setPendingCalls] = useState<CallLog[]>([]);
  const [floorAccounts, setFloorAccounts] = useState<FloorAccountOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedFloorAccountId, setSelectedFloorAccountId] = useState<number | null>(null);
  const [isFloorDropdownOpen, setIsFloorDropdownOpen] = useState(false);
  const [floorSearch, setFloorSearch] = useState('');
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState<string | null>(null);
  const [callNotice, setCallNotice] = useState<NoticeState>(null);
  const [error, setError] = useState('');
  const [directoryNotice, setDirectoryNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newCallAlert, setNewCallAlert] = useState(false);
  const [confirmCallOpen, setConfirmCallOpen] = useState(false);
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);
  const [outgoingStatusOpen, setOutgoingStatusOpen] = useState(false);
  const [outgoingCallId, setOutgoingCallId] = useState<string | null>(null);
  const [outgoingTargets, setOutgoingTargets] = useState<string[]>([]);

  const callsRef = useRef<CallLog[]>([]);
  const silentReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floorDropdownRef = useRef<HTMLDivElement | null>(null);
  const organizationLabel = user?.organizationName || user?.departmentName || 'Mini App';

  const selectedDepartment = useMemo(
    () => departments.find((item) => makeDepartmentKey(item.name) === selectedDepartmentKey) || null,
    [departments, selectedDepartmentKey]
  );
  const selectedFloorAccount = useMemo(
    () => floorAccounts.find((item) => item.id === selectedFloorAccountId) || null,
    [floorAccounts, selectedFloorAccountId]
  );
  const floorInputValue = isFloorDropdownOpen ? floorSearch : selectedFloorAccount?.name || '';
  const filteredFloorAccounts = useMemo(() => {
    const keyword = normalize(floorSearch);
    if (!keyword) return floorAccounts;
    return floorAccounts.filter((item) => normalize(item.name).includes(keyword));
  }, [floorAccounts, floorSearch]);

  const loadPendingCalls = useCallback(
    async (silent = false) => {
      if (!hasSession) {
        setPendingCalls([]);
        setNewCallAlert(false);
        return;
      }

      try {
        const response = await api.getMyCalls('pending');
        if (!response.success) {
          if (!silent) {
            setError(response.message || 'Không thể tải cuộc gọi chờ xử lý');
          }
          return;
        }

        const nextCalls = response.data;
        const previousCalls = callsRef.current;

        if (!isSameCallList(previousCalls, nextCalls)) {
          if (hasNewPendingCall(previousCalls, nextCalls)) {
            setNewCallAlert(true);
          }

          callsRef.current = nextCalls;
          setPendingCalls(nextCalls);
        } else if (nextCalls.length === 0) {
          setNewCallAlert(false);
        }
      } catch (err: any) {
        if (!silent) {
          setError(`Lỗi kết nối: ${err.message}`);
        }
      }
    },
    [hasSession]
  );

  const loadDirectory = useCallback(
    async (silent = false) => {
      if (!hasSession) {
        setFloorAccounts([]);
        setDepartments([]);
        if (!silent) setIsLoading(false);
        return;
      }

      if (!silent) {
        setIsLoading(true);
        setError('');
        setDirectoryNotice('');
      }

      try {
        const [directoryResponse, callsResponse] = await Promise.all([
          api.getDashboardOptions(),
          api.getMyCalls('pending'),
        ]);

        if (directoryResponse.success) {
          setFloorAccounts(directoryResponse.data.floorAccounts || []);
          setDepartments(directoryResponse.data.departments || []);
          setDirectoryNotice('');
        } else {
          setFloorAccounts([]);
          setDepartments([]);
          setDirectoryNotice(
            directoryResponse.message || 'Không thể tải danh sách hiển thị'
          );
        }

        if (callsResponse.success) {
          callsRef.current = callsResponse.data;
          setPendingCalls(callsResponse.data);
          if (callsResponse.data.length === 0) {
            setNewCallAlert(false);
          }
        }
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        if (status === 404) {
          setDirectoryNotice(
            'Backend chưa có route dashboard-options. Hãy restart BE rồi tải lại trang.'
          );
          setFloorAccounts([]);
          setDepartments([]);
        } else if (!silent) {
          setError(`Lỗi kết nối: ${err.message}`);
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [hasSession]
  );

  const scheduleSilentReload = useCallback(() => {
    if (silentReloadTimerRef.current) return;

    silentReloadTimerRef.current = setTimeout(() => {
      silentReloadTimerRef.current = null;
      void loadPendingCalls(true);
    }, 200);
  }, [loadPendingCalls]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (!selectedDepartment) {
      setConfirmCallOpen(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedFloorAccount) {
      setConfirmCallOpen(false);
    }
  }, [selectedFloorAccount]);

  useEffect(() => {
    setSelectedFloorAccountId((previous) => {
      if (floorAccounts.length === 0) return null;
      if (previous != null && floorAccounts.some((item) => item.id === previous)) {
        return previous;
      }
      return null;
    });
  }, [floorAccounts]);

  useEffect(() => {
    if (!hasSession) return;

    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const isMine = (target?: string | null) => {
      const normalizedTarget = normalize(target);
      if (!normalizedTarget) return false;

      return (
        normalizedTarget === normalize(user?.name) ||
        normalizedTarget === normalize(user?.departmentName)
      );
    };

    const onIncoming = (data: any) => {
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      setNewCallAlert(true);
      scheduleSilentReload();
    };

    const onStatusUpdate = (data?: { callId?: string; call_id?: string; status?: string }) => {
      const eventCallId = String(data?.callId || data?.call_id || '').trim();
      const nextStatus = String(data?.status || '').toLowerCase();

      if (eventCallId && nextStatus && nextStatus !== 'pending') {
        setPendingCalls((previous) => previous.filter((call) => call.callId !== eventCallId));
        callsRef.current = callsRef.current.filter((call) => call.callId !== eventCallId);
      }

      scheduleSilentReload();
    };

    socket.on('callLogCreated', onIncoming);
    socket.on('incomingCall', onIncoming);
    socket.on('callLogUpdated', onStatusUpdate);
    socket.on('callStatusUpdate', onStatusUpdate);

    return () => {
      socket.off('callLogCreated', onIncoming);
      socket.off('incomingCall', onIncoming);
      socket.off('callLogUpdated', onStatusUpdate);
      socket.off('callStatusUpdate', onStatusUpdate);
    };
  }, [hasSession, scheduleSilentReload, user?.departmentName, user?.name]);

  useEffect(() => {
    if (!hasSession) return;

    const onFocus = () => {
      void loadDirectory(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadPendingCalls(true);
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hasSession, loadDirectory, loadPendingCalls]);

  useEffect(() => {
    if (!hasSession) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadPendingCalls(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasSession, loadPendingCalls]);

  useEffect(() => {
    return () => {
      if (silentReloadTimerRef.current) {
        clearTimeout(silentReloadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floorDropdownRef.current && !floorDropdownRef.current.contains(event.target as Node)) {
        setIsFloorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openFirstPendingCall = useCallback(() => {
    if (pendingCalls[0]?.callId) {
      navigate(`/call/${pendingCalls[0].callId}`);
      return;
    }

    void loadPendingCalls(true);
  }, [loadPendingCalls, navigate, pendingCalls]);

  const handleSelectDepartment = useCallback((department: DepartmentOption) => {
    setCallNotice(null);
    setSelectedDepartmentKey((previous) => {
      const nextKey = makeDepartmentKey(department.name);
      return previous === nextKey ? null : nextKey;
    });
  }, []);

  const handleSelectFloorAccount = useCallback((floorAccount: FloorAccountOption) => {
    setCallNotice(null);
    setSelectedFloorAccountId((previous) => (previous === floorAccount.id ? null : floorAccount.id));
    setFloorSearch('');
    setIsFloorDropdownOpen(false);
  }, []);

  const handleOpenConfirmCall = useCallback(() => {
    if (!selectedFloorAccount) {
      setCallNotice({ type: 'error', message: 'Vui lòng chọn vị trí sự cố.' });
      return;
    }

    if (!selectedDepartment) {
      setCallNotice({ type: 'error', message: 'Vui lòng chọn đội phản ứng cần gọi.' });
      return;
    }

    setCallNotice(null);
    setConfirmCallOpen(true);
  }, [selectedDepartment, selectedFloorAccount]);

  const handleCloseConfirmCall = useCallback(() => {
    if (isSubmittingCall) return;
    setConfirmCallOpen(false);
  }, [isSubmittingCall]);

  const handleCloseOutgoingStatus = useCallback(() => {
    setOutgoingStatusOpen(false);
  }, []);

  const handleConfirmCall = useCallback(async () => {
    if (!selectedFloorAccount) {
      setConfirmCallOpen(false);
      setCallNotice({ type: 'error', message: 'Vui lòng chọn vị trí sự cố.' });
      return;
    }

    if (!selectedDepartment) {
      setConfirmCallOpen(false);
      setCallNotice({ type: 'error', message: 'Vui lòng chọn đội phản ứng cần gọi.' });
      return;
    }

    try {
      setIsSubmittingCall(true);
      const response = await api.requestCall(
        [makeDepartmentKey(selectedDepartment.name)],
        undefined,
        selectedFloorAccount.name
      );

      setConfirmCallOpen(false);

      if (!response.success) {
        setCallNotice({
          type: 'error',
          message: response.message || 'Không thể tạo cuộc gọi.',
        });
        return;
      }

      const nextTargets =
        Array.isArray(response.data?.receiverNames) && response.data.receiverNames.length > 0
          ? response.data.receiverNames
          : [selectedDepartment.name];

      setOutgoingCallId(response.data.callId);
      setOutgoingTargets(nextTargets);
      setOutgoingStatusOpen(true);
      setSelectedDepartmentKey(null);
      setCallNotice(null);
    } catch (err: any) {
      setConfirmCallOpen(false);
      setCallNotice({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Không thể kết nối server.',
      });
    } finally {
      setIsSubmittingCall(false);
    }
  }, [selectedDepartment, selectedFloorAccount]);

  const canRequestCall = !!selectedDepartment && !!selectedFloorAccount && !isSubmittingCall;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>BlueCode</h1>
          <p style={styles.headerSub}>Xin chào, {user?.name || 'Khách'}</p>
          <p style={styles.headerMeta}>{organizationLabel}</p>
        </div>
        {hasSession ? (
          <button onClick={onLogout} style={styles.headerButton}>
            Đăng xuất
          </button>
        ) : (
          <Link to="/qr" style={{ ...styles.headerButton, textDecoration: 'none' }}>
            Đăng nhập QR
          </Link>
        )}
      </div>

      {hasSession && newCallAlert && (
        <div style={styles.alertBanner} onClick={openFirstPendingCall}>
          Có cuộc gọi tới mới. Nhấn để mở xử lý ngay.
        </div>
      )}

      <div style={styles.content}>
        {error ? (
          <div style={styles.centerCard}>
            <p style={styles.errorText}>{error}</p>
            <button onClick={() => void loadDirectory()} style={styles.primaryButton}>
              Thử lại
            </button>
          </div>
        ) : (
          <div style={styles.homeSections}>
            {directoryNotice ? <div style={styles.noticeBox}>{directoryNotice}</div> : null}

            <section style={styles.sectionCard}>
              <div style={styles.sectionHead}>
                <div style={styles.sectionTitleWrap}>
                  <span style={styles.sectionIcon}>1.</span>
                  <h2 style={styles.sectionTitle}>VỊ TRÍ SỰ CỐ</h2>
                </div>
              </div>

              {isLoading ? (
                <div style={styles.centerInline}>Đang tải...</div>
              ) : floorAccounts.length === 0 ? (
                <div style={styles.emptyBox}>Chưa có tài khoản vị trí sự cố.</div>
              ) : (
                <div style={styles.dropdownWrap} ref={floorDropdownRef}>
                  <div
                    style={{
                      ...styles.dropdownTrigger,
                      ...(isFloorDropdownOpen ? styles.dropdownTriggerOpen : {}),
                    }}
                  >
                    <input
                      value={floorInputValue}
                      onFocus={() => setIsFloorDropdownOpen(true)}
                      onClick={() => setIsFloorDropdownOpen(true)}
                      onChange={(event) => {
                        setCallNotice(null);
                        setFloorSearch(event.target.value);
                        setIsFloorDropdownOpen(true);
                      }}
                      placeholder="Chọn vị trí sự cố"
                      style={styles.dropdownTriggerInput}
                    />
                    <button
                      type="button"
                      onClick={() => setIsFloorDropdownOpen((previous) => !previous)}
                      style={styles.dropdownArrowButton}
                      aria-label="Mở danh sách vị trí sự cố"
                    >
                      <span style={styles.dropdownArrow}>{isFloorDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                  </div>

                  {isFloorDropdownOpen ? (
                    <div style={styles.dropdownPanel}>
                      <div style={styles.dropdownList}>
                        {filteredFloorAccounts.length > 0 ? (
                          filteredFloorAccounts.map((account) => {
                            const isSelected = selectedFloorAccountId === account.id;

                            return (
                              <button
                                key={account.id}
                                type="button"
                                onClick={() => handleSelectFloorAccount(account)}
                                style={{
                                  ...styles.dropdownOption,
                                  ...(isSelected ? styles.dropdownOptionSelected : {}),
                                }}
                              >
                                {account.name}
                              </button>
                            );
                          })
                        ) : (
                          <div style={styles.dropdownEmpty}>Không tìm thấy vị trí phù hợp.</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section style={{ ...styles.sectionCard, ...styles.responseSectionCard }}>
              <div style={styles.sectionHeadColumn}>
                <div style={styles.sectionTitleWrap}>
                  <span style={styles.sectionIcon}>2.</span>
                  <h2 style={styles.sectionTitle}>CHỌN ĐỘI PHẢN ỨNG CẦN GỌI</h2>
                </div>
                <p style={styles.sectionHint}>(NHẤN CHỌN ĐỘI RỒI BẤM GỌI NGAY)</p>
              </div>

              <div style={styles.sectionHead}>
                {pendingCalls.length > 0 ? (
                  <button type="button" onClick={openFirstPendingCall} style={styles.pendingChip}>
                    {pendingCalls.length} cuộc gọi chờ xử lý
                  </button>
                ) : null}
              </div>

              {callNotice ? (
                <div style={callNotice.type === 'success' ? styles.successBox : styles.errorBox}>
                  {callNotice.message}
                </div>
              ) : null}

              {isLoading ? (
                <div style={styles.centerInline}>Đang tải...</div>
              ) : departments.length === 0 ? (
                <div style={styles.emptyBox}>Chưa có đội phản ứng nào để hiển thị.</div>
              ) : (
                <>
                  <div style={styles.departmentGridWrap}>
                    <div style={styles.departmentGrid}>
                    {departments.map((department) => {
                      const selected = makeDepartmentKey(department.name) === selectedDepartmentKey;

                      return (
                        <button
                          key={department.id}
                          type="button"
                          onClick={() => handleSelectDepartment(department)}
                          style={{
                            ...styles.departmentCard,
                            ...(selected ? styles.departmentCardSelected : {}),
                          }}
                        >
                          <div style={styles.departmentName}>{department.name}</div>
                          <div style={styles.departmentPhone}>
                            {department.phone || 'Chưa có số'}
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>

                  <div style={styles.callButtonWrap}>
                    <button
                      type="button"
                      onClick={handleOpenConfirmCall}
                      disabled={!canRequestCall}
                      style={{
                        ...styles.callButton,
                        ...(canRequestCall ? styles.callButtonEnabled : styles.callButtonDisabled),
                      }}
                    >
                      <div style={styles.callButtonTitle}>Gọi ngay</div>
                      <div style={styles.callButtonHint}>
                        {selectedDepartment
                          ? `Gọi tới đội ${selectedDepartment.name}`
                          : 'Chọn vị trí sự cố và đội phản ứng để gọi'}
                      </div>
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>

      <ConfirmOutgoingCallModal
        isOpen={confirmCallOpen}
        targetName={selectedDepartment?.name || ''}
        fromDept={user?.name || user?.departmentName || ''}
        incidentLocation={selectedFloorAccount?.name || ''}
        isSubmitting={isSubmittingCall}
        onClose={handleCloseConfirmCall}
        onConfirm={() => void handleConfirmCall()}
      />

      <OutgoingCallStatusModal
        isOpen={outgoingStatusOpen}
        callId={outgoingCallId}
        targets={outgoingTargets}
        fromDept={selectedFloorAccount?.name || user?.departmentName || user?.name || ''}
        onClose={handleCloseOutgoingStatus}
      />

      <BottomTabBar />
    </div>
  );
}

function OutgoingCallStatusModal({
  isOpen,
  callId,
  targets,
  fromDept,
  onClose,
}: OutgoingCallStatusModalProps) {
  const [statusMap, setStatusMap] = useState<Record<string, OutgoingCallStatus>>({});
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    if (!isOpen) return;

    const initialStatus: Record<string, OutgoingCallStatus> = {};
    targets.forEach((target) => {
      initialStatus[target] = 'Đang chờ';
    });

    setStatusMap(initialStatus);
    setCountdown(20);
  }, [isOpen, targets]);

  useEffect(() => {
    if (!isOpen || !callId) return;

    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const handleStatusUpdate = (data?: {
      callId?: string;
      call_id?: string;
      toUser?: string;
      to_user?: string;
      toDept?: string;
      to_dept?: string;
      status?: string;
    }) => {
      const eventCallId = String(data?.callId || data?.call_id || '').trim();
      if (!eventCallId || eventCallId !== callId) return;

      const targetName = String(
        data?.toUser || data?.to_user || data?.toDept || data?.to_dept || ''
      ).trim();
      if (!targetName) return;

      let nextStatus: OutgoingCallStatus = 'Không liên lạc được';
      switch (String(data?.status || '').toLowerCase()) {
        case 'accepted':
          nextStatus = 'Đã xác nhận';
          break;
        case 'rejected':
          nextStatus = 'Từ chối';
          break;
        case 'cancelled':
          nextStatus = 'Đã hủy';
          break;
        case 'timeout':
        default:
          nextStatus = 'Không liên lạc được';
          break;
      }

      setStatusMap((previous) => ({
        ...previous,
        [targetName]: nextStatus,
      }));
    };

    socket.on('callStatusUpdate', handleStatusUpdate);
    return () => {
      socket.off('callStatusUpdate', handleStatusUpdate);
    };
  }, [callId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setStatusMap((current) => {
            const next = { ...current };
            Object.keys(next).forEach((target) => {
              if (next[target] === 'Đang chờ') {
                next[target] = 'Không liên lạc được';
              }
            });
            return next;
          });

          setTimeout(() => onClose(), 1200);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || targets.length === 0) return;

    const allResolved = targets.every((target) => {
      const status = statusMap[target];
      return status && status !== 'Đang chờ';
    });

    if (!allResolved) return;

    const timer = setTimeout(() => onClose(), 1500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, statusMap, targets]);

  if (!isOpen) return null;

  return (
    <div style={styles.modalBackdrop}>
      <div style={{ ...styles.modalCard, ...styles.statusModalCard }}>
        <div style={styles.statusModalHead}>
          <div>
            <h3 style={styles.modalTitle}>Trạng thái cuộc gọi</h3>
            <p style={styles.statusModalSub}>
              {fromDept ? `Vị trí sự cố: ${fromDept}` : 'Đang theo dõi phản hồi'}
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.statusCloseButton}>
            Đóng
          </button>
        </div>

        <div style={styles.statusSummary}>
          Tự đóng sau <strong>{countdown}s</strong>
        </div>

        <div style={styles.statusList}>
          {targets.map((target) => {
            const status = statusMap[target] || 'Đang chờ';
            const tone =
              status === 'Đã xác nhận'
                ? styles.statusBadgeSuccess
                : status === 'Từ chối'
                ? styles.statusBadgeError
                : status === 'Đã hủy'
                ? styles.statusBadgeWarn
                : status === 'Không liên lạc được'
                ? styles.statusBadgeMuted
                : styles.statusBadgePending;

            return (
              <div key={target} style={styles.statusRow}>
                <div style={styles.statusTarget}>{target}</div>
                <div style={{ ...styles.statusBadge, ...tone }}>{status}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConfirmOutgoingCallModal({
  isOpen,
  targetName,
  fromDept,
  incidentLocation,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmOutgoingCallModalProps) {
  if (!isOpen) return null;

  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalCard}>
        <div style={styles.modalIcon}>☎</div>
        <h3 style={styles.modalTitle}>Xác nhận gọi đi</h3>
        <p style={styles.modalText}>
          Bạn có chắc muốn gửi cuộc gọi tới đội phản ứng{' '}
          <strong>{targetName}</strong>
          {' không?'}
        </p>

        <div style={styles.modalMeta}>
          <div style={styles.modalMetaRow}>
            <span style={styles.modalMetaLabel}>Vị trí sự cố</span>
            <strong style={styles.modalMetaValue}>{incidentLocation || 'Chưa chọn'}</strong>
          </div>
          <div style={styles.modalMetaRow}>
            <span style={styles.modalMetaLabel}>Người gửi</span>
            <strong style={styles.modalMetaValue}>{fromDept || 'Không xác định'}</strong>
          </div>
          <div style={styles.modalMetaRow}>
            <span style={styles.modalMetaLabel}>Người nhận</span>
            <strong style={styles.modalMetaValue}>{targetName}</strong>
          </div>
        </div>

        <div style={styles.modalActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ ...styles.modalButton, ...styles.modalCancelButton }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{ ...styles.modalButton, ...styles.modalConfirmButton }}
          >
            {isSubmitting ? 'Đang gọi...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100dvh',
    minHeight: '100dvh',
    maxHeight: '100dvh',
    background: '#f3f6fb',
    paddingBottom: '84px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 62%, #03559a 100%)',
    color: '#fff',
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 800,
  },
  headerSub: {
    margin: '6px 0 0',
    fontSize: '14px',
    fontWeight: 700,
  },
  headerMeta: {
    margin: '4px 0 0',
    fontSize: '12px',
    opacity: 0.9,
  },
  headerButton: {
    background: 'rgba(255,255,255,0.18)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.32)',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  alertBanner: {
    margin: '14px 16px 0',
    background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '16px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  content: {
    padding: '12px 12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  homeSections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  sectionCard: {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #d7e3f1',
    padding: '16px',
    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
  },
  responseSectionCard: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  sectionHeadColumn: {
    display: 'grid',
    gap: '4px',
    marginBottom: '8px',
  },
  sectionTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    color: '#0365af',
    fontWeight: 800,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color: '#334155',
    letterSpacing: '0.01em',
  },
  sectionHint: {
    margin: 0,
    paddingLeft: '24px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },
  chip: {
    padding: '9px 12px',
    borderRadius: '12px',
    border: '1px solid #d8e2ee',
    background: '#eef5ff',
    color: '#1d4ed8',
    fontSize: '12px',
    fontWeight: 700,
  },
  pendingChip: {
    border: 'none',
    background: '#fff4e5',
    color: '#c2410c',
    fontSize: '12px',
    fontWeight: 700,
    padding: '10px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  noticeBox: {
    borderRadius: '14px',
    padding: '14px 16px',
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#c2410c',
    fontSize: '13px',
  },
  successBox: {
    marginBottom: '10px',
    borderRadius: '14px',
    padding: '10px 12px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    fontSize: '13px',
  },
  errorBox: {
    marginBottom: '10px',
    borderRadius: '14px',
    padding: '10px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '13px',
  },
  centerCard: {
    textAlign: 'center',
    padding: '34px 20px',
    borderRadius: '18px',
    background: '#fff',
    border: '1px solid #dbe4ef',
  },
  centerInline: {
    textAlign: 'center',
    padding: '16px 12px',
    color: '#64748b',
    fontSize: '14px',
  },
  errorText: {
    color: '#dc2626',
    margin: '0 0 14px',
  },
  primaryButton: {
    background: '#0365af',
    color: '#fff',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dropdownWrap: {
    position: 'relative',
    zIndex: 20,
  },
  dropdownTrigger: {
    width: '100%',
    minHeight: '58px',
    borderRadius: '22px',
    border: '1.5px solid #93c5fd',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 55%, #eef6ff 100%)',
    padding: '0 10px 0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.92)',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease, border-radius 0.18s ease, background 0.18s ease',
    overflow: 'hidden',
  },
  dropdownTriggerOpen: {
    border: '1.5px solid #0f86d6',
    boxShadow: '0 14px 30px rgba(15, 134, 214, 0.16), inset 0 1px 0 rgba(255,255,255,0.96)',
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
    borderBottomColor: '#dbeafe',
    background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
  },
  dropdownTriggerInput: {
    flex: 1,
    minWidth: 0,
    minHeight: '56px',
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#1d4ed8',
    outline: 'none',
  },
  dropdownArrowButton: {
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  dropdownArrow: {
    fontSize: '12px',
    color: '#0365af',
    flexShrink: 0,
  },
  dropdownPanel: {
    position: 'absolute',
    top: 'calc(100% - 1px)',
    left: 0,
    right: 0,
    maxHeight: 'min(280px, calc(100dvh - 300px))',
    borderRadius: '0 0 18px 18px',
    border: '1.5px solid #0f86d6',
    borderTop: '0',
    background: 'linear-gradient(180deg, #f8fbff 0%, #eef7ff 100%)',
    boxShadow: '0 20px 40px rgba(15, 134, 214, 0.14)',
    overflow: 'hidden',
    zIndex: 30,
  },
  dropdownList: {
    maxHeight: 'min(280px, calc(100dvh - 300px))',
    overflowY: 'auto',
    padding: '0',
    display: 'grid',
    gap: '0',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  },
  dropdownOption: {
    border: 'none',
    borderTop: '1px solid #dbeafe',
    background: 'transparent',
    color: '#334155',
    borderRadius: '0',
    minHeight: '42px',
    padding: '0 16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
  },
  dropdownOptionSelected: {
    background: 'linear-gradient(180deg, #1992da 0%, #0f86d6 100%)',
    color: '#fff',
  },
  dropdownEmpty: {
    textAlign: 'center',
    padding: '18px 14px',
    color: '#475569',
    fontSize: '13px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '18px 14px',
    borderRadius: '14px',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    fontSize: '13px',
  },
  departmentGridWrap: {
    overflow: 'visible',
  },
  departmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))',
    gap: '12px',
    alignContent: 'start',
  },
  departmentCard: {
    minHeight: '104px',
    borderRadius: '18px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    border: '1.5px solid #dbe4ef',
    padding: '12px 10px',
    display: 'grid',
    gap: '8px',
    alignItems: 'center',
    justifyItems: 'center',
    color: '#475569',
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)',
  },
  departmentCardSelected: {
    background: '#e7f1ff',
    border: '1.5px solid #0f86d6',
    boxShadow: '0 12px 24px rgba(15, 134, 214, 0.14)',
  },
  departmentName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
    textAlign: 'center',
  },
  departmentPhone: {
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
  },
  callButtonWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: '14px',
  },
  callButton: {
    width: '100%',
    maxWidth: '280px',
    minHeight: '96px',
    borderRadius: '20px',
    border: '2px solid #d1d5db',
    display: 'grid',
    gap: '6px',
    placeItems: 'center',
    padding: '14px 18px',
    fontWeight: 800,
  },
  callButtonEnabled: {
    background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    border: '2px solid #b91c1c',
    cursor: 'pointer',
  },
  callButtonDisabled: {
    background: '#d1d5db',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  callButtonTitle: {
    fontSize: '20px',
  },
  callButtonHint: {
    fontSize: '12px',
    textAlign: 'center',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.52)',
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '360px',
    background: '#fff',
    borderRadius: '22px',
    padding: '22px 18px 18px',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)',
    display: 'grid',
    gap: '14px',
  },
  statusModalCard: {
    maxWidth: '380px',
    maxHeight: '78dvh',
    gridTemplateRows: 'auto auto minmax(0, 1fr)',
  },
  modalIcon: {
    width: '58px',
    height: '58px',
    margin: '0 auto',
    borderRadius: '50%',
    background: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
  },
  modalTitle: {
    margin: 0,
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
  },
  modalText: {
    margin: 0,
    textAlign: 'center',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
  },
  modalMeta: {
    borderRadius: '16px',
    border: '1px solid #dbeafe',
    background: '#eff6ff',
    padding: '12px 14px',
    display: 'grid',
    gap: '10px',
  },
  modalMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  modalMetaLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
  },
  modalMetaValue: {
    fontSize: '13px',
    color: '#0f172a',
  },
  modalActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  modalButton: {
    minHeight: '46px',
    borderRadius: '14px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  modalCancelButton: {
    background: '#e5e7eb',
    color: '#334155',
  },
  modalConfirmButton: {
    background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
  },
  statusModalHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  statusModalSub: {
    margin: '6px 0 0',
    fontSize: '13px',
    color: '#64748b',
  },
  statusCloseButton: {
    border: 'none',
    background: '#e2e8f0',
    color: '#334155',
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  statusSummary: {
    borderRadius: '14px',
    border: '1px solid #dbeafe',
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '10px 12px',
    fontSize: '13px',
    textAlign: 'center',
  },
  statusList: {
    minHeight: 0,
    overflowY: 'auto',
    display: 'grid',
    gap: '10px',
    paddingRight: '2px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
    background: '#fff',
    padding: '12px 14px',
  },
  statusTarget: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  },
  statusBadge: {
    borderRadius: '999px',
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  statusBadgePending: {
    background: '#dbeafe',
    color: '#1d4ed8',
  },
  statusBadgeSuccess: {
    background: '#dcfce7',
    color: '#15803d',
  },
  statusBadgeError: {
    background: '#fee2e2',
    color: '#b91c1c',
  },
  statusBadgeWarn: {
    background: '#ffedd5',
    color: '#c2410c',
  },
  statusBadgeMuted: {
    background: '#e5e7eb',
    color: '#4b5563',
  },
};

export default HomePage;

