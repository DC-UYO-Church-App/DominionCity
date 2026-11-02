"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { isActive, type NavGroup } from "./nav"

/**
 * One navigation group, rendered for both the desktop rail and the mobile
 * drawer so the two cannot drift apart — the same reason nav.ts exists.
 *
 * A group marked `collapsible` renders as a dropdown. Anything else renders
 * exactly as before: a static label with its links beneath.
 */
export function NavGroupSection({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup
  pathname: string
  /** Lets the drawer close itself when a destination is chosen. */
  onNavigate?: () => void
}) {
  const hasActiveChild = group.items.some((item) => isActive(item.href, pathname))
  const [isOpen, setIsOpen] = useState(hasActiveChild)

  /* Navigating into the group opens it. Without this a member who lands on a
     giving page from elsewhere would see the group collapsed over the page
     they are actually looking at. Navigating away leaves it as they left it. */
  useEffect(() => {
    if (hasActiveChild) setIsOpen(true)
  }, [hasActiveChild])

  const links = group.items.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      className="dash-rail__link"
      aria-current={isActive(item.href, pathname) ? "page" : undefined}
    >
      <item.icon />
      {item.name}
    </Link>
  ))

  const GroupIcon = group.icon

  if (!group.collapsible) {
    return (
      <div className="dash-rail__group">
        <p className="dash-rail__label">
          {GroupIcon && <GroupIcon className="dash-rail__label-icon" aria-hidden="true" />}
          {group.label}
        </p>
        {links}
      </div>
    )
  }

  const panelId = `nav-group-${group.label.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div className="dash-rail__group">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="dash-rail__label dash-rail__label--toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="dash-rail__label-text">
          {GroupIcon && <GroupIcon className="dash-rail__label-icon" aria-hidden="true" />}
          {group.label}
        </span>
        <ChevronDown className={`dash-rail__chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" />
      </button>
      {/* Unmounted rather than hidden, so collapsed links stay out of the tab
          order and off the accessibility tree. */}
      {isOpen && <div id={panelId}>{links}</div>}
    </div>
  )
}
