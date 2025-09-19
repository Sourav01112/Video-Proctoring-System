import React from 'react';
import type { AlertEvent, DetectionAlertsProps } from '../types';



export const DetectionAlerts: React.FC<DetectionAlertsProps> = ({ 
  alerts, 
  maxAlerts = 5 
}) => {
  const recentAlerts = alerts.slice(-maxAlerts);

  return (
    <div className="detection-alerts">
      <h3>Real-time Alerts</h3>
      {recentAlerts.length === 0 ? (
        <p className="no-alerts">No alerts detected</p>
      ) : (
        <ul className="alerts-list">
          {recentAlerts.map((alert, index) => (
            <li 
              key={index} 
              className={`alert-item ${alert.type.toLowerCase()}`}
            >
              <span className="alert-time">
                {alert.timestamp.toLocaleTimeString()}
              </span>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-confidence">
                {Math.round(alert.confidence * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};