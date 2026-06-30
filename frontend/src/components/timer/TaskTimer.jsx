import { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { completeTask, updateTaskNote } from '../../api/tasks.api';

/**
 * Running stopwatch with Start / Pause / Resume / Mark Complete controls and
 * an editable task note.
 *
 * The 7:00 PM auto cut-off has been removed — a session runs until the
 * employee stops or completes it. Employees can Pause and Resume freely;
 * paused time is excluded from the recorded duration and every pause/resume
 * click is timestamped on the server.
 */
export default function TaskTimer({ task, onCompleted }) {
  const [activeLog, setActiveLog] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  // Note state
  const [note, setNote] = useState(task.employeeNote || '');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const isCompleted = task.status === 'completed';
  const isPaused = activeLog?.status === 'paused';

  useEffect(() => {
    if (isCompleted) return;
    axiosClient.get('/timelogs/active').then((res) => {
      const log = res.data.timeLog;
      if (log && log.task?._id === task._id) {
        setActiveLog(log);
      }
    });
  }, [task._id, isCompleted]);

  // Tick the visible clock. While paused it freezes at the pause moment.
  useEffect(() => {
    function compute() {
      if (!activeLog) return setElapsed(0);
      const start = new Date(activeLog.startTime).getTime();
      const pausedMs = (activeLog.pausedSeconds || 0) * 1000;
      if (activeLog.status === 'paused' && activeLog.lastPausedAt) {
        const frozen = new Date(activeLog.lastPausedAt).getTime();
        setElapsed(Math.max(0, Math.floor((frozen - start - pausedMs) / 1000)));
      } else {
        setElapsed(Math.max(0, Math.floor((Date.now() - start - pausedMs) / 1000)));
      }
    }
    compute();
    clearInterval(intervalRef.current);
    if (activeLog && activeLog.status !== 'paused') {
      intervalRef.current = setInterval(compute, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeLog]);

  async function handleStart() {
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/timelogs/start', { taskId: task._id });
      setActiveLog(res.data.timeLog);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the timer.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post(`/timelogs/${activeLog._id}/pause`);
      setActiveLog(res.data.timeLog);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not pause the timer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResume() {
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post(`/timelogs/${activeLog._id}/resume`);
      setActiveLog(res.data.timeLog);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resume the timer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setError('');
    setLoading(true);
    try {
      await completeTask(task._id);
      setActiveLog(null);
      onCompleted?.(task._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark this task complete.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote() {
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      await updateTaskNote(task._id, note);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the note.');
    } finally {
      setNoteSaving(false);
    }
  }

  function formatTime(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{task.title}</p>
          <p className="text-sm text-gray-500">{task.service?.name}</p>
        </div>

        <div className="flex items-center gap-3">
          {isCompleted ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              Completed
            </span>
          ) : (
            <>
              {activeLog && (
                <span className={`font-mono text-lg ${isPaused ? 'text-amber-500' : 'text-indigo-600'}`}>
                  {formatTime(elapsed)}
                  {isPaused && <span className="ml-2 text-xs font-sans text-amber-600">Paused</span>}
                </span>
              )}

              {!activeLog && (
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Starting...' : 'Start'}
                </button>
              )}

              {activeLog && !isPaused && (
                <button
                  onClick={handlePause}
                  disabled={loading}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  Pause
                </button>
              )}

              {activeLog && isPaused && (
                <button
                  onClick={handleResume}
                  disabled={loading}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  Resume
                </button>
              )}

              {activeLog && (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Mark Complete'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task note (visible to admin/manager too) */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Notes (progress, blockers, details)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note about this task..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleSaveNote}
            disabled={noteSaving}
            className="rounded-md border border-indigo-600 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
          >
            {noteSaving ? 'Saving...' : 'Save Note'}
          </button>
          {noteSaved && <span className="text-xs text-green-600">Saved ✓</span>}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
