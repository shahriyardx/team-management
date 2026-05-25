"use client"

import { AppProgressBar } from "next-nprogress-bar"

export function NavigationProgress() {
  return (
    <AppProgressBar
      height="4px"
      color="#6366f1"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
