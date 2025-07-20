import { i18n } from '@/i18n-config'
import { usePathname } from 'next/navigation'
import useCartService from './use-cart-service'
import useDeviceType from './use-device-type'

const locales = i18n.locales
  .filter((locale) => locale.code !== 'en-US')
  .map((locale) => locale.code)

const isNotInPaths = (s: string) => {
  const localePattern = `/(?:${locales.join('|')})` // Match locales
  const pathsPattern = `^(?:${localePattern})?(?:/$|/cart$|/checkout$|/sign-in$|/sign-up$|/order(?:/.*)?$|/account(?:/.*)?$|/admin(?:/.*)?$)?$`
  return !new RegExp(pathsPattern).test(s)
}

function useCartSidebar() {
  const {
    cart: { items },
  } = useCartService()
  const deviceType = useDeviceType()
  const currentPath = usePathname()

  return (
    items.length > 0 && deviceType === 'desktop' && isNotInPaths(currentPath)
  )
}

export default useCartSidebar
