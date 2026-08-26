
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function OnboardingChecker({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		const onboardingComplete = localStorage.getItem('onboardingComplete')
		if (onboardingComplete !== 'true') {
			router.push(`/onboarding?redirect=${encodeURIComponent(pathname)}`)
		}
	}, [pathname, router])

	const onboardingComplete = typeof window !== 'undefined' && localStorage.getItem('onboardingComplete');

	return <>{onboardingComplete === 'true' ? children : null}</>
}
