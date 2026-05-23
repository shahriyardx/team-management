import Link from "next/link"
import Image from "next/image"

export function SiteLogo() {
  return (
    <Link href="/">
      <Image src="/logo.png" alt="WeirdTeams" width={36} height={36} className="size-9" />
    </Link>
  )
}
