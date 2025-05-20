
"use client";

import { useState, useEffect } from 'react';

const CurrentDateTime = () => {
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      let tzAbbreviation = '';
      try {
        const formatter = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' });
        const parts = formatter.formatToParts(now);
        const timeZoneNamePart = parts.find(part => part.type === 'timeZoneName');
        if (timeZoneNamePart) {
          tzAbbreviation = timeZoneNamePart.value;
        }
      } catch (e) {
        // Fallback or error handling if Intl.DateTimeFormat fails for any reason
        console.warn("Could not determine timezone abbreviation:", e);
      }

      const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${tzAbbreviation ? ` [${tzAbbreviation}]` : ''}`;
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime(); // Set immediately on client mount
    const intervalId = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  if (!currentDateTime) {
    return <span className="text-xs text-muted-foreground">Loading time...</span>;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {currentDateTime}
    </span>
  );
};

export default CurrentDateTime;
