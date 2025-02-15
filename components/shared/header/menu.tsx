import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EllipsisVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import CartButton from "./cart-button";
import LanguageSwitcher from "./language-switcher";
import ThemeSwitcher from "./theme-switcher";
import UserButton from "./user-button";

const Menu = ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const t = useTranslations();
  return (
    <div className="flex justify-end">
      <nav className="md:flex gap-3 hidden w-full">
        <LanguageSwitcher />
        <ThemeSwitcher />
        <UserButton />
        {forAdmin ? null : <CartButton />}
      </nav>
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger className="align-middle header-button">
            <EllipsisVertical className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent className="bg-black text-white  flex flex-col items-start  ">
            <SheetHeader className="w-full">
              <div className="flex items-center justify-between ">
                <SheetTitle className="  ">{t("Header.Site Menu")}</SheetTitle>
                <SheetDescription></SheetDescription>
              </div>
            </SheetHeader>
            <LanguageSwitcher />
            <ThemeSwitcher />
            <UserButton />
            <CartButton />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
