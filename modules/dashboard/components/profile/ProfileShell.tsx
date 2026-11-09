import { PageHeader, type PageHeaderProps } from "@/components/ui/PageHeader";

/*
 * Page frame for the (app-wide) profile routes. On md+ the profile panel floats in the
 * sidebar column and the content sits in .app-page, so the page title lands on the same
 * x/y as every sidebar layout. Below md the title comes first and the panel stacks under
 * it (the heading is rendered once per breakpoint; the other copy is display:none).
 */
export default function ProfileShell({
  panel,
  header,
  children,
  contentClassName = "",
}: {
  panel: React.ReactNode;
  header: PageHeaderProps;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex min-h-full flex-col md:flex-row md:items-start">
      <div className="app-page pb-6 md:hidden">
        <PageHeader {...header} className="mb-0" />
      </div>
      {panel}
      <div className="app-page min-w-0 flex-1">
        <PageHeader {...header} className="hidden md:block" />
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
