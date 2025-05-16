import useSettingStore from "@/hooks/use-setting-store";
import { ClientSetting } from "@/types";
import React, { useEffect, useState } from "react";

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting;
  children: React.ReactNode;
}) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    useSettingStore.setState({
      setting,
    });
    setRendered(true);
  }, [setting]);
  if (!rendered) {
    return null;
  }

  return children;
}
