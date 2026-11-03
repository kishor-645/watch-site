import "./admin.css";

/** Pass-through layout: only loads the admin console stylesheet (tokens scoped to `[data-admin]`). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
