import { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { completeTask } from '../../api/tasks.api';

/**
 * Displays a running stopwatch and Start / Mark Complete controls for a task.
 *
 * Deliberately no "pause" or "stop" button: once started, a task is either
 * actively being timed or it's done. The only two employee-driven actions
 * are starting the timer and marking the task complete (which stops the
 * timer as a side effect). The backend also auto-stops any running timer
 * at the 7:00 PM shift-end cutoff, even if the employee forgets.
 */
export default function TaskTimer({ task, onCompleted }) {
  const [activeLog, setActiveLog] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const isCompleted = task.status === 'completed';

  useEffect(() => {
    if (isCompleted) return;
    axiosClient.get('/timelogs/active').then((res) => {
      const log = res.data.timeLog;
      if (log && log.task._id === task._id) {
        setActiveLog(log);
      }
    });
  }, [task._id, isCompleted]);

  // Tick the visible clock every second while a timer is running.
  useEffect(() => {
    if (activeLog) {
      const startedAt = new Date(activeLog.startTime).getTime();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setElapsed(0);
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
                <span className="font-mono text-lg text-indigo-600">{formatTime(elapsed)}</span>
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

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
