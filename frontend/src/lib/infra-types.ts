export interface CredentialDto {
  id: number; name: string; domain: string; username: string; hostCount: number
}
export interface HostDto {
  id: number; hostname: string; port: number; useHttps: boolean;
  credentialId: number; credentialName: string; description: string;
  enabled: boolean; lastSeen: string | null; serviceCount: number
}
export interface ServiceGroupDto {
  id: number; name: string; description: string; sortOrder: number; serviceCount: number
}
export interface MonitoredServiceDto {
  id: number; hostId: number; hostname: string; groupId: number;
  groupName: string; serviceName: string; displayName: string
}
export interface MonitoringGroupDto {
  groupId: number; groupName: string; groupDescription: string;
  services: MonitoringServiceDto[]; runningCount: number;
  stoppedCount: number; unreachableCount: number
}
export interface MonitoringServiceDto {
  serviceId: number; serviceName: string; displayName: string;
  hostId: number; hostname: string; status: string;
  pid: number | null; checkedAt: string | null; errorMessage: string | null
}
export interface AuditLogDto {
  id: number; timestamp: string; username: string; action: string;
  hostname: string | null; serviceName: string | null;
  result: string; errorDetail: string | null
}
export interface PageResponse<T> {
  content: T[]; totalElements: number; totalPages: number;
  number: number; size: number
}
