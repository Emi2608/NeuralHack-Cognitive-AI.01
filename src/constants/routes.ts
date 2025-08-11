/**
 * Application route constants
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CONSENT: '/consent',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  ASSESSMENTS: '/assessments',
  ASSESSMENT_MOCA: '/assessments/moca',
  ASSESSMENT_PHQ9: '/assessments/phq9',
  ASSESSMENT_MMSE: '/assessments/mmse',
  ASSESSMENT_AD8: '/assessments/ad8',
  ASSESSMENT_PARKINSONS: '/assessments/parkinsons',
  RESULTS: '/results',
  EXPORT: '/export',
  SETTINGS: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];