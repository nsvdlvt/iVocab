import { getWidgets } from "@/lib/admin/dashboard-registry";

export function DashboardGrid() {
  const widgets = getWidgets();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {widgets.map((widget) => {
        const spanClassMap: Record<number, string> = {
          1: "lg:col-span-1 md:col-span-1",
          2: "lg:col-span-2 md:col-span-2",
          3: "lg:col-span-3 md:col-span-2",
          4: "lg:col-span-4 md:col-span-2",
        };
        const spanClass = spanClassMap[widget.span || 1] || "lg:col-span-1";
        const WidgetComponent = widget.component;
        
        return (
          <div key={widget.id} className={spanClass}>
            <WidgetComponent />
          </div>
        );
      })}
    </div>
  );
}
