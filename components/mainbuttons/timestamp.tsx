import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { formatDistanceToNow, format } from 'date-fns';

interface TimestampProps {
  // De timestamp kan een ISO string, een getal (milliseconds) of een Date object zijn
  timestamp: string | number | Date;
}

const Timestamp: React.FC<TimestampProps> = ({ timestamp }) => {
  // Zorgt ervoor dat we altijd met een Date object werken
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  const now = Date.now();
  const timeDifference = now - date.getTime();
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 uur in milliseconden

  let displayText = 'posted ';

  if (timeDifference < twentyFourHoursInMs) {
    // Als de post minder dan 24 uur geleden is geplaatst,
    // gebruiken we een relatieve tijdsaanduiding
    displayText += formatDistanceToNow(date, { addSuffix: true });
  } else {
    // Als de post ouder is dan 24 uur tonen we de datum.
    // Het patroon "MMMM do" geeft bijvoorbeeld "April 7th" (Engelse notatie).
    displayText += format(date, 'MMMM do');
  }

  return <Text style={styles.timestamp}>{displayText}</Text>;
};

const styles = StyleSheet.create({
  timestamp: {
    fontSize: 12,
    color: '#888', // Pas deze kleur aan naar je design
  },
});

export default Timestamp;
