
'use client'

import { create } from 'zustand'
import {
	createContext,
	useContext,
	useRef,
	type ReactNode,
} from 'react'

interface OnboardingState {
	onboardingStep: number
	setOnboardingStep: (step: number) => void
}

const createOnboardingStore = () =>
	create<OnboardingState>((set) => ({
		onboardingStep: 0,
		setOnboardingStep: (step) => set({ onboardingStep: step }),
	}))

const OnboardingContext = createContext<ReturnType<typeof createOnboardingStore> | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
	const storeRef = useRef<ReturnType<typeof createOnboardingStore>>()
	if (!storeRef.current) {
		storeRef.current = createOnboardingStore()
	}

	return (
		<OnboardingContext.Provider value={storeRef.current}>
			{children}
		</OnboardingContext.Provider>
	)
}

export function useOnboarding() {
	const context = useContext(OnboardingContext)
	if (!context) {
		throw new Error('useOnboarding must be used within an OnboardingProvider')
	}
	return context()
}
