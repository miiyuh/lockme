/**
 * Mobile Detection Hook
 *
 * A custom React hook that detects whether the current viewport is mobile-sized
 * based on a specified breakpoint. Uses the browser's matchMedia API for responsive
 * detection that updates automatically when the viewport changes.
 *
 * Features:
 * - Responsive detection based on screen width
 * - Updates automatically on viewport resize
 * - Cleans up event listeners when component unmounts
 * - Returns boolean for easy conditional rendering
 */

import * as React from "react"

/**
 * Mobile breakpoint in pixels
 * Viewports narrower than this value will be considered mobile
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect mobile viewport
 *
 * Tracks whether the current viewport width is below the mobile breakpoint
 * and updates automatically when the window is resized.
 *
 * @returns {boolean} True if viewport is mobile-sized, false otherwise
 */
export function useIsMobile() {
  // State to track mobile status, initially undefined until browser is available
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create a media query list for tracking viewport changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    /**
     * Updates the mobile state based on current window width
     */
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Add event listener for responsive updates
    mql.addEventListener("change", onChange)

    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Cleanup function to remove event listener when component unmounts
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Convert undefined to false for consistent boolean return value
  return !!isMobile
}
