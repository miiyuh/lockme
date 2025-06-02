
"use client";

/**
 * CurrentDateTime Component
 * 
 * A real-time component that displays the current date and time
 * with seconds precision and timezone information.
 * 
 * Features:
 * - Updates every second to show accurate time
 * - Displays date in YYYY-MM-DD format
 * - Shows time in 24-hour format with seconds
 * - Includes local timezone abbreviation
 * - Handles timezone detection gracefully
 */

import { useState, useEffect } from 'react';

/**
 * CurrentDateTime Component
 * 
 * Displays the current date and time with timezone information,
 * updating in real-time every second.
 * 
 * @returns {JSX.Element} A span element containing formatted date and time
 */
const CurrentDateTime = () => {
  // State to store the formatted date-time string
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Updates the current date and time
     * Formats the date, time, and timezone into a standardized string
     */
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date components with leading zeros
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      // Get timezone abbreviation using Intl API
      let tzAbbreviation = '';
      try {
        const formatter = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' });
        const parts = formatter.formatToParts(now);
        const timeZoneNamePart = parts.find(part => part.type === 'timeZoneName');
        if (timeZoneNamePart) {
          tzAbbreviation = timeZoneNamePart.value;
        }
      } catch (e) {
        // Fallback if Intl.DateTimeFormat fails
        console.warn("Could not determine timezone abbreviation:", e);
      }      // Assemble the formatted date-time string with timezone
      const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${tzAbbreviation ? ` [${tzAbbreviation}]` : ''}`;
      setCurrentDateTime(formattedDateTime);
    };

    // Initialize immediately
    updateDateTime();
    
    // Set up interval to update every second
    const intervalId = setInterval(updateDateTime, 1000);

    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Loading state while client-side javascript initializes
  if (!currentDateTime) {
    return (
      <span className="text-xs text-muted-foreground">
        Loading time...
      </span>
    );
  }

  // Render the current date and time
  return (
    <span className="text-xs text-muted-foreground">
      {currentDateTime}
    </span>
  );
};

export default CurrentDateTime;
