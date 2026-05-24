"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import NProgress from "nprogress"
import "nprogress/nprogress.css"

export function NavigationProgress() {
  const pathname = usePathname()

  useEffect(() => {
    NProgress.configure({ showSpinner: false, minimum: 0.1 })
  }, [])

  useEffect(() => {
    const original = window.history.pushState
    window.history.pushState = function (...args) {
      NProgress.start()
      return original.apply(this, args)
    }
    return () => {
      window.history.pushState = original
    }
  }, [])

  useEffect(() => {
    NProgress.done()
  }, [pathname])

  return null
}
