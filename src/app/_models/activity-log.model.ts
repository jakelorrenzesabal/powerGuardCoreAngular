export interface ActivityLog {
    activityLogId: number;
    accountId: number;
    actionType: string;
    actionDetails: string;
    timestamp: string;
}
  export interface ActivityLogsResponse {
    success?: boolean;
    data?: {
        total: number;
        logs: ActivityLog[];
    };
  }
  
  export default ActivityLog;