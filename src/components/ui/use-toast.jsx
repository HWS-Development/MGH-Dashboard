// Inspired by react-hot-toast library
import { useState, useEffect, useCallback } from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 350; // ms after dismiss before removing from DOM (exit animation)
const TOAST_AUTO_DISMISS = 5000; // ms before auto-dismiss

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Timers for removing dismissed toasts from DOM
const removeTimeouts = new Map();
// Timers for auto-dismissing toasts
const autoDismissTimeouts = new Map();

function clearRemoveTimeout(toastId) {
  const t = removeTimeouts.get(toastId);
  if (t) { clearTimeout(t); removeTimeouts.delete(toastId); }
}

function clearAutoDismissTimeout(toastId) {
  const t = autoDismissTimeouts.get(toastId);
  if (t) { clearTimeout(t); autoDismissTimeouts.delete(toastId); }
}

function scheduleRemove(toastId) {
  if (removeTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    removeTimeouts.delete(toastId);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);
  removeTimeouts.set(toastId, timeout);
}

function scheduleAutoDismiss(toastId, duration) {
  clearAutoDismissTimeout(toastId);
  const timeout = setTimeout(() => {
    autoDismissTimeouts.delete(toastId);
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
  }, duration);
  autoDismissTimeouts.set(toastId, timeout);
}

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        clearAutoDismissTimeout(toastId);
        scheduleRemove(toastId);
      } else {
        state.toasts.forEach((t) => {
          clearAutoDismissTimeout(t.id);
          scheduleRemove(t.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

/**
 * Show a toast notification.
 * @param {object} props - { title, description, variant, duration }
 * @param {number} [props.duration=5000] - Auto-dismiss delay in ms. Pass Infinity to disable.
 */
function toast({ duration, ...props }) {
  const id = genId();
  const autoDismissMs = duration ?? TOAST_AUTO_DISMISS;

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => { if (!open) dismiss(); },
    },
  });

  // Schedule auto-dismiss (skip for Infinity)
  if (autoDismissMs !== Infinity && Number.isFinite(autoDismissMs)) {
    scheduleAutoDismiss(id, autoDismissMs);
  }

  return { id, dismiss, update: (p) => dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...p, id } }) };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  const dismiss = useCallback(
    (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    []
  );

  return { ...state, toast, dismiss };
}

export { useToast, toast }; 