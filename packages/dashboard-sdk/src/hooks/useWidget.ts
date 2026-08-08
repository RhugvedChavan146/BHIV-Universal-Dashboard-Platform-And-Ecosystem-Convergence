import { useCallback, useEffect, useState } from "react";
import { useDashboardSDK } from "../sdk/useDashboardSDK";
import type { SDKWidgetConfig } from "../sdk/types";

export interface UseWidgetResult {
  /** Current widget config, or `undefined` if nothing is registered under this id yet */
  widget: SDKWidgetConfig | undefined;
  /** Register (or replace) this widget's config */
  register: (config: SDKWidgetConfig) => void;
  /** Remove this widget from the registry */
  unregister: () => void;
  /** Shallow-merge a patch into this widget's `props`, registering it if needed */
  updateProps: (props: Record<string, unknown>) => void;
}

/**
 * `useWidget` is the extension-point hook for widgets: it reads and writes
 * a single widget's entry in the SDK's runtime widget registry, and
 * re-renders whenever that widget is registered, updated, or unregistered
 * (from anywhere in the app). Must be used within a `DashboardProvider`.
 */
export function useWidget(widgetId: string): UseWidgetResult {
  const { sdk } = useDashboardSDK();
  const [widget, setWidget] = useState<SDKWidgetConfig | undefined>(() => sdk.getWidget(widgetId));

  useEffect(() => {
    setWidget(sdk.getWidget(widgetId));

    const offRegistered = sdk.on<SDKWidgetConfig>("widget:registered", (registered) => {
      if (registered.id === widgetId) setWidget(registered);
    });
    const offUnregistered = sdk.on<string>("widget:unregistered", (id) => {
      if (id === widgetId) setWidget(undefined);
    });

    return () => {
      offRegistered();
      offUnregistered();
    };
  }, [sdk, widgetId]);

  const register = useCallback((config: SDKWidgetConfig) => sdk.registerWidget(config), [sdk]);

  const unregister = useCallback(() => sdk.unregisterWidget(widgetId), [sdk, widgetId]);

  const updateProps = useCallback(
    (props: Record<string, unknown>) => {
      const current = sdk.getWidget(widgetId);
      sdk.registerWidget({
        id: widgetId,
        title: current?.title ?? widgetId,
        category: current?.category,
        colSpan: current?.colSpan,
        height: current?.height,
        defaultVisible: current?.defaultVisible,
        props: { ...current?.props, ...props },
      });
    },
    [sdk, widgetId],
  );

  return { widget, register, unregister, updateProps };
}
