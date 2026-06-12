export * from './types'
export * from './createProfileApi'
export * from './profileDisplayInitials'
export * from './UserProfileContext'
export * from './canAccessByViewPermission'
export * from './useLogoutWithoutLoginPermission'
export * from './academicContextTypes'
export * from './createAcademicContextApi'
export { UserAcademicContext, type UserAcademicContextProps } from './components/UserAcademicContext'
export { AccessGuard, type AccessGuardProps } from './AccessGuard'

// — New shared abstractions —
export type { StandardMeProfile } from './StandardMeProfile'
export { createStandardProfileApi } from './createStandardProfileApi'
export {
  PermissionGate,
  type PermissionGateMode,
  type PermissionGateProps,
} from './PermissionGate'
export {
  resolveUserDisplay,
  type TokenUserClaims,
  type UserDisplayResult,
} from './resolveUserDisplay'
export {
  createApplicationsApi,
  type ApplicationRef,
} from './createApplicationsApi'
