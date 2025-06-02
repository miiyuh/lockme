"use client"

/**
 * Toast Notification System
 *
 * A client-side toast notification system inspired by react-hot-toast library.
 * Provides a centralized way to display, update, and dismiss toast notifications
 * throughout the application.
 *
 * Features:
 * - Global toast state management without context providers
 * - Toast creation, updating, and dismissal API
 * - Customizable toast components with actions
 * - Automatic removal of dismissed toasts
 * - Limit control for maximum displayed toasts
 *
 * Inspired by react-hot-toast library
 */

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

/**
 * Configuration constants
 */
const TOAST_LIMIT = 1             // Maximum number of toasts displayed simultaneously
const TOAST_REMOVE_DELAY = 1000000 // Delay in ms before removing dismissed toasts from state

/**
 * Extended toast type that includes all toast properties
 */
type ToasterToast = ToastProps & {
  /** Unique identifier for the toast */
  id: string
  /** Main heading content of the toast */
  title?: React.ReactNode
  /** Additional descriptive content of the toast */
  description?: React.ReactNode
  /** Optional interactive element to display in the toast */
  action?: ToastActionElement
}

/**
 * Action type constants for the reducer
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// Counter for generating unique toast IDs
let count = 0

/**
 * Generates a unique ID for toasts
 * Uses a counter that wraps around when it reaches MAX_SAFE_INTEGER
 *
 * @returns {string} A unique ID string
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

/**
 * Type for the action types object
 */
type ActionType = typeof actionTypes

/**
 * Union type for all possible reducer actions
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * State interface for the toast system
 */
interface State {
  /** Array of active toast notifications */
  toasts: ToasterToast[]
}

/**
 * Map to store timeouts for toast removal
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Adds a toast to the removal queue
 * Creates a timeout to remove the toast after TOAST_REMOVE_DELAY
 *
 * @param {string} toastId - ID of the toast to queue for removal
 */
const addToRemoveQueue = (toastId: string) => {
  // Prevent duplicate timeouts
  if (toastTimeouts.has(toastId)) {
    return
  }

  // Set timeout to remove the toast
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  // Store the timeout
  toastTimeouts.set(toastId, timeout)
}

/**
 * Reducer function for toast state management
 * Handles adding, updating, dismissing, and removing toasts
 *
 * @param {State} state - Current toast state
 * @param {Action} action - Action to perform
 * @returns {State} Updated toast state
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Add new toast and limit to TOAST_LIMIT
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      // Update existing toast by ID
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // Add toast(s) to removal queue
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        // If no ID provided, dismiss all toasts
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      // Mark toasts as closed but don't remove yet
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      // Remove toast by ID, or all toasts if no ID provided
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

/**
 * Subscribers to state changes
 */
const listeners: Array<(state: State) => void> = []

/**
 * Current toast state in memory
 */
let memoryState: State = { toasts: [] }

/**
 * Dispatches an action to update toast state and notifies listeners
 *
 * @param {Action} action - Action to dispatch
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Type for creating a new toast (omits ID which is auto-generated)
 */
type Toast = Omit<ToasterToast, "id">

/**
 * Creates a new toast notification
 *
 * @param {Toast} props - Toast properties
 * @returns {Object} Toast control object with id, dismiss and update methods
 */
function toast({ ...props }: Toast) {
  const id = genId()

  /**
   * Updates an existing toast by ID
   *
   * @param {ToasterToast} props - Updated toast properties
   */
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  
  /**
   * Dismisses the toast
   */
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  // Add the toast to the state
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Return controls for this toast
  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Custom hook for accessing and managing toast notifications
 *
 * @returns {Object} Toast state and control methods
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  // Subscribe to toast state changes
  React.useEffect(() => {
    // Add this component as a listener
    listeners.push(setState)
    
    // Remove listener on cleanup
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
