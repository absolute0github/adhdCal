import { useState, useEffect } from 'react';
import { X, Calendar, Clock, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { getAvailableSlots } from '../../services/calendarService';
import { useTasks } from '../../context/TaskContext';
import { formatDuration, generateUUID } from '../../utils/timeUtils';
import SessionPreferenceModal from './SessionPreferenceModal';

export default function ScheduleWizard({ task, onClose }) {
  const { scheduleTask, addTask } = useTasks();
  const [step, setStep] = useState('loading'); // loading, session-preference, slot-selection, scheduling, done
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [sessionLength, setSessionLength] = useState(120);
  const [scheduleMode, setScheduleMode] = useState('manual'); // 'next' or 'manual'
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Determine if we need to show session preference (task > 2 hours)
  const needsSessionPreference = task.estimatedDuration > 120;

  useEffect(() => {
    if (needsSessionPreference) {
      setStep('session-preference');
    } else {
      fetchSlots(task.estimatedDuration);
    }
  }, [task]);

  async function fetchSlots(minDuration) {
    setStep('loading');
    setError(null);
    try {
      const data = await getAvailableSlots(null, null, Math.min(minDuration, 30));
      setSlots(data);

      // Pre-select slots for "next available" mode
      if (data.length > 0) {
        preselectSlots(data);
      }

      setStep('slot-selection');
    } catch (err) {
      setError('Failed to load available slots: ' + err.message);
      setStep('slot-selection');
    }
  }

  function preselectSlots(availableSlots) {
    const selected = [];
    let remainingDuration = task.estimatedDuration;

    for (const slot of availableSlots) {
      if (remainingDuration <= 0) break;

      const usableDuration = Math.min(slot.duration, sessionLength, remainingDuration);

      if (usableDuration >= 30) {
        const startTime = new Date(slot.start);
        const endTime = new Date(startTime.getTime() + usableDuration * 60000);

        selected.push({
          ...slot,
          sessionId: generateUUID(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: usableDuration
        });

        remainingDuration -= usableDuration;
      }
    }

    setSelectedSlots(selected);
  }

  function handleSessionPreference(length) {
    setSessionLength(length);
    fetchSlots(Math.min(length, task.estimatedDuration));
  }

  function toggleSlotSelection(slot, forceAdd = false) {
    setSelectedSlots(prev => {
      const existingIndex = prev.findIndex(s => s.id === slot.id);

      if (existingIndex >= 0 && !forceAdd) {
        // Remove slot
        return prev.filter(s => s.id !== slot.id);
      } else if (existingIndex < 0) {
        // Add slot - calculate remaining based on current selection
        const alreadyScheduled = task.scheduledSessions?.reduce((sum, s) => sum + s.duration, 0) || 0;
        const selectedDuration = prev.reduce((sum, s) => sum + s.duration, 0);
        const remainingToSchedule = task.estimatedDuration - alreadyScheduled - selectedDuration;

        // Allow selecting even if we've covered the duration (user might want to pick different slots)
        const usableDuration = Math.min(slot.duration, sessionLength, Math.max(remainingToSchedule, slot.duration));

        const startTime = new Date(slot.start);
        const endTime = new Date(startTime.getTime() + usableDuration * 60000);

        return [...prev, {
          ...slot,
          sessionId: generateUUID(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: usableDuration
        }];
      }
      return prev;
    });
  }

  function getRemainingToSchedule() {
    const alreadyScheduled = task.scheduledSessions?.reduce((sum, s) => sum + s.duration, 0) || 0;
    const selectedDuration = selectedSlots.reduce((sum, s) => sum + s.duration, 0);
    const remaining = task.estimatedDuration - alreadyScheduled - selectedDuration;
    return remaining > 0 ? remaining : 0;
  }

  async function handleSchedule() {
    if (selectedSlots.length === 0) {
      setError('Please select at least one time slot');
      return;
    }

    setStep('scheduling');
    setError(null);

    try {
      let taskToSchedule = task;

      // If this is a new task, create it first
      if (task.isNew) {
        taskToSchedule = await addTask({
          name: task.name,
          estimatedDuration: task.estimatedDuration
        });
      }

      const schedulingResult = await scheduleTask(taskToSchedule.id, selectedSlots, sessionLength);
      setResult(schedulingResult);
      setStep('done');
    } catch (err) {
      setError('Failed to schedule: ' + err.message);
      setStep('slot-selection');
    }
  }

  // Calculate totals
  const totalSelected = selectedSlots.reduce((sum, s) => sum + s.duration, 0);
  const alreadyScheduled = task.scheduledSessions?.reduce((sum, s) => sum + s.duration, 0) || 0;
  const remaining = task.estimatedDuration - alreadyScheduled - totalSelected;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Schedule Task</h3>
            <p className="text-sm text-gray-500">{task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'session-preference' && (
            <SessionPreferenceModal
              task={task}
              onConfirm={handleSessionPreference}
              onClose={onClose}
            />
          )}

          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Finding available time slots...</p>
            </div>
          )}

          {step === 'slot-selection' && (
            <>
              {/* Summary */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">
                    <strong>{formatDuration(task.estimatedDuration)}</strong> total
                    {alreadyScheduled > 0 && (
                      <span className="text-blue-600"> ({formatDuration(alreadyScheduled)} already scheduled)</span>
                    )}
                  </span>
                  <span className={remaining <= 0 ? 'text-green-600' : 'text-blue-600'}>
                    {remaining <= 0 ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4" /> Fully covered
                      </span>
                    ) : (
                      `${formatDuration(remaining)} remaining`
                    )}
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setScheduleMode('next');
                    preselectSlots(slots);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    scheduleMode === 'next'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Use Next Available
                </button>
                <button
                  onClick={() => {
                    setScheduleMode('manual');
                    setSelectedSlots([]);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    scheduleMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Choose Manually
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Slots List */}
              {slots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No available time slots found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try adjusting your working hours in preferences
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {slots.map((slot) => {
                    const isSelected = selectedSlots.some(s => s.id === slot.id);
                    const selectedSlot = selectedSlots.find(s => s.id === slot.id);

                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          if (scheduleMode === 'next') {
                            setScheduleMode('manual');
                          }
                          toggleSlotSelection(slot);
                        }}
                        className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {slot.displayDate}
                            </p>
                            <p className="text-sm text-gray-600">
                              {slot.displayTime}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {isSelected
                                ? `Using ${formatDuration(selectedSlot.duration)}`
                                : `${formatDuration(slot.duration)} available`
                              }
                            </span>
                            {isSelected && (
                              <Check className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Summary */}
              {selectedSlots.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected: {selectedSlots.length} session{selectedSlots.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1">
                    {selectedSlots.map((slot, index) => (
                      <p key={slot.sessionId} className="text-xs text-gray-600">
                        {index + 1}. {slot.displayDate} {slot.displayTime?.split(' - ')[0]} - {formatDuration(slot.duration)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'scheduling' && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Creating calendar events...</p>
            </div>
          )}

          {step === 'done' && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Task Scheduled!
              </h4>
              <p className="text-gray-600 mb-4">
                {result.sessionsCreated} session{result.sessionsCreated > 1 ? 's' : ''} created
                ({formatDuration(result.totalScheduled)} scheduled)
              </p>
              {result.remainingDuration > 0 && (
                <p className="text-sm text-orange-600">
                  {formatDuration(result.remainingDuration)} still needs to be scheduled
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'slot-selection' || step === 'done') && (
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {step === 'done' ? 'Close' : 'Cancel'}
            </button>
            {step === 'slot-selection' && (
              <button
                onClick={handleSchedule}
                disabled={selectedSlots.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
